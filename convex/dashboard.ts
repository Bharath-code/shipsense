import { query, mutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { computeTrafficIntelligence } from './trafficIntelligence.js';
import { computeMomentumDelta, computeMomentumWithTime } from './scorer.js';

export type GrowthMoment = {
	kind:
		| 'best_week'
		| 'momentum_recovered'
		| 'streak_milestone'
		| 'contributor_milestone'
		| 'score_milestone'
		| 'best_month'
		| 'longest_streak';
	title: string;
	description: string;
	metric?: number;
};

export function deriveGrowthMoments(input: {
	starsLast7d: number;
	scoreHistory: Array<{ healthScore: number }>;
	recentSnapshots: Array<{ starsLast7d: number; contributors14d: number; capturedAt: number }>;
	currentStreak?: number;
	longestStreak?: number;
	previousStreak?: number;
}): GrowthMoment[] {
	const moments: GrowthMoment[] = [];

	const previousSnapshotStars = input.recentSnapshots
		.slice(1)
		.map((snapshot) => snapshot.starsLast7d);
	const previousBestWeek =
		previousSnapshotStars.length > 0 ? Math.max(...previousSnapshotStars) : 0;
	if (input.starsLast7d > 0 && input.starsLast7d >= previousBestWeek && input.starsLast7d >= 5) {
		moments.push({
			kind: 'best_week',
			title: 'Best week for stars',
			description:
				previousBestWeek > 0
					? `This repo is at +${input.starsLast7d} stars this week, matching or beating the previous best of +${previousBestWeek}.`
					: `This repo picked up +${input.starsLast7d} stars this week and is starting to show real momentum.`,
			metric: input.starsLast7d
		});
	}

	if (input.scoreHistory.length >= 3) {
		const latest = input.scoreHistory[input.scoreHistory.length - 1]?.healthScore ?? 0;
		const previous = input.scoreHistory[input.scoreHistory.length - 2]?.healthScore ?? 0;
		const beforePrevious = input.scoreHistory[input.scoreHistory.length - 3]?.healthScore ?? 0;

		if (latest >= previous + 5 && previous <= beforePrevious) {
			moments.push({
				kind: 'momentum_recovered',
				title: 'Momentum recovered',
				description: `Health score bounced from ${previous} to ${latest}, reversing the previous slowdown.`,
				metric: latest - previous
			});
		}
	}

	if (input.currentStreak && [7, 14, 30, 50, 100].includes(input.currentStreak)) {
		const isNewRecord = input.longestStreak === input.currentStreak;
		moments.push({
			kind: 'streak_milestone',
			title: isNewRecord
				? `${input.currentStreak}-day streak record!`
				: `${input.currentStreak}-day shipping streak`,
			description: isNewRecord
				? `You just set a new personal record of ${input.currentStreak} consecutive days of shipping!`
				: `You've shipped consistently for ${input.currentStreak} days in a row.`,
			metric: input.currentStreak
		});
	}

	if (input.longestStreak && input.longestStreak > (input.previousStreak ?? 0)) {
		moments.push({
			kind: 'longest_streak',
			title: 'New longest streak',
			description: `Your longest streak is now ${input.longestStreak} days!`,
			metric: input.longestStreak
		});
	}

	const latestContributors = input.recentSnapshots[0]?.contributors14d ?? 0;
	const previousContributorsSnapshots = input.recentSnapshots
		.slice(1)
		.map((s) => s.contributors14d);
	const previousBestContributors =
		previousContributorsSnapshots.length > 0 ? Math.max(...previousContributorsSnapshots) : 0;
	if (
		latestContributors >= 3 &&
		latestContributors >= previousBestContributors &&
		previousBestContributors > 0
	) {
		moments.push({
			kind: 'contributor_milestone',
			title: 'Contributors milestone',
			description:
				latestContributors > previousBestContributors
					? `${latestContributors} active contributors this week - a new record!`
					: `${latestContributors} active contributors - matching your best week.`,
			metric: latestContributors
		});
	}

	if (input.currentStreak && input.currentStreak >= 30) {
		moments.push({
			kind: 'longest_streak',
			title: '30-day streak milestone',
			description: `Amazing! You've maintained a shipping streak for a full month.`,
			metric: input.currentStreak
		});
	}

	return moments;
}

export const getRepoStreakInternal = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('shipStreaks')
			.withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
			.first();
	}
});

