import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

export const syncRepoNow = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const snapshotId = await ctx.runAction(internal.collector.fetchRepoData, { repoId });
		if (!snapshotId) return;

		await ctx.runMutation(internal.scorer.calculateScore, { repoId, snapshotId });
		await ctx.runAction(internal.taskGenerator.generateTasks, { repoId });
		await ctx.runAction(internal.insightGenerator.generateInsights, { repoId });
	}
});

// Run data collection for all active repos
export const runDataCollection = internalAction({
	args: {},
	handler: async (ctx) => {
		const repos = await ctx.runQuery(internal.repos.listAllActiveRepos);

		for (const repo of repos) {
			await ctx.runAction(internal.orchestrator.syncRepoNow, { repoId: repo._id });
		}
	}
});

export const runInsightGeneration = internalAction({
	args: {},
	handler: async (ctx) => {
		const repos = await ctx.runQuery(internal.repos.listAllActiveRepos);

		for (const repo of repos) {
			await ctx.runAction(internal.insightGenerator.generateInsights, { repoId: repo._id });
		}
	}
});
