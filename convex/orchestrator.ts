import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

export const syncRepoNow = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		console.log('[Orchestrator] Starting sync for repo:', repoId);

		try {
			const snapshotId = await ctx.runAction(internal.collector.fetchRepoData, { repoId });
			if (!snapshotId) {
				console.log('[Orchestrator] No snapshot created, stopping');
				return;
			}
			console.log('[Orchestrator] Snapshot created:', snapshotId);

			await ctx.runMutation(internal.scorer.calculateScore, { repoId, snapshotId });
			console.log('[Orchestrator] Score calculated');

			await ctx.runAction(internal.taskGenerator.generateTasks, { repoId });
			console.log('[Orchestrator] Tasks generated');

			await ctx.runAction(internal.insightGenerator.generateInsights, { repoId });
			console.log('[Orchestrator] Insights generated');

			console.log('[Orchestrator] Sync complete for repo:', repoId);
		} catch (error) {
			console.error('[Orchestrator] Sync failed for repo:', repoId, error);
		}
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

export const sendWeeklyReports = internalAction({
	args: {},
	handler: async (ctx) => {
		const profiles = await ctx.runQuery(internal.users.listAllUserProfiles);

		for (const profile of profiles) {
			if (!profile.email || !profile.emailReportsEnabled) continue;

			await ctx.runAction(internal.email.sendWeeklyReport, {
				userId: profile.userId,
				email: profile.email
			});
		}
	}
});
