import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const updateStreak = internalMutation({
  args: { repoId: v.id("repos"), commitDate: v.string() }, // Accept standard YYYY-MM-DD
  handler: async (ctx, { repoId, commitDate }) => {
    const streak = await ctx.db
      .query("shipStreaks")
      .withIndex("by_repoId", q => q.eq("repoId", repoId))
      .unique();

    if (!streak) {
      // First commit streak initialization
      await ctx.db.insert("shipStreaks", {
        repoId,
        currentStreak: 1,
        longestStreak: 1,
        lastCommitDate: commitDate
      });
      return;
    }

    // Logic to calculate days difference
    const lastDate = new Date(streak.lastCommitDate);
    const newDate = new Date(commitDate);
    
    // Set both dates to midnight to calculate correctly across timezones
    lastDate.setUTCHours(0, 0, 0, 0);
    newDate.setUTCHours(0, 0, 0, 0);

    const diffTime = Math.abs(newDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Clean increment
      const currentStreak = streak.currentStreak + 1;
      const longestStreak = Math.max(streak.longestStreak, currentStreak);
      
      await ctx.db.patch(streak._id, {
        currentStreak,
        longestStreak,
        lastCommitDate: commitDate
      });
    } else if (diffDays > 1) {
      // Streak broken
      await ctx.db.patch(streak._id, {
        currentStreak: 1,
        lastCommitDate: commitDate,
        streakBrokenAt: Date.now()
      });
    }
  }
});
