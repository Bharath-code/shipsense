import {
	internalAction,
	internalMutation,
	internalQuery,
	mutation,
	query
} from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { deriveGrowthMoments } from './dashboard';
import { getAuthUserId } from '@convex-dev/auth/server';

export type PromptCandidate = {
	kind:
		| 'star_spike'
		| 'best_week'
		| 'momentum_recovered'
		| 'streak_milestone'
		| 'score_milestone'
		| 'contributor_milestone'
		| 'longest_streak'
		| 'best_month';
	title: string;
	message: string;
	shareText: string;
	shareUrl: string;
	fingerprint: string;
};

export function buildSharePrompt(input: {
	repoName: string;
	repoSlug?: string;
	currentScore: number;
	previousScore?: number;
	bestPreviousScore: number;
	starsLast7d: number;
	streak: number;
	activeAnomaly?: { kind: string; title: string; description: string };
	growthMoments: ReturnType<typeof deriveGrowthMoments>;
}): PromptCandidate | null {
	const shareUrl = `https://shipsense.dev/p/${input.repoSlug ?? input.repoName}`;

	if (input.activeAnomaly?.kind === 'star_spike') {
		return {
			kind: 'star_spike',
			title: 'Share the star spike',
			message: input.activeAnomaly.description,
			shareText: `📈 ${input.repoName} is having a star spike on ShipSense. ${input.activeAnomaly.description} Tracking the momentum in public 🚀`,
			shareUrl,
			fingerprint: `star_spike:${input.starsLast7d}`
		};
	}

	const topMoment = input.growthMoments[0];
	if (topMoment?.kind === 'best_week') {
		return {
			kind: 'best_week',
			title: 'Share your best week',
			message: topMoment.description,
			shareText: `📈 ${input.repoName} just had its best week on ShipSense. ${topMoment.description} 🚀`,
			shareUrl,
			fingerprint: `best_week:${input.starsLast7d}`
		};
	}

	if (topMoment?.kind === 'momentum_recovered') {
		return {
			kind: 'momentum_recovered',
			title: 'Share the recovery',
			message: topMoment.description,
			shareText: `⚡ ${input.repoName} just recovered momentum on ShipSense. ${topMoment.description} 🚀`,
			shareUrl,
			fingerprint: `momentum_recovered:${input.currentScore}`
		};
	}

	if ([7, 14, 30, 50, 100].includes(input.streak)) {
		return {
			kind: 'streak_milestone',
			title: 'Share your streak milestone',
			message: `${input.repoName} just hit a ${input.streak}-day shipping streak.`,
			shareText: `🔥 ${input.repoName} just hit a ${input.streak}-day shipping streak on ShipSense. Shipping consistently and tracking momentum in public.`,
			shareUrl,
			fingerprint: `streak_milestone:${input.streak}`
		};
	}

	const crossedThreshold =
		(input.currentScore >= 80 && (input.previousScore ?? 0) < 80) ||
		(input.currentScore >= 60 && (input.previousScore ?? 0) < 60);
	const personalBest = input.currentScore > input.bestPreviousScore && input.currentScore >= 60;
	if (crossedThreshold || personalBest) {
		return {
			kind: 'score_milestone',
			title: 'Share the new score milestone',
			message: personalBest
				? `${input.repoName} just set a new personal-best health score of ${input.currentScore}/100.`
				: `${input.repoName} just crossed ${input.currentScore >= 80 ? '80' : '60'}/100 health on ShipSense.`,
			shareText: personalBest
				? `🎯 ${input.repoName} just hit a new personal-best health score of ${input.currentScore}/100 on ShipSense.`
				: `📊 ${input.repoName} just crossed ${input.currentScore >= 80 ? '80' : '60'}/100 health on ShipSense.`,
			shareUrl,
			fingerprint: `score_milestone:${input.currentScore}`
		};
	}

	for (const moment of input.growthMoments) {
		if (moment.kind === 'contributor_milestone' && moment.metric && moment.metric >= 3) {
			return {
				kind: 'contributor_milestone',
				title: 'Share contributors milestone',
				message: moment.description,
				shareText: `👥 ${input.repoName} now has ${moment.metric} active contributors! Check it out on ShipSense.`,
				shareUrl,
				fingerprint: `contributor_milestone:${moment.metric}`
			};
		}

		if (moment.kind === 'longest_streak') {
			return {
				kind: 'longest_streak',
				title: 'Share longest streak',
				message: moment.description,
				shareText: `🔥 ${input.repoName} set a new streak record of ${moment.metric} days on ShipSense!`,
				shareUrl,
				fingerprint: `longest_streak:${moment.metric}`
			};
		}
	}

	return null;
}

