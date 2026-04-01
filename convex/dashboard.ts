import { query, mutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

export const getRepoDetails = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const latestSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		return {
			...repo,
			starsLast7d: latestSnapshot?.starsLast7d ?? 0
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
			formula,
			calculatedAt,
			syncStatus: latestScore ? 'synced' : latestSnapshot ? 'syncing' : 'pending'
		};
	}
});