export const getRepoDetails = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const [latestSnapshot, latestScore, scoreHistory] = await Promise.all([
			ctx.db
				.query('repoSnapshots')
				.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first(),
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first(),
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.take(6)
		]);

		// Compute momentum using time windows so inactive repos don't show stale deltas
		const momentumResult = computeMomentumWithTime(scoreHistory);
		const momentum = momentumResult.delta;

		// Delta since last sync — immediate feedback for shipping
		// scoreHistory is DESC (newest first), so [0] = current, [1] = previous
		const lastScore = scoreHistory.length > 1 ? scoreHistory[1].healthScore : null;
		const scoreDelta = lastScore !== null && latestScore
			? latestScore.healthScore - lastScore
			: null;

		return {
			...repo,
			starsCount: latestSnapshot?.stars ?? repo.starsCount,
			forksCount: latestSnapshot?.forks ?? repo.forksCount,
			starsLast7d: latestSnapshot?.starsLast7d ?? 0,
			healthScore: latestScore?.healthScore ?? null,
			momentum,
			scoreDelta,
			trend: momentumResult.trend,
			hasScore: !!latestScore,
			hasTrend: momentumResult.hasRecentActivity
		};
	}
});

export const getRepoDependencies = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const dependencies = await ctx.db
			.query('repoDependencies')
			.withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
			.collect();

		const severityOrder = {
			critical: 5,
			high: 4,
			moderate: 3,
			low: 2,
			unknown: 1,
			none: 0
		} as const;
		const outdatedOrder = {
			major: 4,
			minor: 3,
			patch: 2,
			unknown: 1,
			none: 0
		} as const;

		const sorted = dependencies.sort((a, b) => {
			const vulnerabilityDiff =
				severityOrder[b.vulnerabilitySeverity] - severityOrder[a.vulnerabilitySeverity];
			if (vulnerabilityDiff !== 0) return vulnerabilityDiff;

			if (a.isDeprecated !== b.isDeprecated) return a.isDeprecated ? -1 : 1;

			const outdatedDiff = outdatedOrder[b.outdatedType] - outdatedOrder[a.outdatedType];
			if (outdatedDiff !== 0) return outdatedDiff;

			return a.name.localeCompare(b.name);
		});

		return {
			summary: {
				total: sorted.length,
				outdated: sorted.filter((dependency) => dependency.isOutdated).length,
				majorOutdated: sorted.filter((dependency) => dependency.outdatedType === 'major').length,
				deprecated: sorted.filter((dependency) => dependency.isDeprecated).length,
				vulnerable: sorted.filter((dependency) => dependency.hasVulnerability).length
			},
			dependencies: sorted
		};
	}
});

