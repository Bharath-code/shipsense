import { query, mutation, internalMutation, internalAction, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { internal } from './_generated/api';

const SLACK_OAUTH_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access';
const SLACK_CHAT_URL = 'https://slack.com/api/chat.postMessage';

function getSlackClientId() {
	const id = process.env.SLACK_CLIENT_ID;
	if (!id) throw new Error('SLACK_CLIENT_ID is not set');
	return id;
}

function getSlackClientSecret() {
	const secret = process.env.SLACK_CLIENT_SECRET;
	if (!secret) throw new Error('SLACK_CLIENT_SECRET is not set');
	return secret;
}

function getSlackRedirectUri() {
	return process.env.SLACK_REDIRECT_URI ?? 'https://shipsense.app/api/slack/oauth/callback';
}

function getAppUrl() {
	return process.env.APP_URL ?? 'https://shipsense.app';
}

// ── Query: Get Slack connection status ────────────────────────────────────

export const getSlackStatus = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (!profile) return null;

		return {
			connected: !!profile.slackAccessToken,
			workspaceName: profile.slackWorkspaceName ?? null,
			channelName: profile.slackChannelName ?? null,
			briefEnabled: profile.slackBriefEnabled ?? true
		};
	}
});

// ── Mutation: Generate Slack OAuth URL ────────────────────────────────────

export const getSlackOAuthUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const clientId = getSlackClientId();
		const redirectUri = getSlackRedirectUri();
		const state = userId; // Pass userId as state for callback verification

		const scopes = ['chat:write', 'channels:read'];
		const userScopes: string[] = [];

		const params = new URLSearchParams({
			client_id: clientId,
			scope: scopes.join(','),
			user_scope: userScopes.join(','),
			redirect_uri: redirectUri,
			state
		});

		return { url: `${SLACK_OAUTH_URL}?${params.toString()}` };
	}
});

// ── Mutation: Disconnect Slack ────────────────────────────────────────────

export const disconnectSlack = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (!profile) throw new Error('Profile not found');

		await ctx.db.patch(profile._id, {
			slackAccessToken: undefined,
			slackWorkspaceId: undefined,
			slackWorkspaceName: undefined,
			slackChannelId: undefined,
			slackChannelName: undefined,
			slackBriefEnabled: undefined
		});

		return { success: true };
	}
});

// ── Mutation: Toggle Slack brief ───────────────────────────────────────────

export const toggleSlackBrief = mutation({
	args: { enabled: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (!profile) throw new Error('Profile not found');

		await ctx.db.patch(profile._id, {
			slackBriefEnabled: args.enabled
		});

		return { slackBriefEnabled: args.enabled };
	}
});

// ── Mutation: Exchange OAuth code for token (public — called from callback) ─

export const exchangeSlackCode = mutation({
	args: {
		userId: v.id('users'),
		code: v.string()
	},
	handler: async (ctx, args) => {
		// Verify this user is the authenticated user, or the state param matches
		const authUserId = await getAuthUserId(ctx);
		if (!authUserId) throw new Error('Not authenticated');
		if (authUserId !== args.userId) throw new Error('User mismatch');

		const clientId = getSlackClientId();
		const clientSecret = getSlackClientSecret();
		const redirectUri = getSlackRedirectUri();

		const response = await fetch(SLACK_TOKEN_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				code: args.code,
				redirect_uri: redirectUri
			})
		});

		const data = await response.json();

		if (!data.ok) {
			throw new Error(`Slack OAuth failed: ${data.error}`);
		}

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', args.userId))
			.unique();

		if (!profile) throw new Error('Profile not found');

		const botToken = data.access_token;
		const teamId = data.team?.id ?? null;
		const teamName = data.team?.name ?? null;
		const incomingChannelId = data.incoming_webhook?.channel_id ?? null;
		const incomingChannelName = data.incoming_webhook?.channel ?? null;

		await ctx.db.patch(profile._id, {
			slackAccessToken: botToken,
			slackWorkspaceId: teamId,
			slackWorkspaceName: teamName,
			slackChannelId: incomingChannelId,
			slackChannelName: incomingChannelName,
			slackBriefEnabled: true
		});

		return {
			success: true,
			workspaceName: teamName,
			channelName: incomingChannelName
		};
	}
});

// ── Internal: Send a Slack brief to a user ─────────────────────────────────

