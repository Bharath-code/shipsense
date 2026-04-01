import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';

export interface ScoreBreakdown {
	healthScore: number;
	components: {
		stars: { earned: number; max: number; percentage: number; rawValue: number };
		commits: { earned: number; max: number; percentage: number; rawValue: number };
		issues: { earned: number; max: number; percentage: number; rawValue: number };
		prs: { earned: number; max: number; percentage: number; rawValue: number };
		contributors: { earned: number; max: number; percentage: number; rawValue: number };
	};
	formula: string;
	rawMetrics: {
		stars: number;
		commitGapHours: number;
		issuesOpen: number;
		prsMerged7d: number;
		contributors14d: number;
	};
	calculatedAt: number;
}

export function computeRepoScore(snapshot: {
	stars: number;
	commitGapHours: number;
	issuesOpen: number;
	prsMerged7d: number;
	contributors14d: number;
}): {
	scores: ScoreBreakdown['components'];
	healthScore: number;
	formula: string;
	starScore: number;
	commitScore: number;
	issueScore: number;
	prScore: number;
	contributorScore: number;
} {
	// Formula definition
	// Stars 35% | Commits 25% | Issues 20% | PRs 10% | Contributors 10%

	// Calculate each component
	const starScore = Math.min((snapshot.stars / 100) * 35, 35);
	const commitScore = Math.max(0, 25 - snapshot.commitGapHours * 0.5);
	const issueScore = Math.max(0, 20 - snapshot.issuesOpen * 0.5);
	const prScore = Math.min((snapshot.prsMerged7d / 5) * 10, 10);
	const contributorScore = Math.min((snapshot.contributors14d / 3) * 10, 10);

	const healthScore = Math.round(starScore + commitScore + issueScore + prScore + contributorScore);

	const formula = `Stars (${Math.round(starScore)}/35) + Commits (${Math.round(commitScore)}/25) + Issues (${Math.round(issueScore)}/20) + PRs (${Math.round(prScore)}/10) + Contributors (${Math.round(contributorScore)}/10)`;

	return {
		healthScore,
		formula,
		starScore: Math.round(starScore),
		commitScore: Math.round(commitScore),
		issueScore: Math.round(issueScore),
		prScore: Math.round(prScore),
		contributorScore: Math.round(contributorScore),
		scores: {
			stars: {
				earned: Math.round(starScore),
				max: 35,
				percentage: Math.round((starScore / 35) * 100),
				rawValue: snapshot.stars
			},
			commits: {
				earned: Math.round(commitScore),
				max: 25,
				percentage: Math.round((commitScore / 25) * 100),
				rawValue: snapshot.commitGapHours
			},
			issues: {
				earned: Math.round(issueScore),
				max: 20,
				percentage: Math.round((issueScore / 20) * 100),
				rawValue: snapshot.issuesOpen
			},
			prs: {
				earned: Math.round(prScore),
				max: 10,
				percentage: Math.round((prScore / 10) * 100),
				rawValue: snapshot.prsMerged7d
			},
			contributors: {
				earned: Math.round(contributorScore),
				max: 10,
				percentage: Math.round((contributorScore / 10) * 100),
				rawValue: snapshot.contributors14d
			}
		}
	};
}

export function determineTrend(currentScore: number, previousScore?: number) {
	if (previousScore === undefined) return 'stable' as const;
	if (currentScore > previousScore) return 'up' as const;
	if (currentScore < previousScore) return 'down' as const;
	return 'stable' as const;
}

export const calculateScore = internalMutation({
	args: { repoId: v.id('repos'), snapshotId: v.id('repoSnapshots') },
	handler: async (ctx, { repoId, snapshotId }) => {
		const snapshot = await ctx.db.get(snapshotId);
		if (!snapshot) return;

		const previousScoreDoc = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();

		const scores = computeRepoScore(snapshot);
		const previousScore = previousScoreDoc?.healthScore;
		const trend = determineTrend(scores.healthScore, previousScore);

		await ctx.db.insert('repoScores', {
			repoId,
			calculatedAt: Date.now(),
			healthScore: scores.healthScore,
			starScore: scores.scores.stars.earned,
			commitScore: scores.scores.commits.earned,
			issueScore: scores.scores.issues.earned,
			prScore: scores.scores.prs.earned,
			contributorScore: scores.scores.contributors.earned,
			scoreExplanation: scores.formula,
			trend,
			previousScore
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