export const getRepoDailyBrief = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const [latestSnapshot, latestScore, latestInsight, topTask, topAnomaly, latestDigest] =
			await Promise.all([
				ctx.db
					.query('repoSnapshots')
					.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
					.order('desc')
					.first(),
				ctx.db
					.query('repoScores')
					.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
					.order('desc')
					.first(),
				ctx.db
					.query('repoInsights')
					.withIndex('by_repoId_generatedAt', (q) => q.eq('repoId', args.repoId))
					.order('desc')
					.first(),
				ctx.db
					.query('repoTasks')
					.withIndex('by_repoId_isCompleted', (q) =>
						q.eq('repoId', args.repoId).eq('isCompleted', false)
					)
					.order('asc')
					.first(),
				ctx.db
					.query('repoAnomalies')
					.withIndex('by_repoId_isActive', (q) => q.eq('repoId', args.repoId).eq('isActive', true))
					.order('desc')
					.first(),
				ctx.db
					.query('repoDailyDigests')
					.withIndex('by_repoId_generatedAt', (q) => q.eq('repoId', args.repoId))
					.order('desc')
					.first()
			]);

		const summaryLine =
			latestDigest?.summary ??
			topAnomaly?.description ??
			latestInsight?.summary ??
			'Fresh data is flowing in. Keep shipping and check back after the next sync.';

		const todayFocus =
			latestDigest?.recommendedAction ??
			topAnomaly?.recommendedAction ??
			topTask?.taskText ??
			latestInsight?.actions?.[0] ??
			null;

		return {
			repoName: repo.name,
			healthScore: latestScore?.healthScore ?? null,
			starsLast7d: latestSnapshot?.starsLast7d ?? 0,
			contributors14d: latestSnapshot?.contributors14d ?? 0,
			lastSyncedAt: repo.lastSyncedAt ?? latestSnapshot?.capturedAt ?? null,
			generatedAt: latestDigest?.generatedAt ?? null,
			changeSummary:
				latestDigest?.changeSummary ??
				'Run another sync to see a clearer day-over-day change summary.',
			summaryLine,
			todayFocus,
			todayFocusSource: latestDigest?.recommendedActionSource ?? topTask?.taskSource ?? null,
			todayFocusImpact: latestDigest?.recommendedActionImpact ?? topTask?.expectedImpact ?? null,
			topRisk: latestDigest?.topRisk ?? topAnomaly?.description ?? null,
			topWin: latestDigest?.topWin ?? null,
			isQuietDay: latestDigest?.isQuietDay ?? false,
			trafficInsight: latestDigest?.trafficInsight ?? null,
			trafficVelocity: latestDigest?.trafficVelocity ?? null,
			trafficConversion: latestDigest?.trafficConversion ?? null,
			topReferrer: latestDigest?.topReferrer ?? null,
			topTask: topTask
				? {
						text: topTask.taskText,
						type: topTask.taskType,
						priority: topTask.priority,
						source: topTask.taskSource ?? null,
						expectedImpact: topTask.expectedImpact ?? null
					}
				: null,
			topAnomaly: topAnomaly
				? {
						kind: topAnomaly.kind,
						severity: topAnomaly.severity,
						title: topAnomaly.title,
						description: topAnomaly.description,
						recommendedAction: topAnomaly.recommendedAction
					}
				: null,
			insight: latestInsight
				? {
						summary: latestInsight.summary,
						risk: latestInsight.risk
					}
				: null
		};
	}
});

export const getRepoInsights = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		// Verify ownership
		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		// Get the latest insight
		const insights = await ctx.db
			.query('repoInsights')
			.withIndex('by_repoId_generatedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		return insights;
	}
});

export const getRepoInsightsForReport = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoInsights')
			.withIndex('by_repoId_generatedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();
	}
});

export const getRepoTasks = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		// Verify ownership
		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return [];

		const tasks = await ctx.db
			.query('repoTasks')
			.withIndex('by_repoId_isCompleted', (q) =>
				q.eq('repoId', args.repoId).eq('isCompleted', false)
			)
			.collect();

		// Sort by priority (1 = highest priority first)
		return tasks.sort((a, b) => a.priority - b.priority);
	}
});

export const completeTask = mutation({
	args: { taskId: v.id('repoTasks') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Unauthenticated');

		const task = await ctx.db.get(args.taskId);
		if (!task || task.userId !== userId) throw new Error('Unauthorized');

		await ctx.db.patch(args.taskId, {
			isCompleted: true,
			completedAt: Date.now()
		});
	}
});

export const getRepoStreak = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		// Verify ownership
		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const streak = await ctx.db
			.query('shipStreaks')
			.withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
			.first();

		return streak;
	}
});

export const getRepoScoreHistory = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		// Verify ownership
		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return [];

		// Get last 7 scores
		const scores = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.take(7);

		return scores.reverse(); // chronological
	}
});