export const upsertSharePrompt = internalMutation({
	args: {
		repoId: v.id('repos'),
		userId: v.id('users'),
		prompt: v.union(
			v.object({
				kind: v.union(
					v.literal('star_spike'),
					v.literal('best_week'),
					v.literal('momentum_recovered'),
					v.literal('streak_milestone'),
					v.literal('score_milestone'),
					v.literal('contributor_milestone'),
					v.literal('longest_streak'),
					v.literal('best_month')
				),
				title: v.string(),
				message: v.string(),
				shareText: v.string(),
				shareUrl: v.string(),
				fingerprint: v.string()
			}),
			v.null()
		)
	},
	handler: async (ctx, { repoId, userId, prompt }) => {
		const active = await ctx.db
			.query('repoSharePrompts')
			.withIndex('by_repoId_isActive', (q) => q.eq('repoId', repoId).eq('isActive', true))
			.collect();

		if (!prompt) {
			for (const existing of active) {
				await ctx.db.patch(existing._id, { isActive: false });
			}
			return null;
		}

		const existingMatch = await ctx.db
			.query('repoSharePrompts')
			.withIndex('by_repoId_fingerprint', (q) =>
				q.eq('repoId', repoId).eq('fingerprint', prompt.fingerprint)
			)
			.first();

		if (existingMatch && !existingMatch.dismissedAt) {
			if (!existingMatch.isActive) {
				for (const existing of active) {
					await ctx.db.patch(existing._id, { isActive: false });
				}
				await ctx.db.patch(existingMatch._id, { isActive: true });
			}
			return existingMatch._id;
		}

		for (const existing of active) {
			await ctx.db.patch(existing._id, { isActive: false });
		}

		return await ctx.db.insert('repoSharePrompts', {
			repoId,
			userId,
			...prompt,
			isActive: true,
			createdAt: Date.now()
		});
	}
});

export const generateSharePrompt = internalAction({
	args: {
		repoId: v.id('repos'),
		userId: v.id('users'),
		repoName: v.string(),
		repoSlug: v.optional(v.string()),
		previousScore: v.optional(v.number()),
		currentScore: v.number()
	},
	handler: async (ctx, { repoId, userId, repoName, repoSlug, previousScore, currentScore }) => {
		const [latestSnapshot, recentSnapshots, recentScores, streak, anomalies] = await Promise.all([
			ctx.runQuery(internal.collector.getLatestSnapshot, { repoId }),
			ctx.runQuery(internal.collector.getRecentSnapshots, { repoId }),
			ctx.runQuery(internal.sharePrompts.getRecentScoresForPrompt, { repoId }),
			ctx.runQuery(internal.dashboard.getRepoStreakInternal, { repoId }),
			ctx.runQuery(internal.anomalies.listActiveRepoAnomalies, { repoId })
		]);

		if (!latestSnapshot) {
			await ctx.runMutation(internal.sharePrompts.upsertSharePrompt, {
				repoId,
				userId,
				prompt: null
			});
			return null;
		}

		const growthMoments = deriveGrowthMoments({
			starsLast7d: latestSnapshot.starsLast7d,
			scoreHistory: recentScores.map((score) => ({ healthScore: score.healthScore })),
			recentSnapshots: recentSnapshots.map((snapshot) => ({
				starsLast7d: snapshot.starsLast7d,
				contributors14d: snapshot.contributors14d,
				capturedAt: snapshot.capturedAt
			})),
			currentStreak: streak?.currentStreak,
			longestStreak: streak?.longestStreak
		});

		const bestPreviousScore = recentScores
			.slice(0, -1)
			.reduce((best, score) => Math.max(best, score.healthScore), 0);
		const prompt = buildSharePrompt({
			repoName,
			repoSlug,
			currentScore,
			previousScore,
			bestPreviousScore,
			starsLast7d: latestSnapshot.starsLast7d,
			streak: streak?.currentStreak ?? 0,
			activeAnomaly: anomalies[0]
				? {
						kind: anomalies[0].kind,
						title: anomalies[0].title,
						description: anomalies[0].description
					}
				: undefined,
			growthMoments
		});

		await ctx.runMutation(internal.sharePrompts.upsertSharePrompt, {
			repoId,
			userId,
			prompt
		});

		return prompt;
	}
});

export const getRecentScoresForPrompt = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repoId))
			.order('asc')
			.take(5);
	}
});

export const getRepoSharePrompt = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(repoId);
		if (!repo || repo.userId !== userId) return null;

		return await ctx.db
			.query('repoSharePrompts')
			.withIndex('by_repoId_isActive', (q) => q.eq('repoId', repoId).eq('isActive', true))
			.filter((q) => q.eq(q.field('userId'), userId))
			.first();
	}
});

export const dismissSharePrompt = mutation({
	args: { promptId: v.id('repoSharePrompts') },
	handler: async (ctx, { promptId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return;

		const prompt = await ctx.db.get(promptId);
		if (!prompt || prompt.userId !== userId) return;

		await ctx.db.patch(promptId, {
			isActive: false,
			dismissedAt: Date.now()
		});
	}
});
