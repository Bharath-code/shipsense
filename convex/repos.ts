import { mutation, query, internalQuery, action } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { getPlanConfig, type PlanType } from './plan';
import { internal } from './_generated/api';

// List all active repos for the logged in user
export const listMyRepos = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const repos = await ctx.db
			.query('repos')
			.withIndex('by_userId_isActive', (q) => q.eq('userId', userId).eq('isActive', true))
			.collect();

		// Enrich each repo with its latest health score and momentum
		const enrichedRepos = await Promise.all(
			repos.map(async (repo) => {
				const latestScore = await ctx.db
					.query('repoScores')
					.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repo._id))
					.order('desc')
					.first();

				const momentum =
					latestScore?.previousScore !== undefined
						? latestScore.healthScore - latestScore.previousScore
						: null;

				return {
					...repo,
					healthScore: latestScore?.healthScore ?? null,
					momentum,
					trend: latestScore?.trend ?? 'stable',
					hasScore: !!latestScore,
					hasTrend: latestScore?.previousScore !== undefined
				};
			})
		);

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
			isActive: true
		});

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

export const listAllActiveRepos = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query('repos')
			.filter((q) => q.eq(q.field('isActive'), true))
			.collect();
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