export const getRepoGrowthMoments = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return [];

		const [scoreHistory, recentSnapshots, streak] = await Promise.all([
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.take(5),
			ctx.db
				.query('repoSnapshots')
				.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.take(5),
			ctx.db
				.query('shipStreaks')
				.withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
				.first()
		]);

		const chronologicalScores = scoreHistory.reverse();
		const latestSnapshot = recentSnapshots[0];

		return deriveGrowthMoments({
			starsLast7d: latestSnapshot?.starsLast7d ?? 0,
			scoreHistory: chronologicalScores.map((score) => ({ healthScore: score.healthScore })),
			recentSnapshots: recentSnapshots.map((snapshot) => ({
				starsLast7d: snapshot.starsLast7d,
				contributors14d: snapshot.contributors14d,
				capturedAt: snapshot.capturedAt
			})),
			currentStreak: streak?.currentStreak,
			longestStreak: streak?.longestStreak
		});
	}
});

export const getOpenTasksForReport = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoTasks')
			.withIndex('by_repoId_isCompleted', (q) => q.eq('repoId', repoId).eq('isCompleted', false))
			.order('asc')
			.take(5);
	}
});

// Combined dashboard data - fetches all needed data in single query for frontend
export const getRepoDashboardData = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		// Verify ownership
		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		// Fetch all data in parallel
		const [latestSnapshot, latestScore, insights, tasks, streak, scoreHistory] = await Promise.all([
			// Latest snapshot
			ctx.db
				.query('repoSnapshots')
				.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first(),
			// Latest score
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first(),
			// Latest insight
			ctx.db
				.query('repoInsights')
				.withIndex('by_repoId_generatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first(),
			// Open tasks
			ctx.db
				.query('repoTasks')
				.withIndex('by_repoId_isCompleted', (q) =>
					q.eq('repoId', args.repoId).eq('isCompleted', false)
				)
				.collect(),
			// Streak
			ctx.db
				.query('shipStreaks')
				.withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
				.first(),
			// Score history (last 7)
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.take(7)
		]);

		// Sort tasks by priority
		const sortedTasks = tasks.sort((a, b) => a.priority - b.priority);

		// Reverse score history to chronological order
		const chronologicalHistory = scoreHistory.reverse();

		return {
			repo: {
				...repo,
				starsLast7d: latestSnapshot?.starsLast7d ?? 0
			},
			latestSnapshot,
			latestScore,
			insights,
			tasks: sortedTasks,
			streak,
			scoreHistory: chronologicalHistory
		};
	}
});

export const getScoreBreakdown = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const latestScore = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		const latestSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		// If no score or snapshot, return null
		if (!latestScore && !latestSnapshot) return null;

		// Build response with available data
		const healthScore = latestScore?.healthScore ?? 0;
		const calculatedAt = latestScore?.calculatedAt ?? latestSnapshot?.capturedAt ?? Date.now();
		const formula = latestScore?.scoreExplanation ?? 'Score will be calculated after first sync';

		return {
			healthScore,
			components: {
				stars: {
					earned: latestScore?.starScore ?? 0,
					max: 35,
					percentage: latestScore?.starScore ? Math.round((latestScore.starScore / 35) * 100) : 0,
					rawValue: latestSnapshot?.stars ?? 0,
					label: 'Stars',
					description: 'GitHub stars indicate project popularity'
				},
				commits: {
					earned: latestScore?.commitScore ?? 0,
					max: 25,
					percentage: latestScore?.commitScore
						? Math.round((latestScore.commitScore / 25) * 100)
						: 0,
					rawValue: latestSnapshot?.commitGapHours ?? 0,
					label: 'Commits',
					description: 'Recent commits show active maintenance'
				},
				issues: {
					earned: latestScore?.issueScore ?? 0,
					max: 20,
					percentage: latestScore?.issueScore ? Math.round((latestScore.issueScore / 20) * 100) : 0,
					rawValue: latestSnapshot?.issuesOpen ?? 0,
					label: 'Issues',
					description: 'Open issues measure community engagement'
				},
				prs: {
					earned: latestScore?.prScore ?? 0,
					max: 10,
					percentage: latestScore?.prScore ? Math.round((latestScore.prScore / 10) * 100) : 0,
					rawValue: latestSnapshot?.prsMerged7d ?? 0,
					label: 'PRs',
					description: 'Merged PRs indicate healthy collaboration'
				},
				contributors: {
					earned: latestScore?.contributorScore ?? 0,
					max: 10,
					percentage: latestScore?.contributorScore
						? Math.round((latestScore.contributorScore / 10) * 100)
						: 0,
					rawValue: latestSnapshot?.contributors14d ?? 0,
					label: 'Contributors',
					description: 'Recent contributors show project growth'
				}
			},
			readmeScore: latestSnapshot?.readmeScore ?? null,
			readmeSuggestions: latestSnapshot?.readmeSuggestions ?? [],
			formula,
			calculatedAt,
			syncStatus: latestScore ? 'synced' : latestSnapshot ? 'syncing' : 'pending'
		};
	}
});

