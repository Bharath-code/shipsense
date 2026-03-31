import { internalAction, internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getPlanConfig, type PlanType } from './plan';
import { getAuthUserId } from '@convex-dev/auth/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function buildReportHtml(
	userName: string,
	repos: Array<{
		name: string;
		owner: string;
		stars: number;
		starsLast7d: number;
		healthScore: number;
		trend: string;
		openIssues: number;
		openPRs: number;
		insight?: string;
		tasks: Array<{ taskText: string; priority: number }>;
	}>
): string {
	const repoRows = repos
		.map(
			(repo) => `
		<tr>
			<td style="padding: 12px; border-bottom: 1px solid #333;">
				<strong style="color: #fff;">${repo.name}</strong><br>
				<span style="color: #888; font-size: 12px;">by ${repo.owner}</span>
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
				<span style="font-size: 20px; font-weight: bold; color: #fbbf24;">${repo.stars}</span>
				${repo.starsLast7d > 0 ? `<br><span style="color: #22c55e; font-size: 11px;">+${repo.starsLast7d} this week</span>` : ''}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
				<span style="font-size: 20px; font-weight: bold; color: ${repo.healthScore >= 70 ? '#22c55e' : repo.healthScore >= 40 ? '#fbbf24' : '#ef4444'};">${repo.healthScore}</span>
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
				<span style="color: ${repo.trend === 'up' ? '#22c55e' : repo.trend === 'down' ? '#ef4444' : '#888'};">${repo.trend === 'up' ? '↑' : repo.trend === 'down' ? '↓' : '→'}</span>
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">
				<span style="color: #888;">${repo.openIssues} issues</span><br>
				<span style="color: #888;">${repo.openPRs} PRs</span>
			</td>
		</tr>`
		)
		.join('');

	const actionItems = repos
		.flatMap((r) => r.tasks.filter((t) => t.priority <= 3).map((t) => ({ ...t, repo: r.name })))
		.slice(0, 5);

	const actionRows = actionItems
		.map(
			(item) => `
		<tr>
			<td style="padding: 8px; border-bottom: 1px solid #333;">
				<span style="color: ${item.priority === 1 ? '#ef4444' : item.priority === 2 ? '#fbbf24' : '#888'};">${item.priority === 1 ? '🔴' : item.priority === 2 ? '🟡' : '⚪'}</span>
			</td>
			<td style="padding: 8px; border-bottom: 1px solid #333; color: #ccc;">
				${item.taskText}
			</td>
			<td style="padding: 8px; border-bottom: 1px solid #333; color: #888; font-size: 12px;">
				${item.repo}
			</td>
		</tr>`
		)
		.join('');

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>ShipSense Weekly Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
	<div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
		<!-- Header -->
		<div style="text-align: center; margin-bottom: 40px;">
			<h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700;">🚀 ShipSense</h1>
			<p style="color: #888; margin: 8px 0 0 0;">Weekly Growth Report</p>
		</div>

		<!-- Stats Summary -->
		<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
			<h2 style="color: #fff; margin: 0 0 16px 0; font-size: 18px;">Hey ${userName}! 👋</h2>
			<p style="color: #aaa; margin: 0; line-height: 1.6;">
				Here's how your ${repos.length} repos performed this week. Keep shipping! 🚢
			</p>
		</div>

		<!-- Repository Table -->
		<div style="background: #1a1a2e; border-radius: 16px; overflow: hidden; margin-bottom: 24px; border: 1px solid #333;">
			<table style="width: 100%; border-collapse: collapse;">
				<thead>
					<tr style="background: #0f0f0f;">
						<th style="padding: 16px 12px; text-align: left; color: #888; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Repository</th>
						<th style="padding: 16px 12px; text-align: center; color: #888; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Stars</th>
						<th style="padding: 16px 12px; text-align: center; color: #888; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Health</th>
						<th style="padding: 16px 12px; text-align: center; color: #888; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Trend</th>
						<th style="padding: 16px 12px; text-align: center; color: #888; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Activity</th>
					</tr>
				</thead>
				<tbody>
					${repoRows}
				</tbody>
			</table>
		</div>

		<!-- Priority Actions -->
		${
			actionRows
				? `
		<div style="background: #1a1a2e; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
			<h3 style="color: #fff; margin: 0 0 16px 0; font-size: 16px;">🎯 Priority Actions</h3>
			<table style="width: 100%; border-collapse: collapse;">
				<tbody>
					${actionRows}
				</tbody>
			</table>
		</div>
		`
				: ''
		}

		<!-- Footer -->
		<div style="text-align: center; padding: 20px;">
			<p style="color: #666; font-size: 12px; margin: 0;">
				Sent by <a href="https://shipsense.app" style="color: #6366f1; text-decoration: none;">ShipSense</a> — Track your open-source growth
			</p>
			<p style="color: #444; font-size: 11px; margin: 8px 0 0 0;">
				<a href="https://shipsense.app/dashboard/settings" style="color: #666; text-decoration: underline;">Manage email preferences</a>
			</p>
		</div>
	</div>
</body>
</html>`;
}

export const sendWeeklyReport = internalAction({
	args: { userId: v.id('users'), email: v.string() },
	handler: async (ctx, { userId, email }) => {
		if (!RESEND_API_KEY) {
			console.warn('RESEND_API_KEY not configured. Skipping email.');
			return;
		}

		const profile = await ctx.runQuery(internal.users.getUserProfile, { userId });
		if (!profile) return;

		if (!profile.emailReportsEnabled) {
			console.log(`User ${userId} has email reports disabled. Skipping.`);
			return;
		}

		if (profile.lastReportSentAt) {
			const daysSinceLastReport = (Date.now() - profile.lastReportSentAt) / (1000 * 60 * 60 * 24);
			if (daysSinceLastReport < 7) {
				console.log(
					`User ${userId} received report ${daysSinceLastReport.toFixed(1)} days ago. Skipping.`
				);
				return;
			}
		}

		const repos = await ctx.runQuery(internal.repos.getUserReposForReport, { userId });
		if (repos.length === 0) {
			console.log(`User ${userId} has no repos. Skipping report.`);
			return;
		}

		const repoData = await Promise.all(
			repos.map(async (repo) => {
				const snapshot = await ctx.runQuery(internal.collector.getLatestSnapshot, {
					repoId: repo._id
				});
				const score = await ctx.runQuery(internal.scorer.getLatestScore, { repoId: repo._id });
				const insight = await ctx.runQuery(internal.dashboard.getRepoInsightsForReport, {
					repoId: repo._id
				});
				const tasks = await ctx.runQuery(internal.dashboard.getOpenTasksForReport, {
					repoId: repo._id
				});

				return {
					name: repo.name,
					owner: repo.owner,
					stars: snapshot?.stars ?? 0,
					starsLast7d: snapshot?.starsLast7d ?? 0,
					healthScore: score?.healthScore ?? 0,
					trend: score?.trend ?? 'stable',
					openIssues: snapshot?.issuesOpen ?? 0,
					openPRs: snapshot?.prsOpen ?? 0,
					insight: insight?.summary,
					tasks: tasks.map((t: any) => ({ taskText: t.taskText, priority: t.priority }))
				};
			})
		);

		const html = buildReportHtml(profile.githubUsername || 'Developer', repoData);

		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'ShipSense <reports@shipsense.app>',
				to: email,
				subject: `🚀 Your Weekly ShipSense Report — ${repoData.length} repos tracked`,
				html
			})
		});

		if (response.ok) {
			await ctx.runMutation(internal.email.updateLastReportSent, { userId });
			console.log(`Weekly report sent to ${email}`);
		} else {
			console.error('Failed to send email via Resend:', await response.text());
		}
	}
});

export const updateLastReportSent = internalMutation({
	args: { userId: v.id('users') },
	handler: async (ctx, { userId }) => {
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (profile) {
			await ctx.db.patch(profile._id, { lastReportSentAt: Date.now() });
		}
	}
});

export const getMyEmailPreference = query({
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
			emailReportsEnabled: profile.emailReportsEnabled,
			lastReportSentAt: profile.lastReportSentAt
		};
	}
});

export const setEmailPreference = internalMutation({
	args: { userId: v.id('users'), enabled: v.boolean() },
	handler: async (ctx, { userId, enabled }) => {
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (profile) {
			await ctx.db.patch(profile._id, { emailReportsEnabled: enabled });
		}
	}
});

export const toggleEmailReports = mutation({
	args: { enabled: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Unauthenticated');

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (profile) {
			await ctx.db.patch(profile._id, { emailReportsEnabled: args.enabled });
		}
	}
});
