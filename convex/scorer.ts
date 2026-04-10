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

/**
 * Determine trend by comparing recent momentum (last 3 scores) vs prior momentum.
 *
 * Instead of comparing just 2 adjacent scores (fragile, noise-sensitive),
 * this computes the average of the last N scores and compares it to the
 * average of the N scores before that. This smooths out daily variance
 * and captures genuine direction changes.
 *
 * With < 4 scores: falls back to ±3 threshold on the single delta.
 * With ≥ 4 scores: compares rolling averages with a ±2 threshold.
 */
export function determineTrend(
	scores: number[]
): 'up' | 'stable' | 'down' {
	if (scores.length === 0) return 'stable';
	if (scores.length === 1) return 'stable';

	// Not enough history for momentum buckets — use single-point threshold
	if (scores.length < 4) {
		const delta = scores[scores.length - 1] - scores[scores.length - 2];
		if (delta >= 3) return 'up';
		if (delta <= -3) return 'down';
		return 'stable';
	}

	// Momentum buckets: average of last 3 vs average of 3 before that
	const n = Math.min(3, Math.floor(scores.length / 2));
	const recent = scores.slice(-n);
	const prior = scores.slice(-n * 2, -n);

	const recentAvg = recent.reduce((a, b) => a + b, 0) / n;
	const priorAvg = prior.reduce((a, b) => a + b, 0) / n;

	const delta = recentAvg - priorAvg;

	if (delta >= 2) return 'up';
	if (delta <= -2) return 'down';
	return 'stable';
}

/**
 * Compute the numeric momentum delta using the same logic as determineTrend.
 * Returns the averaged score difference that drives the trend direction,
 * so the displayed delta always matches the trend label.
 *
 * With < 4 scores: single-point delta (latest - previous).
 * With >= 4 scores: average of last N scores minus average of prior N scores,
 * where N = min(3, floor(scores.length / 2)).
 */
export function computeMomentumDelta(scores: number[]): number | null {
	if (scores.length < 2) return null;

	// Not enough history — use single-point delta
	if (scores.length < 4) {
		return scores[scores.length - 1] - scores[scores.length - 2];
	}

	// Momentum buckets: average of last N vs average of prior N
	const n = Math.min(3, Math.floor(scores.length / 2));
	const recent = scores.slice(-n);
	const prior = scores.slice(-n * 2, -n);

	const recentAvg = recent.reduce((a, b) => a + b, 0) / n;
	const priorAvg = prior.reduce((a, b) => a + b, 0) / n;

	return recentAvg - priorAvg;
}

/**
 * Time-window-aware momentum computation.
 *
 * Unlike computeMomentumDelta (which compares the last N score records
 * regardless of when they were captured), this function uses actual
 * time windows so inactive repos don't show stale positive momentum.
 *
 * Windows:
 *   Recent = last 7 days
 *   Prior  = 7–14 days ago
 *
 * Returns:
 *   { delta, trend, hasRecentActivity }
 *   - delta: the averaged score difference (can be fractional)
 *   - trend: 'up' | 'down' | 'stable' based on the delta
 *   - hasRecentActivity: false when no scores exist in the recent window
 */
export type TimedMomentumResult = {
	delta: number | null;
	trend: 'up' | 'down' | 'stable';
	hasRecentActivity: boolean;
};

export function computeMomentumWithTime(
	scores: { healthScore: number; calculatedAt: number }[],
	now: number = Date.now()
): TimedMomentumResult {
	const RECENT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
	const PRIOR_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

	const recent = scores.filter((s) => s.calculatedAt >= now - RECENT_MS);
	const prior = scores.filter(
		(s) => s.calculatedAt >= now - PRIOR_MS && s.calculatedAt < now - RECENT_MS
	);

	// No recent scores — repo is inactive
	if (recent.length === 0) {
		return { delta: null, trend: 'stable', hasRecentActivity: false };
	}

	const recentAvg = recent.reduce((a, b) => a + b.healthScore, 0) / recent.length;

	// No prior window — compare recent avg to the oldest known score
	if (prior.length === 0) {
		// Sort ascending to get oldest reliably (query may return DESC)
		const sorted = [...scores].sort((a, b) => a.calculatedAt - b.calculatedAt);
		const oldestScore = sorted.length > 0 ? sorted[0].healthScore : recentAvg;
		const delta = recentAvg - oldestScore;
		return {
			delta,
			trend: delta >= 3 ? 'up' : delta <= -3 ? 'down' : 'stable',
			hasRecentActivity: true
		};
	}

	const priorAvg = prior.reduce((a, b) => a + b.healthScore, 0) / prior.length;
	const delta = recentAvg - priorAvg;

	// ±2 threshold for averaged windows (same as determineTrend's bucket logic)
	return {
		delta,
		trend: delta >= 2 ? 'up' : delta <= -2 ? 'down' : 'stable',
		hasRecentActivity: true
	};
}

export const calculateScore = internalMutation({
	args: { repoId: v.id('repos'), snapshotId: v.id('repoSnapshots') },
	handler: async (ctx, { repoId, snapshotId }) => {
		const snapshot = await ctx.db.get(snapshotId);
		if (!snapshot) return;

		// Fetch the last 6 scores for momentum-based trend
		const scoreHistory = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.take(6);

		const scores = computeRepoScore(snapshot);

		// Build trend from history (oldest → newest)
		const previousScores = scoreHistory.map((s) => s.healthScore).reverse();
		const trend = determineTrend(previousScores);

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
			previousScore: scoreHistory[0]?.healthScore ?? null
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