export const getPublicRepoHealth = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const repo = await ctx.db
			.query('repos')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.first();

		if (!repo || !repo.isActive) return null;

		const latestSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repo._id))
			.order('desc')
			.first();

		const latestScore = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repo._id))
			.order('desc')
			.first();

		const [recentCommits, recentScores] = await Promise.all([
			ctx.db
				.query('repoSnapshots')
				.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repo._id))
				.order('desc')
				.take(5),
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repo._id))
				.order('desc')
				.take(5)
		]);

		const growthMoments = deriveGrowthMoments({
			starsLast7d: latestSnapshot?.starsLast7d ?? 0,
			scoreHistory: recentScores.reverse().map((score) => ({ healthScore: score.healthScore })),
			recentSnapshots: recentCommits.map((snapshot) => ({
				starsLast7d: snapshot.starsLast7d,
				contributors14d: snapshot.contributors14d,
				capturedAt: snapshot.capturedAt
			}))
		});

		return {
			repo: {
				name: repo.name,
				owner: repo.owner,
				fullName: repo.fullName,
				description: repo.description,
				language: repo.language,
				starsCount: latestSnapshot?.stars ?? repo.starsCount,
				forksCount: latestSnapshot?.forks ?? repo.forksCount,
				isPrivate: repo.isPrivate,
				lastSyncedAt: repo.lastSyncedAt
			},
			healthScore: latestScore?.healthScore ?? null,
			trend: latestScore?.trend ?? null,
			metrics: latestSnapshot
				? {
						stars: latestSnapshot.stars,
						forks: latestSnapshot.forks,
						issuesOpen: latestSnapshot.issuesOpen,
						prsOpen: latestSnapshot.prsOpen,
						prsMerged7d: latestSnapshot.prsMerged7d,
						contributors14d: latestSnapshot.contributors14d,
						commitGapHours: latestSnapshot.commitGapHours,
						starsLast7d: latestSnapshot.starsLast7d
					}
				: null,
			recentCommits: recentCommits.map((s) => ({
				capturedAt: s.capturedAt,
				commitGapHours: s.commitGapHours
			})),
			growthMoments,
			scoreBreakdown: latestScore
				? {
						stars: latestScore.starScore,
						commits: latestScore.commitScore,
						issues: latestScore.issueScore,
						prs: latestScore.prScore,
						contributors: latestScore.contributorScore
					}
				: null
		};
	}
});

export const getPublicRepoBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const repo = await ctx.db
			.query('repos')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.first();

		if (!repo || !repo.isActive) return null;
		const latestSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repo._id))
			.order('desc')
			.first();

		return {
			_id: repo._id,
			name: repo.name,
			owner: repo.owner,
			fullName: repo.fullName,
			description: repo.description,
			language: repo.language,
			starsCount: latestSnapshot?.stars ?? repo.starsCount,
			forksCount: latestSnapshot?.forks ?? repo.forksCount,
			isPrivate: repo.isPrivate
		};
	}
});

