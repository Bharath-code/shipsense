import { query, mutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { computeTrafficIntelligence } from './trafficIntelligence.js';

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

		const [latestSnapshot, latestScore] = await Promise.all([
			ctx.db
				.query('repoSnapshots')
				.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first(),
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first()
		]);

		const momentum =
			latestScore?.previousScore !== undefined
				? latestScore.healthScore - latestScore.previousScore
				: null;

		return {
			...repo,
			starsCount: latestSnapshot?.stars ?? repo.starsCount,
			forksCount: latestSnapshot?.forks ?? repo.forksCount,
			starsLast7d: latestSnapshot?.starsLast7d ?? 0,
			healthScore: latestScore?.healthScore ?? null,
			momentum,
			trend: latestScore?.trend ?? 'stable',
			hasScore: !!latestScore,
			hasTrend: latestScore?.previousScore !== undefined
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
