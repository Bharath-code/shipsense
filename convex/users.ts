import { internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Internal query — looks up token via userId (already resolved)
export const getGithubToken = internalQuery({
  args: { subject: v.string() },
  handler: async (ctx, { subject }) => {
    // subject from identity is the Convex user _id as string
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", subject as any))
      .unique();

    if (!profile) return null;
    return { accessToken: profile.githubAccessToken };
  },
});

// Public query — resolves the currently authenticated user's profile
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});