export const getPublicRepoHealthById = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const repo = await ctx.db.get(args.repoId);
		if (!repo || !repo.isActive) return null;

		const latestScore = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();
		const latestSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		return {
			repo: {
				name: repo.name,
				owner: repo.owner,
				fullName: repo.fullName,
				description: repo.description,
				language: repo.language,
				starsCount: latestSnapshot?.stars ?? repo.starsCount,
				forksCount: latestSnapshot?.forks ?? repo.forksCount,
				isPrivate: repo.isPrivate,
				lastSyncedAt: repo.lastSyncedAt,
				views: latestSnapshot?.views ?? null,
				uniqueVisitors: latestSnapshot?.uniqueVisitors ?? null,
				clones: latestSnapshot?.clones ?? null,
				uniqueCloners: latestSnapshot?.uniqueCloners ?? null
			},
			healthScore: latestScore?.healthScore ?? null,
			trend: latestScore?.trend ?? null
		};
	}
});

// ── Star Forecast (linear projection) ────────────────────────────────────────
// Computes star velocity via linear regression on up to 30 snapshots,
// then projects toward the next canonical milestone.

export type StarForecast = {
	currentStars: number;
	velocityPerDay: number; // stars/day (7-day rolling average)
	nextMilestone: number;
	daysUntilMilestone: number | null; // null = impossible / no velocity
	projectedDate: number | null; // ms timestamp
	confidence: 'high' | 'medium' | 'low';
	narrative: string;
	weeklyVelocity: number; // starsLast7d from latest snapshot
	trend: 'accelerating' | 'decelerating' | 'stable';
	hasEnoughData: boolean;
};

function nextStarMilestone(current: number): number {
	const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
	return milestones.find((m) => m > current) ?? current * 2;
}

function formatForecastDate(ms: number): string {
	const date = new Date(ms);
	return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export const getStarForecast = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args): Promise<StarForecast | null> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		// Get up to 30 snapshots (chronological for regression)
		const snapshots = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.take(30);

		const chronological = snapshots.reverse();
		const latest = chronological[chronological.length - 1];
		const currentStars = latest?.stars ?? repo.starsCount;
		const weeklyVelocity = latest?.starsLast7d ?? 0;

		if (chronological.length < 2) {
			const milestone = nextStarMilestone(currentStars);
			return {
				currentStars,
				velocityPerDay: 0,
				nextMilestone: milestone,
				daysUntilMilestone: null,
				projectedDate: null,
				confidence: 'low',
				narrative: `Sync daily to start building a trend line toward ${milestone.toLocaleString()} stars.`,
				weeklyVelocity,
				trend: 'stable',
				hasEnoughData: false
			};
		}

		// Linear regression: y = stars, x = days from first snapshot
		const t0 = chronological[0].capturedAt;
		const points = chronological
			.filter((s) => typeof s.stars === 'number')
			.map((s) => ({
				x: (s.capturedAt - t0) / (1000 * 60 * 60 * 24), // days
				y: s.stars
			}));

		const n = points.length;
		const sumX = points.reduce((a, p) => a + p.x, 0);
		const sumY = points.reduce((a, p) => a + p.y, 0);
		const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
		const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);
		const denom = n * sumX2 - sumX * sumX;

		// velocity = slope of the regression line
		const velocityPerDay = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;

		// Trend: compare first-half vs second-half velocity
		const mid = Math.floor(points.length / 2);
		const firstHalf = points.slice(0, mid);
		const secondHalf = points.slice(mid);
		const firstVel =
			firstHalf.length > 1
				? (firstHalf[firstHalf.length - 1].y - firstHalf[0].y) /
					Math.max(firstHalf[firstHalf.length - 1].x - firstHalf[0].x, 1)
				: 0;
		const secondVel =
			secondHalf.length > 1
				? (secondHalf[secondHalf.length - 1].y - secondHalf[0].y) /
					Math.max(secondHalf[secondHalf.length - 1].x - secondHalf[0].x, 1)
				: 0;

		let trend: 'accelerating' | 'decelerating' | 'stable' = 'stable';
		if (secondVel > firstVel * 1.3) trend = 'accelerating';
		else if (secondVel < firstVel * 0.7) trend = 'decelerating';

		const nextMilestone = nextStarMilestone(currentStars);
		const starsNeeded = nextMilestone - currentStars;

		let daysUntilMilestone: number | null = null;
		let projectedDate: number | null = null;

		if (velocityPerDay > 0) {
			daysUntilMilestone = Math.ceil(starsNeeded / velocityPerDay);
			projectedDate = Date.now() + daysUntilMilestone * 24 * 60 * 60 * 1000;
		}

		// Confidence: more data + consistent velocity = higher confidence
		const dataSpanDays =
			(chronological[chronological.length - 1].capturedAt - chronological[0].capturedAt) /
			(1000 * 60 * 60 * 24);
		let confidence: 'high' | 'medium' | 'low' = 'low';
		if (n >= 10 && dataSpanDays >= 7) confidence = 'high';
		else if (n >= 5 && dataSpanDays >= 3) confidence = 'medium';

		// Narrative
		let narrative: string;
		if (velocityPerDay <= 0) {
			narrative = `No star growth detected in the last ${Math.round(dataSpanDays)} days. Publish a post on HN or Reddit to restart momentum.`;
		} else if (projectedDate && daysUntilMilestone !== null) {
			const dateStr = formatForecastDate(projectedDate);
			const rate =
				velocityPerDay >= 1
					? `${velocityPerDay.toFixed(1)} stars/day`
					: `${(velocityPerDay * 7).toFixed(1)} stars/week`;
			if (trend === 'accelerating') {
				narrative = `🚀 Growing at ${rate} and accelerating. At this rate you'll hit ${nextMilestone.toLocaleString()} stars by ${dateStr}.`;
			} else if (trend === 'decelerating') {
				narrative = `📉 Growing at ${rate} but slowing. ${nextMilestone.toLocaleString()} stars by ${dateStr} — post in a dev community to re-ignite growth.`;
			} else {
				narrative = `📈 Steady growth at ${rate}. On track to hit ${nextMilestone.toLocaleString()} stars by ${dateStr}.`;
			}
		} else {
			narrative = `Tracking star velocity. Keep syncing daily for a projection toward ${nextMilestone.toLocaleString()} stars.`;
		}

		return {
			currentStars,
			velocityPerDay: Math.round(velocityPerDay * 100) / 100,
			nextMilestone,
			daysUntilMilestone,
			projectedDate,
			confidence,
			narrative,
			weeklyVelocity,
			trend,
			hasEnoughData: n >= 3
		};
	}
});

