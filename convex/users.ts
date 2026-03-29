import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getGithubToken = internalQuery({
  args: { subject: v.string() },
  handler: async (ctx, { subject }) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", subject as any))
      .unique();
      
    if (!profile) return null;
    return { accessToken: profile.githubAccessToken };
  },
});
