import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

function normalizeDate(dateStr: string) {
	const date = new Date(dateStr);
	date.setUTCHours(0, 0, 0, 0);
	return date;
}

export function getDayDifference(fromDateStr: string, toDateStr: string) {
	const fromDate = normalizeDate(fromDateStr);
	const toDate = normalizeDate(toDateStr);

	return Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateNewStreak(
	currentStreak: number,
	longestStreak: number,
	lastCommitDateStr: string,
	newCommitDateStr: string
) {
	const diffDays = Math.abs(getDayDifference(lastCommitDateStr, newCommitDateStr));

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

export function getActiveStreakCount(
	currentStreak: number,
	lastCommitDateStr: string,
	observedDateStr: string
) {
	const daysSinceLastCommit = getDayDifference(lastCommitDateStr, observedDateStr);
	return daysSinceLastCommit <= 1 ? currentStreak : 0;
}

export const updateStreak = internalMutation({
	args: {
		repoId: v.id('repos'),
		commitDate: v.string(),
		observedDate: v.string()
	}, // Accept standard YYYY-MM-DD
	handler: async (ctx, { repoId, commitDate, observedDate }) => {
		const streak = await ctx.db
			.query('shipStreaks')
			.withIndex('by_repoId', (q) => q.eq('repoId', repoId))
			.unique();

		if (!streak) {
			// First commit streak initialization
			const currentStreak = getActiveStreakCount(1, commitDate, observedDate);
			await ctx.db.insert('shipStreaks', {
				repoId,
				currentStreak,
				longestStreak: 1,
				lastCommitDate: commitDate,
				streakBrokenAt: currentStreak === 0 ? Date.now() : undefined
			});
			return;
		}

		const result = calculateNewStreak(
			streak.currentStreak,
			streak.longestStreak,
			streak.lastCommitDate,
			commitDate
		);
		const currentStreak = getActiveStreakCount(
			result.currentStreak,
			commitDate,
			observedDate
		);

		if (result.broken || currentStreak === 0) {
			await ctx.db.patch(streak._id, {
				currentStreak,
				longestStreak: result.longestStreak,
				lastCommitDate: commitDate,
				streakBrokenAt: Date.now()
			});
		} else {
			await ctx.db.patch(streak._id, {
				currentStreak,
				longestStreak: result.longestStreak,
				lastCommitDate: commitDate
			});
		}
	}
});