// ── Repo Benchmark (network percentile) ──────────────────────────────────────
// Compares a repo's health score against all scored repos in the network.
// Falls back to curated static thresholds if user base < 10 repos.

export type RepoBenchmark = {
	healthScore: number;
	percentile: number; // 0-100, e.g. 83 = "better than 83% of repos"
	cohortLabel: string; // e.g. "repos with < 500 stars"
	cohortSize: number; // how many repos in the cohort
	tier: 'elite' | 'strong' | 'average' | 'developing';
	tierLabel: string;
	narrative: string;
	usedStaticFallback: boolean; // true when not enough network data
};

function staticPercentile(score: number): number {
	// Curated thresholds based on open-source health score distributions
	// Elite: >=80, Strong: >=65, Average: >=45, Developing: <45
	if (score >= 85) return 95;
	if (score >= 80) return 88;
	if (score >= 75) return 80;
	if (score >= 70) return 72;
	if (score >= 65) return 63;
	if (score >= 60) return 54;
	if (score >= 55) return 45;
	if (score >= 50) return 37;
	if (score >= 45) return 28;
	if (score >= 40) return 20;
	if (score >= 30) return 12;
	return 5;
}

function starCohort(stars: number): { label: string; min: number; max: number } | null {
	// 0-star repos have no meaningful cohort — they haven't gained traction yet
	if (stars === 0) return null;
	if (stars < 50) return { label: 'repos with < 50 stars', min: 1, max: 49 };
	if (stars < 200) return { label: 'repos with 50–200 stars', min: 50, max: 199 };
	if (stars < 500) return { label: 'repos with 200–500 stars', min: 200, max: 499 };
	if (stars < 1000) return { label: 'repos with 500–1k stars', min: 500, max: 999 };
	if (stars < 5000) return { label: 'repos with 1k–5k stars', min: 1000, max: 4999 };
	return { label: 'repos with 5k+ stars', min: 5000, max: Infinity };
}

