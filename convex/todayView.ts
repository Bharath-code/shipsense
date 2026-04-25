import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

/**
 * TodayView — single aggregate query for the simplified "Today" dashboard.
 * Returns everything a user needs in their morning check-in:
 * brief, top task, streak, active anomalies, and repo summary.
 * Designed to load in one round-trip.
 */
export const getTodayView = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const [
			latestSnapshot,
			latestScore,
			latestDigest,
			topTask,
			streak,
			activeAnomalies,
			latestInsight
		] = await Promise.all([
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
				.query('repoDailyDigests')
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
				.query('shipStreaks')
				.withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
				.first(),
			ctx.db
				.query('repoAnomalies')
				.withIndex('by_repoId_isActive', (q) => q.eq('repoId', args.repoId).eq('isActive', true))
				.collect(),
			ctx.db
				.query('repoInsights')
				.withIndex('by_repoId_generatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first()
		]);

		const summaryLine =
			latestDigest?.summary ??
			activeAnomalies[0]?.description ??
			latestInsight?.summary ??
			'Fresh data is flowing in. Keep shipping and check back after the next sync.';

		const topRisk = latestDigest?.topRisk ?? activeAnomalies[0]?.description ?? null;

		return {
			repo: {
				name: repo.name,
				owner: repo.owner,
				slug: repo.slug,
				language: repo.language,
				lastSyncedAt: repo.lastSyncedAt ?? latestSnapshot?.capturedAt ?? null
			},
			score: latestScore?.healthScore ?? null,
			isEstimated: latestScore?.isEstimated ?? false,
			trend: latestScore?.trend ?? null,
			starsLast7d: latestSnapshot?.starsLast7d ?? 0,
			contributors14d: latestSnapshot?.contributors14d ?? 0,
			summaryLine,
			topWin: latestDigest?.topWin ?? null,
			topRisk,
			topTask: topTask
				? {
						id: topTask._id,
						text: topTask.taskText,
						type: topTask.taskType,
						priority: topTask.priority,
						source: topTask.taskSource ?? null,
						impact: topTask.expectedImpact ?? null,
						urgency: topTask.urgency ?? null,
						issueNumber: topTask.issueNumber ?? null
					}
				: null,
			streak: streak
				? {
						current: streak.currentStreak ?? 0,
						longest: streak.longestStreak ?? 0,
						lastCommitDate: streak.lastCommitDate ?? null
					}
				: null,
			anomalies: activeAnomalies.slice(0, 3).map((a) => ({
				id: a._id,
				kind: a.kind,
				severity: a.severity,
				title: a.title,
				description: a.description
			})),
			hasData: !!latestSnapshot,
			isStale: repo.lastSyncedAt
				? Date.now() - repo.lastSyncedAt > 24 * 60 * 60 * 1000
				: true
		};
	}
});

/**
 * Toggle between Today view and full dashboard.
 */
export const toggleFullDashboard = mutation({
	args: { showFull: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (!profile) throw new Error('Profile not found');

		await ctx.db.patch(profile._id, {
			showFullDashboard: args.showFull
		});

		return { showFullDashboard: args.showFull };
	}
});
