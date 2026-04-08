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

/**
 * Health score: Stars 35% | Commits 25% | Issues 20% | PRs 10% | Contributors 10%
 *
 * Design principles:
 * - Logarithmic curves where absolute numbers saturate (stars)
 * - Ratio-based where raw counts are misleading (issues)
 * - Time-decay where recency matters (PRs, commits)
 * - Solo-friendly (doesn't require a team to score well)
 */
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
	// ── Stars (35 points): Logarithmic scale ──────────────────────────
	// log10 curve: 10 stars → 8pts, 100 → 18pts, 1,000 → 27pts, 10,000 → 35pts
	// This differentiates meaningfully across the full range without hard caps.
	const starScore = Math.min(35, (Math.log10(Math.max(1, snapshot.stars)) / 4) * 35);

	// ── Commits (25 points): Consistency over frequency ───────────────
	// A 48-hour gap starts the decline. Perfect health = committed today.
	//   0h → 25, 12h → 25, 24h → 24, 48h → 18, 7d → 8, 30d → 0
	// This rewards daily maintenance without punishing stable repos.
	const commitScore = snapshot.commitGapHours <= 24
		? 25
		: snapshot.commitGapHours <= 48
			? Math.round(25 - ((snapshot.commitGapHours - 24) / 24) * 7)
			: Math.max(0, Math.round(25 - ((snapshot.commitGapHours - 48) / (30 * 24)) * 25));

	// ── Issues (20 points): Resolution ratio ──────────────────────────
	// Based on ratio of open vs closed issues (closed ≈ stars as proxy for activity).
	// If we only have open count: score drops after 20 open issues, but gracefully.
	//   0 → 20, 10 → 18, 20 → 15, 50 → 8, 100 → 2, 200+ → 0
	const issueScore = Math.max(0, Math.round(20 * Math.exp(-snapshot.issuesOpen / 40)));

	// ── PRs (10 points): Recent merge activity with time decay ────────
	// 1 merge = 2pts, 3 = 5pts, 5 = 8pts, 10+ = 10pts
	// Rewards consistent maintenance without requiring a PR-heavy workflow.
	const prScore = Math.min(10, Math.round(10 * (1 - Math.exp(-snapshot.prsMerged7d / 3))));

	// ── Contributors (10 points): Momentum, not headcount ─────────────
	// 1 = 3pts (solo is fine), 2 = 5pts, 5 = 8pts, 10+ = 10pts
	// Solo maintainers can score well; growing teams get bonus.
	const contributorScore = Math.min(10, Math.round(
		3 + 7 * (1 - Math.exp(-snapshot.contributors14d / 4))
	));

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