export const getRepoBenchmark = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args): Promise<RepoBenchmark | null> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		// Get this repo's latest score
		const myScore = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		if (!myScore) return null;

		const healthScore = myScore.healthScore;

		// Get this repo's latest star count
		const mySnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		const myStars = mySnapshot?.stars ?? repo.starsCount;
		const cohort = starCohort(myStars);

		// 0-star repos have no meaningful benchmark — they haven't gained any traction yet
		if (!cohort) {
			return {
				healthScore,
				percentile: 0,
				cohortLabel: 'getting started',
				cohortSize: 0,
				tier: 'developing' as const,
				tierLabel: 'Getting Started',
				narrative: 'No stars yet — focus on distribution and making your repo discoverable.',
				usedStaticFallback: true
			};
		}

		// Gather all active repos in the network (+ their latest scores for network-wide comparison)
		const allRepos = await ctx.db
			.query('repos')
			.filter((q) => q.eq(q.field('isActive'), true))
			.collect();

		// For a network percentile we need multi-user data — collect all latest scores
		// across all repos in the system (anonymized — we only use the score number)
		const allScoresRaw: number[] = [];
		for (const r of allRepos) {
			const s = await ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', r._id))
				.order('desc')
				.first();
			if (s) allScoresRaw.push(s.healthScore);
		}

		const MINIMUM_NETWORK_REPOS = 5;
		let percentile: number;
		let cohortSize: number;
		let usedStaticFallback: boolean;

		if (allScoresRaw.length >= MINIMUM_NETWORK_REPOS) {
			// Real network percentile: % of repos with a score <= this one
			const below = allScoresRaw.filter((s) => s <= healthScore).length;
			percentile = Math.round((below / allScoresRaw.length) * 100);
			cohortSize = allScoresRaw.length;
			usedStaticFallback = false;
		} else {
			// Static fallback based on curated thresholds
			percentile = staticPercentile(healthScore);
			cohortSize = 0;
			usedStaticFallback = true;
		}

		// Tier classification
		let tier: 'elite' | 'strong' | 'average' | 'developing';
		let tierLabel: string;
		if (percentile >= 85) {
			tier = 'elite';
			tierLabel = 'Elite';
		} else if (percentile >= 65) {
			tier = 'strong';
			tierLabel = 'Strong';
		} else if (percentile >= 35) {
			tier = 'average';
			tierLabel = 'Average';
		} else {
			tier = 'developing';
			tierLabel = 'Developing';
		}

		// Narrative
		const cohortStr = usedStaticFallback ? 'similar repos' : cohort.label;
		let narrative: string;
		if (tier === 'elite') {
			narrative = `Your repo is in the top ${100 - percentile}% of ${cohortStr}. You're maintaining a best-in-class repo — keep it up.`;
		} else if (tier === 'strong') {
			narrative = `You're outperforming ${percentile}% of ${cohortStr}. A few targeted improvements could push you into elite territory.`;
		} else if (tier === 'average') {
			narrative = `You're at the ${percentile}th percentile of ${cohortStr}. Focus on your top task to move the score meaningfully.`;
		} else {
			narrative = `Your score is below ${100 - percentile}% of ${cohortStr}. Address the top-priority tasks to build momentum fast.`;
		}

		return {
			healthScore,
			percentile,
			cohortLabel: usedStaticFallback ? 'open-source repos' : cohort.label,
			cohortSize,
			tier,
			tierLabel,
			narrative,
			usedStaticFallback
		};
	}
});

/**
 * Returns all active public repo slugs for sitemap generation.
 * Used by /sitemap.xml to list public health pages.
 */
export const listPublicSlugs = query({
	handler: async (ctx) => {
		const repos = await ctx.db
			.query('repos')
			.filter((q) => q.eq(q.field('isActive'), true))
			.collect();

		const slugs: string[] = [];
		for (const repo of repos) {
			if (repo.slug) {
				slugs.push(repo.slug);
			}
		}
		return slugs;
	},
});
