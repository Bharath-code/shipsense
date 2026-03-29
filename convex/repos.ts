import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// List all active repos for the logged in user
export const listMyRepos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    // Get internal user ID
    const user = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId.subject as any))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("repos")
      .withIndex("by_userId_isActive", (q) =>
        q.eq("userId", user.userId).eq("isActive", true)
      )
      .collect();
  },
});

export const connectRepo = mutation({
  args: {
    githubRepoId: v.number(),
    owner: v.string(),
    name: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    starsCount: v.number(),
    forksCount: v.number(),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthenticated");
    
    // Check plan limits
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId.subject as any))
      .unique();
      
    if (!profile) throw new Error("Profile not found");

    const existingRepos = await ctx.db
      .query("repos")
      .withIndex("by_userId_isActive", (q) => 
        q.eq("userId", profile.userId).eq("isActive", true)
      )
      .collect();

    if (profile.plan === "free" && existingRepos.length >= 1) {
      throw new Error("Free plan limited to 1 repository. Upgrade to Indie plan.");
    }
    if (profile.plan === "indie" && existingRepos.length >= 5) {
      throw new Error("Indie plan limited to 5 repositories. Upgrade to Builder plan.");
    }

    // See if repo is already added but inactive
    const existing = await ctx.db
      .query("repos")
      .withIndex("by_githubRepoId", (q) => q.eq("githubRepoId", args.githubRepoId))
      .filter((q) => q.eq(q.field("userId"), profile.userId))
      .unique();

    if (existing) {
      if (!existing.isActive) {
        await ctx.db.patch(existing._id, { isActive: true, connectedAt: Date.now() });
      }
      return existing._id;
    }

    // Insert new repo
    return await ctx.db.insert("repos", {
      ...args,
      userId: profile.userId,
      connectedAt: Date.now(),
      isActive: true,
    });
  },
});

export const disconnectRepo = mutation({
  args: { repoId: v.id("repos") },
  handler: async (ctx, { repoId }) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId.subject as any))
      .unique();

    if (!profile) return;

    const repo = await ctx.db.get(repoId);
    if (!repo || repo.userId !== profile.userId) return;

    await ctx.db.patch(repoId, { isActive: false });
  },
});

export const getRepoById = internalQuery({
  args: { repoId: v.id("repos") },
  handler: async (ctx, { repoId }) => {
    return await ctx.db.get(repoId);
  },
});

export const listAllActiveRepos = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("repos")
      // Cannot use field filter with index efficiently without multiple indices, so we just use the index we have
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});
