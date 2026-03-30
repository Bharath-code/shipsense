import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

export function calculateNewStreak(
	currentStreak: number,
	longestStreak: number,
	lastCommitDateStr: string,
	newCommitDateStr: string
) {
	const lastDate = new Date(lastCommitDateStr);
	const newDate = new Date(newCommitDateStr);

	// Set both dates to midnight to calculate correctly across timezones
	lastDate.setUTCHours(0, 0, 0, 0);
	newDate.setUTCHours(0, 0, 0, 0);

	const diffTime = Math.abs(newDate.getTime() - lastDate.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 1) {
		// Clean increment
		const newCurrent = currentStreak + 1;
		return {
			currentStreak: newCurrent,
			longestStreak: Math.max(longestStreak, newCurrent),
			broken: false
		};
	} else if (diffDays > 1) {
		// Streak broken
		return {
			currentStreak: 1,
			longestStreak, // Longest stays same, but current drops to 1
			broken: true
		};
	}
	
	// diffDays === 0
	return { currentStreak, longestStreak, broken: false };
}

export const updateStreak = internalMutation({
	args: { repoId: v.id('repos'), commitDate: v.string() }, // Accept standard YYYY-MM-DD
	handler: async (ctx, { repoId, commitDate }) => {
		const streak = await ctx.db
			.query('shipStreaks')
			.withIndex('by_repoId', (q) => q.eq('repoId', repoId))
			.unique();

		if (!streak) {
			// First commit streak initialization
			await ctx.db.insert('shipStreaks', {
				repoId,
				currentStreak: 1,
				longestStreak: 1,
				lastCommitDate: commitDate
			});
			return;
		}

		const result = calculateNewStreak(
			streak.currentStreak,
			streak.longestStreak,
			streak.lastCommitDate,
			commitDate
		);

		if (result.broken) {
			await ctx.db.patch(streak._id, {
				currentStreak: result.currentStreak,
				lastCommitDate: commitDate,
				streakBrokenAt: Date.now()
			});
		} else {
			await ctx.db.patch(streak._id, {
				currentStreak: result.currentStreak,
				longestStreak: result.longestStreak,
				lastCommitDate: commitDate
			});
		}
	}
});
