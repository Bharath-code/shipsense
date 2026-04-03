import { internalAction, internalMutation, query } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';

export type AnomalySignal = {
	kind: 'star_spike' | 'contributor_spike' | 'momentum_drop';
	severity: 'low' | 'medium' | 'high';
	title: string;
	description: string;
	recommendedAction: string;
	metricValue: number;
	baselineValue: number;
};

export function detectAnomalies(input: {
	starsLast7d: number;
	previousStarsLast7d: number;
	contributors14d: number;
	previousContributors14d: number;
	previousScore?: number;
	currentScore?: number;
}): AnomalySignal[] {
	const signals: AnomalySignal[] = [];

	const starBaseline = Math.max(1, input.previousStarsLast7d);
	if (input.starsLast7d >= 10 && input.starsLast7d >= starBaseline * 2) {
		signals.push({
			kind: 'star_spike',
			severity: input.starsLast7d >= Math.max(20, starBaseline * 3) ? 'high' : 'medium',
			title: 'Star spike detected',
			description: `Stars jumped to +${input.starsLast7d} this week from a prior baseline of ${input.previousStarsLast7d}.`,
			recommendedAction: 'Share the momentum publicly and review where the spike came from so you can repeat it.',
			metricValue: input.starsLast7d,
			baselineValue: input.previousStarsLast7d
		});
	}

	const contributorBaseline = Math.max(1, input.previousContributors14d);
	if (input.contributors14d >= 3 && input.contributors14d >= contributorBaseline + 2) {
		signals.push({
			kind: 'contributor_spike',
			severity: input.contributors14d >= Math.max(5, contributorBaseline + 3) ? 'high' : 'medium',
			title: 'Contributor interest signal',
			description: `Active contributors rose to ${input.contributors14d} over the last 14 days from ${input.previousContributors14d}.`,
			recommendedAction: 'Thank new contributors quickly and make the next contribution path easier while interest is high.',
			metricValue: input.contributors14d,
			baselineValue: input.previousContributors14d
		});
	}

	if (input.previousScore !== undefined && input.currentScore !== undefined) {
		const scoreDrop = input.previousScore - input.currentScore;
		if (scoreDrop >= 8) {
			signals.push({
				kind: 'momentum_drop',
				severity: scoreDrop >= 15 ? 'high' : 'medium',
				title: 'Momentum drop warning',
				description: `Health score fell ${scoreDrop} points from ${input.previousScore} to ${input.currentScore}.`,
				recommendedAction: 'Review commits, response time, and open PR flow today to stop the slide before the next sync.',
				metricValue: input.currentScore,
				baselineValue: input.previousScore
			});
		}
	}

	return signals;
}

export const replaceRepoAnomalies = internalMutation({
	args: {
		repoId: v.id('repos'),
		anomalies: v.array(
			v.object({
				kind: v.union(
					v.literal('star_spike'),
					v.literal('contributor_spike'),
					v.literal('momentum_drop')
				),
				severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
				title: v.string(),
				description: v.string(),
				recommendedAction: v.string(),
				metricValue: v.number(),
				baselineValue: v.number()
			})
		)
	},
	handler: async (ctx, { repoId, anomalies }) => {
		const existing = await ctx.db
			.query('repoAnomalies')
			.withIndex('by_repoId', (q) => q.eq('repoId', repoId))
			.collect();

		for (const anomaly of existing) {
			if (anomaly.isActive) {
				await ctx.db.patch(anomaly._id, { isActive: false });
			}
		}

		for (const anomaly of anomalies) {
			await ctx.db.insert('repoAnomalies', {
				repoId,
				...anomaly,
				detectedAt: Date.now(),
				isActive: true
			});
		}
	}
});

export const analyzeRepoAnomalies = internalAction({
	args: {
		repoId: v.id('repos'),
		userId: v.id('users'),
		repoName: v.string(),
		previousScore: v.optional(v.number()),
		currentScore: v.optional(v.number())
	},
	handler: async (ctx, { repoId, userId, repoName, previousScore, currentScore }) => {
		const latestSnapshot = await ctx.runQuery(internal.collector.getLatestSnapshot, { repoId });
		if (!latestSnapshot) return [];

		const previousSnapshot = await ctx.runQuery(internal.collector.getSnapshotBeforeLatest, { repoId });
		const anomalies = detectAnomalies({
			starsLast7d: latestSnapshot.starsLast7d,
			previousStarsLast7d: previousSnapshot?.starsLast7d ?? 0,
			contributors14d: latestSnapshot.contributors14d,
			previousContributors14d: previousSnapshot?.contributors14d ?? 0,
			previousScore,
			currentScore
		});

		await ctx.runMutation(internal.anomalies.replaceRepoAnomalies, {
			repoId,
			anomalies
		});

		for (const anomaly of anomalies) {
			await ctx.runMutation(internal.notifications.createNotification, {
				userId,
				type: 'anomaly_alert',
				title: anomaly.title,
				message: anomaly.description,
				repoId,
				repoName
			});
		}

		return anomalies;
	}
});

export const getRepoAnomalies = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const repo = await ctx.db.get(repoId);
		if (!repo || repo.userId !== userId) return [];

		return await ctx.db
			.query('repoAnomalies')
			.withIndex('by_repoId_isActive', (q) => q.eq('repoId', repoId).eq('isActive', true))
			.order('desc')
			.collect();
	}
});
