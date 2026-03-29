import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Run data collection for all active repos
export const runDataCollection = internalAction({
  args: {},
  handler: async (ctx) => {
    const repos = await ctx.runQuery(internal.repos.listAllActiveRepos);
    
    // Fan-out to process each repo individually
    for (const repo of repos) {
      await ctx.runAction(internal.collector.fetchRepoData, { repoId: repo._id });
    }
  }
});

export const runInsightGeneration = internalAction({
  args: {},
  handler: async (ctx) => {
    // Placeholder for Phase 4 Insight Generation
    console.log("Insight generation not yet implemented");
  }
});