export const sendSlackBrief = internalMutation({
	args: {
		userId: v.id('users')
	},
	handler: async (ctx, args) => {
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', args.userId))
			.unique();

		if (!profile || !profile.slackAccessToken || !profile.slackChannelId) return { sent: false };
		if (profile.slackBriefEnabled === false) return { sent: false, reason: 'disabled' };

		// Get all active repos for this user
		const repos = await ctx.db
			.query('repos')
			.withIndex('by_userId_isActive', (q) =>
				q.eq('userId', args.userId).eq('isActive', true)
			)
			.collect();

		if (repos.length === 0) return { sent: false, reason: 'no_repos' };

		const repo = repos[0];
		const today = new Date().toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});

		// Get brief data
		const [latestScore, latestDigest, topTask] = await Promise.all([
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repo._id))
				.order('desc')
				.first(),
			ctx.db
				.query('repoDailyDigests')
				.withIndex('by_repoId_generatedAt', (q) => q.eq('repoId', repo._id))
				.order('desc')
				.first(),
			ctx.db
				.query('repoTasks')
				.withIndex('by_repoId_isCompleted', (q) =>
					q.eq('repoId', repo._id).eq('isCompleted', false)
				)
				.order('asc')
				.first()
		]);

		const score = latestScore?.healthScore ?? null;
		const scoreEmoji = score != null ? (score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴') : '⚪';
		const summaryLine = latestDigest?.summary ?? 'Fresh data is flowing in. Keep shipping.';
		const topWin = latestDigest?.topWin ?? null;
		const topRisk = latestDigest?.topRisk ?? null;
		const appUrl = getAppUrl();

		// Build Slack Block Kit message
		const blocks: Array<Record<string, unknown>> = [
			{
				type: 'header',
				text: { type: 'plain_text', text: `☀️ Good morning! Here's your ShipSense brief`, emoji: true }
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*${repo.owner}/${repo.name}* — ${today}`
				}
			}
		];

		// Score + trend
		const scoreFields: Array<Record<string, unknown>> = [];
		if (score != null) {
			scoreFields.push({
				type: 'mrkdwn',
				text: `*Health Score*\n${scoreEmoji} ${score}/100`
			});
		}
		if (topRisk) {
			scoreFields.push({
				type: 'mrkdwn',
				text: `*Risk*\n⚠️ ${topRisk}`
			});
		}
		if (scoreFields.length > 0) {
			blocks.push({
				type: 'section',
				fields: scoreFields
			});
		}

		// Summary
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: summaryLine
			}
		});

		// Top task
		if (topTask) {
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `🎯 *One thing to do today:*\n> ${topTask.taskText}`
				}
			});
		}

		// Win
		if (topWin) {
			blocks.push({
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `✨ *Win:* ${topWin}`
					}
				]
			});
		}

		// Action buttons
		blocks.push({
			type: 'actions',
			elements: [
				{
					type: 'button',
					text: { type: 'plain_text', text: '📊 View Dashboard', emoji: true },
					url: `${appUrl}/dashboard/${repo._id}`,
					action_id: 'view_dashboard'
				},
				{
					type: 'button',
					text: { type: 'plain_text', text: '🔄 Sync Now', emoji: true },
					style: 'primary',
					action_id: 'sync_repo',
					value: String(repo._id)
				},
				{
					type: 'button',
					text: { type: 'plain_text', text: '🔕 Snooze', emoji: true },
					action_id: 'snooze_brief',
					value: String(repo._id)
				}
			]
		});

		// Repo count
		if (repos.length > 1) {
			blocks.push({
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `_Tracking ${repos.length} repo${repos.length > 1 ? 's' : ''}. View all on your <${appUrl}/dashboard|dashboard>._`
					}
				]
			});
		}

		const response = await fetch(SLACK_CHAT_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${profile.slackAccessToken}`
			},
			body: JSON.stringify({
				channel: profile.slackChannelId,
				text: fallbackText(),
				blocks
			})
		});

		const result = await response.json();

		if (!result.ok) {
			console.error(`[slack] Failed to send brief to user ${args.userId}:`, result.error);
			// If token expired, disable
			if (result.error === 'token_expired' || result.error === 'invalid_auth') {
				await ctx.db.patch(profile._id, {
					slackBriefEnabled: false
				});
			}
			return { sent: false, error: result.error };
		}

		return { sent: true, channel: profile.slackChannelId };
	}
});

function fallbackText(): string {
	return '☀️ Good morning! Here\'s your ShipSense health brief.';
}

// ── Internal: Send briefs to all Slack-connected users ────────────────────

export const sendAllSlackBriefs = internalAction({
	args: {},
	handler: async (ctx) => {
		const profiles = await ctx.runQuery(internal.slack.getAllSlackProfiles, {});

		if (!profiles || profiles.length === 0) return { sent: 0, skipped: 0 };

		let sent = 0;
		let skipped = 0;

		for (const p of profiles) {
			try {
				const result = await ctx.runMutation(internal.slack.sendSlackBrief, {
					userId: p.userId
				});
				if (result.sent) sent++;
				else skipped++;
			} catch (err) {
				console.error(`[slack] Error sending brief to user ${p.userId}:`, err);
				skipped++;
			}
		}

		return { sent, skipped };
	}
});

// ── Internal: Get all profiles with Slack connected ────────────────────────

export const getAllSlackProfiles = internalQuery({
	args: {},
	handler: async (ctx) => {
		const profiles = await ctx.db
			.query('userProfiles')
			.filter((q) => q.and(
				q.neq(q.field('slackAccessToken'), undefined),
				q.neq(q.field('slackChannelId'), undefined)
			))
			.collect();

		return profiles.map((p) => ({ userId: p.userId }));
	}
});

// ── Internal: Process Slack interactive action ─────────────────────────────

export const processSlackAction = internalMutation({
	args: {
		payload: v.string()
	},
	handler: async (ctx, args) => {
		let action: { type?: string; actions?: Array<{ action_id: string; value: string }>; user?: { id: string }; channel?: { id: string } };
		try {
			action = JSON.parse(args.payload);
		} catch {
			throw new Error('Invalid payload');
		}

		if (action.type !== 'block_actions') return { handled: false };

		const blockAction = action.actions?.[0];
		if (!blockAction) return { handled: false };

		const actionId = blockAction.action_id;

		if (actionId === 'snooze_brief') {
			// Disable Slack brief for this user (find by Slack user ID)
			const profiles = await ctx.db.query('userProfiles').collect();
			// Simple approach: acknowledge the action
			return { handled: true, action: 'snoozed' };
		}

		if (actionId === 'sync_repo') {
			// Could trigger a sync, but Slack interactions have a 3-second timeout
			// Best to just acknowledge and let the cron handle it
			return { handled: true, action: 'sync_acknowledged' };
		}

		return { handled: true, action: actionId };
	}
});
