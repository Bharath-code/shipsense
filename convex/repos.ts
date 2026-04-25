import { mutation, query, internalQuery, internalMutation, action } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { getPlanConfig, type PlanType } from './plan';
import { internal } from './_generated/api';
import { computeMomentumDelta, computeMomentumWithTime } from './scorer.js';

// List all active repos for the logged in user
export const listMyRepos = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const repos = await ctx.db
			.query('repos')
			.withIndex('by_userId_isActive', (q) => q.eq('userId', userId).eq('isActive', true))
			.take(20); // Limit to 20 repos per user

		if (repos.length === 0) return [];

		// Fetch all scores in parallel - faster than N sequential queries
		const scoreResults = await Promise.all(
			repos.map(async (repo) => {
				const [latestScore, scoreHistory] = await Promise.all([
					ctx.db
						.query('repoScores')
						.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repo._id))
						.order('desc')
						.first(),
					ctx.db
						.query('repoScores')
						.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repo._id))
						.order('desc')
						.take(6)
				]);
				return { repoId: repo._id, latestScore, scoreHistory };
			})
		);

		// Create lookup map
		const scoreMap: Record<string, (typeof scoreResults)[0]['latestScore']> = {};
		const historyMap: Record<string, (typeof scoreResults)[0]['scoreHistory']> = {};
		for (const result of scoreResults) {
			scoreMap[result.repoId as string] = result.latestScore;
			historyMap[result.repoId as string] = result.scoreHistory;
		}

		// Enrich repos with scores
		const enrichedRepos = repos.map((repo) => {
			const latestScore = scoreMap[repo._id as string];
			const scoreHistory = historyMap[repo._id as string];

			// Use time-window momentum so inactive repos don't show stale deltas
			const momentumResult = computeMomentumWithTime(scoreHistory ?? []);
			const momentum = momentumResult.delta;

			return {
				...repo,
				healthScore: latestScore?.healthScore ?? null,
				momentum,
				trend: momentumResult.trend,
				hasScore: !!latestScore,
				hasTrend: momentumResult.hasRecentActivity
			};
		});

		return enrichedRepos;
	}
});

export const connectRepo = mutation({
	args: {
		githubRepoId: v.number(),
		owner: v.string(),
		name: v.string(),
		fullName: v.string(),
		description: v.union(v.string(), v.null()),
		language: v.union(v.string(), v.null()),
		starsCount: v.number(),
		forksCount: v.number(),
		isPrivate: v.boolean()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Unauthenticated');

		// Check plan limits
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (!profile) throw new Error('Profile not found');

		const existingRepos = await ctx.db
			.query('repos')
			.withIndex('by_userId_isActive', (q) => q.eq('userId', userId).eq('isActive', true))
			.collect();

		const planConfig = getPlanConfig(profile.plan as PlanType);

		if (existingRepos.length >= planConfig.maxRepos) {
			const repoLabel = planConfig.maxRepos === 1 ? 'repository' : 'repositories';
			throw new Error(
				`${profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} plan is limited to ${planConfig.maxRepos} ${repoLabel}. Upgrade your plan to add more.`
			);
		}

		// See if repo is already added but inactive
		const existing = await ctx.db
			.query('repos')
			.withIndex('by_githubRepoId', (q) => q.eq('githubRepoId', args.githubRepoId))
			.filter((q) => q.eq(q.field('userId'), userId))
			.unique();

		if (existing) {
			if (!existing.isActive) {
				await ctx.db.patch(existing._id, { isActive: true, connectedAt: Date.now() });
			}
			await ctx.scheduler.runAfter(0, internal.orchestrator.syncRepoNow, { repoId: existing._id });
			return existing._id;
		}

		const repoId = await ctx.db.insert('repos', {
			...args,
			description: args.description ?? undefined,
			language: args.language ?? undefined,
			userId,
			connectedAt: Date.now(),
			isActive: true,
			slug: `${args.owner.toLowerCase()}-${args.name.toLowerCase()}`
		});

		// Instant health estimate (lightweight) before full sync
		await ctx.scheduler.runAfter(0, internal.quickScan.runQuickScan, { repoId });
		// Full background sync
		await ctx.scheduler.runAfter(0, internal.orchestrator.syncRepoNow, { repoId });
		return repoId;
	}
});

export const disconnectRepo = mutation({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Unauthenticated');

		const repo = await ctx.db.get(repoId);
		if (!repo || repo.userId !== userId) return;

		await ctx.db.patch(repoId, { isActive: false });
	}
});

export const getRepoById = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db.get(repoId);
	}
});

// Batch fetch latest scores for multiple repos
export const batchGetLatestScores = internalQuery({
	args: { repoIds: v.array(v.id('repos')) },
	handler: async (ctx, { repoIds }) => {
		if (repoIds.length === 0) return {};

		// Query all scores and filter in memory
		const allScores = await ctx.db
			.query('repoScores')
			.filter((q) => q.or(...repoIds.map((id) => q.eq(q.field('repoId'), id))))
			.collect();

		// Group by repoId and keep only latest per repo
		const scoreMap: Record<string, (typeof allScores)[0]> = {};
		for (const score of allScores) {
			const existing = scoreMap[score.repoId];
			if (!existing || score.calculatedAt > existing.calculatedAt) {
				scoreMap[score.repoId] = score;
			}
		}
		return scoreMap;
	}
});

export const insertEstimatedScore = internalMutation({
	args: {
		repoId: v.id('repos'),
		healthScore: v.number(),
		starScore: v.number(),
		commitScore: v.number(),
		issueScore: v.number(),
		prScore: v.number(),
		contributorScore: v.number(),
		scoreExplanation: v.string(),
		trend: v.union(v.literal('up'), v.literal('down'), v.literal('stable'))
	},
	handler: async (ctx, args) => {
		await ctx.db.insert('repoScores', {
			...args,
			calculatedAt: Date.now(),
			isEstimated: true
		});
	}
});

export const syncConnectedRepo = action({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Unauthenticated');

		const repo = await ctx.runQuery(internal.repos.getRepoById, { repoId });
		if (!repo || repo.userId !== userId) throw new Error('Unauthorized');

		await ctx.runAction(internal.orchestrator.syncRepoNow, { repoId });
		return { ok: true };
	}
});

export const getUserReposForReport = internalQuery({
	args: { userId: v.id('users') },
	handler: async (ctx, { userId }) => {
		return await ctx.db
			.query('repos')
			.withIndex('by_userId_isActive', (q) => q.eq('userId', userId).eq('isActive', true))
			.collect();
	}
});

export const listAllActiveRepos = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query('repos')
			.filter((q) => q.eq(q.field('isActive'), true))
			.collect();
	}
});
