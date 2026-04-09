import { internalAction, internalMutation, internalQuery, query } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';

export type AnomalySignal = {
	kind:
		| 'star_spike'
		| 'contributor_spike'
		| 'momentum_drop'
		| 'traffic_spike'
		| 'referrer_spike'
		| 'conversion_leak'
		| 'stagnation';
	severity: 'low' | 'medium' | 'high';
	title: string;
	description: string;
	recommendedAction: string;
	metricValue: number;
	baselineValue: number;
	metadata?: {
		referrer?: string;
		source?: string;
	};
};

const EXTERNAL_REFERRERS = [
	'Hacker News',
	'Reddit',
	'twitter.com',
	'LinkedIn',
	'Dev.to',
	'YouTube',
	'Google',
	'Bing'
];

function getReferrerSource(referrer: string): string | null {
	const lower = referrer.toLowerCase();
	if (lower.includes('hacker news') || lower.includes('news.ycombinator')) return 'Hacker News';
	if (lower.includes('reddit')) return 'Reddit';
	if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter';
	if (lower.includes('linkedin')) return 'LinkedIn';
	if (lower.includes('dev.to')) return 'Dev.to';
	if (lower.includes('youtube')) return 'YouTube';
	if (lower.includes('google')) return 'Google Search';
	if (lower.includes('bing') || lower.includes('duckduckgo')) return 'Search';
	return null;
}

