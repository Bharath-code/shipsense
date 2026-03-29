import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const generateTasks = internalAction({
  args: { repoId: v.id("repos") },
  handler: async (ctx, { repoId }) => {
    // 1. Fetch repo data
    const repo = await ctx.runQuery(internal.repos.getRepoById, { repoId });
    if (!repo) return;

    // Use placeholder snapshot logic to evaluate tasks
    const commitGapHours = 48; 
    const isPrivate = repo.isPrivate;

    // Deterministic rules engine
    if (commitGapHours > 24) {
      await ctx.runMutation(internal.taskGenerator.createTask, {
        repoId,
        userId: repo.userId,
        taskText: "Push a commit today to keep your streak alive.",
        taskType: "commit",
        priority: 1
      });
    }

    if (!isPrivate) {
      await ctx.runMutation(internal.taskGenerator.createTask, {
        repoId,
        userId: repo.userId,
        taskText: "Check for new issues that need triaging.",
        taskType: "issue",
        priority: 2
      });
    }
  }
});

export const createTask = internalMutation({
  args: {
    repoId: v.id("repos"),
    userId: v.id("users"),
    taskText: v.string(),
    taskType: v.union(v.literal("commit"), v.literal("issue"), v.literal("pr"), v.literal("general")),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    // Avoid creating duplicate unresolved tasks of same type
    const existing = await ctx.db
      .query("repoTasks")
      .withIndex("by_repoId_isCompleted", q => q.eq("repoId", args.repoId).eq("isCompleted", false))
      .filter(q => q.eq(q.field("taskType"), args.taskType))
      .unique();

    if (!existing) {
      await ctx.db.insert("repoTasks", {
        ...args,
        isCompleted: false,
        createdAt: Date.now()
      });
    }
  }
});
