import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';

export function computeRepoScore(snapshot: {
	stars: number;
	commitGapHours: number;
	issuesOpen: number;
	prsMerged7d: number;
	contributors14d: number;
}) {
	// Formula definition
	// Stars 35% | Commits 25% | Issues 20% | PRs 10% | Contributors 10%

	// Naive scoring (0-100 logic placeholders)
	const starScore = Math.min((snapshot.stars / 100) * 35, 35);
	const commitScore = Math.max(0, 25 - snapshot.commitGapHours * 0.5);
	const issueScore = Math.max(0, 20 - snapshot.issuesOpen * 0.5);
	const prScore = Math.min((snapshot.prsMerged7d / 5) * 10, 10);
	const contributorScore = Math.min((snapshot.contributors14d / 3) * 10, 10);

	const healthScore = Math.round(starScore + commitScore + issueScore + prScore + contributorScore);

	return {
		healthScore,
		starScore,
		commitScore,
		issueScore,
		prScore,
		contributorScore
	};
}

export const calculateScore = internalMutation({
	args: { repoId: v.id('repos'), snapshotId: v.id('repoSnapshots') },
	handler: async (ctx, { repoId, snapshotId }) => {
		const snapshot = await ctx.db.get(snapshotId);
		if (!snapshot) return;

		const scores = computeRepoScore(snapshot);

		await ctx.db.insert('repoScores', {
			repoId,
			calculatedAt: Date.now(),
			healthScore: scores.healthScore,
			starScore: scores.starScore,
			commitScore: scores.commitScore,
			issueScore: scores.issueScore,
			prScore: scores.prScore,
			contributorScore: scores.contributorScore,
			scoreExplanation: 'Calculated based on standard heuristics.',
			trend: 'stable'
		});
	}
});

export const getLatestScore = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();
	}
});