export function detectAnomalies(input: {
	starsLast7d: number;
	previousStarsLast7d: number;
	contributors14d: number;
	previousContributors14d: number;
	previousScore?: number;
	currentScore?: number;
	currentTraffic?: { views: number; uniques: number };
	previousTraffic?: { views: number; uniques: number };
	currentReferrers?: Array<{ referrer: string; count: number }>;
	previousReferrers?: Array<{ referrer: string; count: number }>;
	trend?: 'up' | 'down' | 'stable';
	currentStreak?: number;
}): AnomalySignal[] {
	const signals: AnomalySignal[] = [];

	const starBaseline = Math.max(1, input.previousStarsLast7d);
	if (input.starsLast7d >= 10 && input.starsLast7d >= starBaseline * 2) {
		signals.push({
			kind: 'star_spike',
			severity: input.starsLast7d >= Math.max(20, starBaseline * 3) ? 'high' : 'medium',
			title: 'Star spike detected',
			description: `Stars jumped to +${input.starsLast7d} this week from a prior baseline of ${input.previousStarsLast7d}.`,
			recommendedAction:
				'Share the momentum publicly and review where the spike came from so you can repeat it.',
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
			recommendedAction:
				'Thank new contributors quickly and make the next contribution path easier while interest is high.',
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
				recommendedAction:
					'Review commits, response time, and open PR flow today to stop the slide before the next sync.',
				metricValue: input.currentScore,
				baselineValue: input.previousScore
			});
		}
	}

	// Traffic spike detection
	if (input.currentTraffic && input.previousTraffic) {
		const trafficBaseline = Math.max(1, input.previousTraffic.views);
		if (input.currentTraffic.views >= trafficBaseline * 2 && input.currentTraffic.views >= 50) {
			const source = input.currentReferrers?.[0]?.referrer || 'unknown';
			const sourceInfo = getReferrerSource(source);

			signals.push({
				kind: 'traffic_spike',
				severity: input.currentTraffic.views >= trafficBaseline * 3 ? 'high' : 'medium',
				title: sourceInfo ? `Traffic spike from ${sourceInfo}!` : 'Traffic spike detected!',
				description: `Views jumped to ${input.currentTraffic.views} (${input.currentTraffic.uniques} unique visitors) from ${input.previousTraffic.views} last period.`,
				recommendedAction: sourceInfo
					? `Engage with ${sourceInfo} visitors - reply in comments, share your project there.`
					: 'Check referrers to see where traffic is coming from and engage there.',
				metricValue: input.currentTraffic.views,
				baselineValue: input.previousTraffic.views,
				metadata: { source: sourceInfo || source }
			});
		}
	}

	// New external referrer detection
	if (input.currentReferrers && input.previousReferrers) {
		const previousReferrerSet = new Set(input.previousReferrers.map((r) => r.referrer));
		for (const ref of input.currentReferrers) {
			const source = getReferrerSource(ref.referrer);
			if (source && !previousReferrerSet.has(ref.referrer) && ref.count >= 5) {
				signals.push({
					kind: 'referrer_spike',
					severity: ref.count >= 20 ? 'high' : 'medium',
					title: `New traffic from ${source}!`,
					description: `${ref.referrer} sent ${ref.count} visitors. This is a new source since last check.`,
					recommendedAction: `You got traction on ${source}! Engage with the audience there - comment, reply, share more content.`,
					metricValue: ref.count,
					baselineValue: 0,
					metadata: { referrer: ref.referrer, source }
				});
				break; // Only one new referrer alert per run
			}
		}
	}

	// Conversion leak: traffic up but stars flat
	if (input.currentTraffic && input.previousTraffic) {
		const trafficGrowth = input.currentTraffic.views / Math.max(1, input.previousTraffic.views);
		const starGrowth = input.starsLast7d / Math.max(1, input.previousStarsLast7d);

		if (trafficGrowth >= 1.5 && starGrowth <= 1.2 && input.starsLast7d > 0) {
			signals.push({
				kind: 'conversion_leak',
				severity: 'medium',
				title: 'Conversion opportunity detected',
				description: `Traffic is up ${Math.round((trafficGrowth - 1) * 100)}% but stars only grew ${Math.round((starGrowth - 1) * 100)}%. Visitors aren\'t converting to stars.`,
				recommendedAction:
					'Review your README - make the value proposition clearer and add a strong "Star this repo" CTA near the top.',
				metricValue: input.starsLast7d,
				baselineValue: input.previousStarsLast7d
			});
		}
	}

	// Stagnation detection: shipping consistently but not growing
	// This fires when the user has an active streak but the trend is stable (no growth)
	if (input.trend === 'stable' && (input.currentStreak ?? 0) >= 3) {
		const streakValue = input.currentStreak ?? 0;
		const severity = streakValue >= 14 ? 'high' : streakValue >= 7 ? 'medium' : 'low';
		signals.push({
			kind: 'stagnation',
			severity,
			title: `${streakValue}-day streak but no score growth`,
			description: `You've shipped for ${streakValue} days straight, but your health score hasn't improved. The work is going in — time to ship something different.`,
			recommendedAction:
				'Consider closing issues, improving docs for visibility, or shipping a feature worth sharing. Consistency is your moat — now aim it at something that moves the needle.',
			metricValue: streakValue,
			baselineValue: 0
		});
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
					v.literal('momentum_drop'),
					v.literal('traffic_spike'),
					v.literal('referrer_spike'),
					v.literal('conversion_leak'),
					v.literal('stagnation')
				),
				severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
				title: v.string(),
				description: v.string(),
				recommendedAction: v.string(),
				metricValue: v.number(),
				baselineValue: v.number(),
				metadata: v.optional(
					v.object({
						referrer: v.optional(v.string()),
						source: v.optional(v.string())
					})
				)
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
		currentScore: v.optional(v.number()),
		trend: v.optional(v.string()),
		currentStreak: v.optional(v.number())
	},
	handler: async (ctx, { repoId, userId, repoName, previousScore, currentScore, trend, currentStreak }) => {
		const latestSnapshot = await ctx.runQuery(internal.collector.getLatestSnapshot, { repoId });
		if (!latestSnapshot) return [];

		const previousSnapshot = await ctx.runQuery(internal.collector.getSnapshotBeforeLatest, {
			repoId
		});

		const latestReferrers = await ctx.runQuery(internal.collector.getLatestReferrers, { repoId });
		const previousReferrers = await ctx.runQuery(internal.collector.getReferrersHistory, {
			repoId
		});
		const previousReferrerData = previousReferrers[1] ?? null;

		const anomalies = detectAnomalies({
			starsLast7d: latestSnapshot.starsLast7d,
			previousStarsLast7d: previousSnapshot?.starsLast7d ?? 0,
			contributors14d: latestSnapshot.contributors14d,
			previousContributors14d: previousSnapshot?.contributors14d ?? 0,
			previousScore,
			currentScore,
			trend: trend as 'up' | 'down' | 'stable' | undefined,
			currentStreak,
			currentTraffic: latestSnapshot.views
				? {
						views: latestSnapshot.views,
						uniques: latestSnapshot.uniqueVisitors ?? 0
					}
				: undefined,
			previousTraffic: previousSnapshot?.views
				? {
						views: previousSnapshot.views,
						uniques: previousSnapshot.uniqueVisitors ?? 0
					}
				: undefined,
			currentReferrers: latestReferrers?.referrers,
			previousReferrers: previousReferrerData?.referrers
		});

		await ctx.runMutation(internal.anomalies.replaceRepoAnomalies, {
			repoId,
			anomalies
		});

		for (const anomaly of anomalies) {
			const notificationType =
				anomaly.kind === 'traffic_spike' ||
				anomaly.kind === 'referrer_spike' ||
				anomaly.kind === 'conversion_leak'
					? 'traffic_alert'
					: anomaly.kind === 'stagnation'
						? 'stagnation_nudge'
						: 'anomaly_alert';

			await ctx.runMutation(internal.notifications.createNotification, {
				userId,
				type: notificationType as any,
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

export const listActiveRepoAnomalies = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoAnomalies')
			.withIndex('by_repoId_isActive', (q) => q.eq('repoId', repoId).eq('isActive', true))
			.collect();
	}
});
