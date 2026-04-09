import { describe, it, expect } from 'vitest';
import { computeRepoScore, determineTrend, computeMomentumDelta, computeMomentumWithTime } from './scorer';

describe('computeRepoScore', () => {
	it('calculates a high score for an active, popular repo', () => {
		const result = computeRepoScore({
			stars: 500,
			commitGapHours: 1,
			issuesOpen: 5,
			prsMerged7d: 10,
			contributors14d: 15
		});

		expect(result.starScore).toBe(24); // log10(500)/4 * 35 ≈ 23.7 → 24
		expect(result.commitScore).toBe(25); // ≤ 24h = max
		expect(result.issueScore).toBe(18); // exp(-5/40) * 20 ≈ 17.6 → 18
		expect(result.prScore).toBe(10); // 10 merges = saturated
		expect(result.contributorScore).toBe(10); // 15 contributors = saturated

		expect(result.healthScore).toBe(87);
	});

	it('calculates a low score for an inactive repository', () => {
		const result = computeRepoScore({
			stars: 5,
			commitGapHours: 100,
			issuesOpen: 50,
			prsMerged7d: 0,
			contributors14d: 0
		});

		expect(result.starScore).toBe(6); // log10(5)/4 * 35 ≈ 6.1 → 6
		expect(result.commitScore).toBe(23); // 100h gap: 25 - (52/720)*25 ≈ 23
		expect(result.issueScore).toBe(6); // exp(-50/40) * 20 ≈ 5.7 → 6
		expect(result.prScore).toBe(0);
		expect(result.contributorScore).toBe(3); // 0 contributors → base 3 from formula

		expect(result.healthScore).toBeLessThan(50); // 6+23+6+0+3 = 38 — low but not zero
	});

	// ── Stars: logarithmic differentiation ──────────────────────

	it('differentiates between small, medium, and large repos via log scale', () => {
		const s10 = computeRepoScore({ stars: 10, commitGapHours: 24, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });
		const s100 = computeRepoScore({ stars: 100, commitGapHours: 24, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });
		const s1000 = computeRepoScore({ stars: 1000, commitGapHours: 24, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });
		const s10000 = computeRepoScore({ stars: 10000, commitGapHours: 24, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });

		// Each order of magnitude adds ~8.75 points (35/4)
		expect(s10.starScore).toBe(9);  // log10(10)/4 * 35 = 8.75 → 9
		expect(s100.starScore).toBe(18); // log10(100)/4 * 35 = 17.5 → 18
		expect(s1000.starScore).toBe(26); // log10(1000)/4 * 35 = 26.25 → 26
		expect(s10000.starScore).toBe(35); // log10(10000)/4 * 35 = 35 → 35
	});

	it('gives minimal stars for very low star counts', () => {
		const result = computeRepoScore({ stars: 1, commitGapHours: 0, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });
		expect(result.starScore).toBe(0); // log10(1) = 0
	});

	it('caps star score at 35 for mega-popular repos', () => {
		const result = computeRepoScore({ stars: 100000, commitGapHours: 24, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });
		expect(result.starScore).toBe(35);
	});

	// ── Commits: consistency curve ──────────────────────────────

	it('gives full marks for commits within 24 hours', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 0, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).commitScore).toBe(25);
		expect(computeRepoScore({ stars: 10, commitGapHours: 12, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).commitScore).toBe(25);
		expect(computeRepoScore({ stars: 10, commitGapHours: 24, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).commitScore).toBe(25);
	});

	it('gradually declines between 24h and 48h', () => {
		const result = computeRepoScore({ stars: 10, commitGapHours: 36, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });
		expect(result.commitScore).toBe(22); // 25 - (12/24)*7 = 21.5 → 22
	});

	it('drops to ~18 at 48 hours', () => {
		const result = computeRepoScore({ stars: 10, commitGapHours: 48, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });
		expect(result.commitScore).toBe(18);
	});

	it('declines over 30 days to near-zero', () => {
		const result = computeRepoScore({ stars: 10, commitGapHours: 30 * 24, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });
		expect(result.commitScore).toBe(2); // 25 - (720-48)/720 * 25 ≈ 2.3 → 2
	});

	// ── Issues: exponential decay ───────────────────────────────

	it('gives full marks for zero open issues', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).issueScore).toBe(20);
	});

	it('scores healthy repos with some open issues', () => {
		const r10 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 10, prsMerged7d: 0, contributors14d: 0 });
		expect(r10.issueScore).toBe(16); // exp(-10/40) * 20 ≈ 15.6 → 16
	});

	it('drops for issue-heavy repos (50+)', () => {
		const r50 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 50, prsMerged7d: 0, contributors14d: 0 });
		expect(r50.issueScore).toBe(6); // exp(-50/40) * 20 ≈ 5.7 → 6
	});

	it('near-zero for 200+ open issues', () => {
		const r200 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 200, prsMerged7d: 0, contributors14d: 0 });
		expect(r200.issueScore).toBe(0);
	});

	// ── PRs: exponential saturation ─────────────────────────────

	it('scores 0 for no PRs merged', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).prScore).toBe(0);
	});

	it('rewards first few merges meaningfully', () => {
		const r1 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 1, contributors14d: 0 });
		const r3 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 3, contributors14d: 0 });
		const r5 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 5, contributors14d: 0 });

		expect(r1.prScore).toBe(3);  // 10 * (1 - e^(-1/3)) ≈ 2.8 → 3
		expect(r3.prScore).toBe(6);  // 10 * (1 - e^(-3/3)) ≈ 6.3 → 6
		expect(r5.prScore).toBe(8);  // 10 * (1 - e^(-5/3)) ≈ 8.1 → 8
	});

	it('caps at 10 for 10+ merges', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 10, contributors14d: 0 }).prScore).toBe(10);
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 50, contributors14d: 0 }).prScore).toBe(10);
	});

	// ── Contributors: solo-friendly ─────────────────────────────

	it('gives base score of 3 for zero contributors', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).contributorScore).toBe(3);
	});

	it('scores 1 contributor reasonably (solo-friendly)', () => {
		const r1 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 1 });
		expect(r1.contributorScore).toBe(5); // 3 + 7*(1-e^(-1/4)) ≈ 4.5 → 5
	});

	it('scales to 10+ contributors', () => {
		const r5 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 5 });
		const r10 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 10 });
		const r20 = computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 20 });

		expect(r5.contributorScore).toBe(8);  // 3 + 7*(1-e^(-5/4)) ≈ 8.0
		expect(r10.contributorScore).toBe(9); // 3 + 7*(1-e^(-10/4)) ≈ 9.4 → 9
		expect(r20.contributorScore).toBe(10); // saturated
	});

	// ── Return structure ────────────────────────────────────────

	it('returns raw metrics for downstream use', () => {
		const result = computeRepoScore({ stars: 150, commitGapHours: 3, issuesOpen: 10, prsMerged7d: 5, contributors14d: 8 });

		expect(result.scores.stars.rawValue).toBe(150);
		expect(result.scores.commits.rawValue).toBe(3);
		expect(result.scores.issues.rawValue).toBe(10);
		expect(result.scores.prs.rawValue).toBe(5);
		expect(result.scores.contributors.rawValue).toBe(8);
	});

	it('produces a human-readable formula', () => {
		const result = computeRepoScore({ stars: 50, commitGapHours: 12, issuesOpen: 3, prsMerged7d: 2, contributors14d: 2 });

		expect(result.formula).toMatch(/Stars \(\d+\/35\)/);
		expect(result.formula).toMatch(/Commits \(\d+\/25\)/);
		expect(result.formula).toMatch(/Issues \(\d+\/20\)/);
		expect(result.formula).toMatch(/PRs \(\d+\/10\)/);
		expect(result.formula).toMatch(/Contributors \(\d+\/10\)/);
	});
});

describe('determineTrend', () => {
	it('returns stable with no history', () => {
		expect(determineTrend([])).toBe('stable');
	});

	it('returns stable with a single score', () => {
		expect(determineTrend([42])).toBe('stable');
	});

	it('falls back to ±3 threshold with 2-3 scores', () => {
		expect(determineTrend([60, 63])).toBe('up');
		expect(determineTrend([60, 62])).toBe('stable');
		expect(determineTrend([60, 57])).toBe('down');
		expect(determineTrend([60, 58])).toBe('stable');
	});

	it('detects upward momentum with ≥ 4 scores', () => {
		// Recent 3 avg 67, prior 3 avg 60 → delta 7 → up
		expect(determineTrend([58, 60, 62, 65, 67, 69])).toBe('up');
	});

	it('detects downward momentum with ≥ 4 scores', () => {
		// Recent 3 avg 53, prior 3 avg 60 → delta -7 → down
		expect(determineTrend([62, 60, 58, 55, 53, 51])).toBe('down');
	});

	it('returns stable when averages are close (< 2)', () => {
		// Recent avg 61, prior avg 60 → delta 1 → stable
		expect(determineTrend([59, 60, 61, 60, 61, 62])).toBe('stable');
	});

	it('ignores noisy oscillation without direction', () => {
		// Bouncing: 50↔52, recent avg 51, prior avg 51 → stable
		expect(determineTrend([50, 52, 50, 52, 50, 52])).toBe('stable');
	});

	it('catches a late recovery that 2-point comparison would miss', () => {
		// Score drops 60→50→48, then recovers 50→55→58→60
		// Last 2 points: 60-58 = +2 → stable (missed!)
		// Momentum: recent(55,58,60)=57.7, prior(60,50,48)=52.7 → +5 → up
		expect(determineTrend([60, 50, 48, 50, 55, 58, 60])).toBe('up');
	});

	it('detects late decline even if last tick is a small recovery', () => {
		// Score climbs 40→50→55, then drops 50→45→42→44
		// Last 2: 44-42 = +2 → stable (missed!)
		// Momentum: recent(45,42,44)=43.7, prior(40,50,55)=48.3 → -4.7 → down
		expect(determineTrend([40, 50, 55, 50, 45, 42, 44])).toBe('down');
	});

	it('uses n=2 when only 4 scores available', () => {
		// 4 scores → n = min(3, floor(4/2)) = 2
		// Recent(55,60)=57.5, prior(45,50)=47.5 → delta 10 → up
		expect(determineTrend([45, 50, 55, 60])).toBe('up');
	});

	it('uses n=2 when 5 scores available', () => {
		// 5 scores → n = min(3, floor(5/2)) = 2
		// Recent(58,60)=59, prior(45,48)=46.5 → delta 12.5 → up
		expect(determineTrend([45, 48, 52, 58, 60])).toBe('up');
	});
});

describe('computeMomentumDelta', () => {
	it('returns null with no history', () => {
		expect(computeMomentumDelta([])).toBe(null);
	});

	it('returns null with a single score', () => {
		expect(computeMomentumDelta([42])).toBe(null);
	});

	it('returns single-point delta with 2-3 scores', () => {
		expect(computeMomentumDelta([60, 63])).toBe(3);
		expect(computeMomentumDelta([60, 57])).toBe(-3);
		expect(computeMomentumDelta([60, 62])).toBe(2);
		expect(computeMomentumDelta([60, 58])).toBe(-2);
	});

	it('returns averaged delta with ≥ 4 scores', () => {
		// 4 scores → n=2: recent(55,60)=57.5, prior(45,50)=47.5 → 10
		expect(computeMomentumDelta([45, 50, 55, 60])).toBe(10);
	});

	it('returns negative averaged delta for declining repos', () => {
		// 6 scores → n=3: recent(55,53,51)=53, prior(62,60,58)=60 → -7
		expect(computeMomentumDelta([62, 60, 58, 55, 53, 51])).toBe(-7);
	});

	it('matches determineTrend direction for ≥ 4 scores', () => {
		const scores = [58, 60, 62, 65, 67, 69];
		const delta = computeMomentumDelta(scores);
		// Recent(65,67,69)=67, prior(58,60,62)=60 → delta 7 → up
		expect(delta).toBe(7);
		expect(determineTrend(scores)).toBe('up');
	});

	it('returns small positive when trend is up by narrow margin', () => {
		// 6 scores → n=3: recent(60,61,62)=61, prior(59,60,61)=60 → delta 1
		// determineTrend says stable (delta < 2), but delta is still +1
		const scores = [59, 60, 61, 60, 61, 62];
		expect(computeMomentumDelta(scores)).toBe(1);
		expect(determineTrend(scores)).toBe('stable');
	});
});

describe('computeMomentumWithTime', () => {
	const now = Date.now();
	const day = 24 * 60 * 60 * 1000;

	it('returns no recent activity when all scores are older than 7 days', () => {
		const scores = [
			{ healthScore: 80, calculatedAt: now - 12 * day },
			{ healthScore: 82, calculatedAt: now - 10 * day },
			{ healthScore: 85, calculatedAt: now - 8 * day }
		];
		const result = computeMomentumWithTime(scores, now);
		expect(result.hasRecentActivity).toBe(false);
		expect(result.delta).toBe(null);
		expect(result.trend).toBe('stable');
	});

	it('detects improvement when recent scores are higher than prior week', () => {
		const scores = [
			{ healthScore: 55, calculatedAt: now - 13 * day },
			{ healthScore: 58, calculatedAt: now - 10 * day },
			{ healthScore: 62, calculatedAt: now - 6 * day },
			{ healthScore: 65, calculatedAt: now - 3 * day },
			{ healthScore: 68, calculatedAt: now - 1 * day }
		];
		const result = computeMomentumWithTime(scores, now);
		expect(result.hasRecentActivity).toBe(true);
		// Recent avg: (62+65+68)/3 = 65, Prior avg: (55+58)/2 = 56.5, delta ≈ 8.5
		expect(result.delta).toBeGreaterThan(2);
		expect(result.trend).toBe('up');
	});

	it('detects decline when recent scores are lower than prior week', () => {
		const scores = [
			{ healthScore: 70, calculatedAt: now - 13 * day },
			{ healthScore: 68, calculatedAt: now - 10 * day },
			{ healthScore: 65, calculatedAt: now - 6 * day },
			{ healthScore: 60, calculatedAt: now - 3 * day },
			{ healthScore: 58, calculatedAt: now - 1 * day }
		];
		const result = computeMomentumWithTime(scores, now);
		expect(result.hasRecentActivity).toBe(true);
		// Recent avg: (65+60+58)/3 ≈ 61, Prior avg: (70+68)/2 = 69, delta ≈ -8
		expect(result.delta).toBeLessThan(-2);
		expect(result.trend).toBe('down');
	});

	it('shows stable when recent and prior are similar', () => {
		const scores = [
			{ healthScore: 60, calculatedAt: now - 10 * day },
			{ healthScore: 62, calculatedAt: now - 5 * day },
			{ healthScore: 61, calculatedAt: now - 1 * day }
		];
		const result = computeMomentumWithTime(scores, now);
		expect(result.hasRecentActivity).toBe(true);
		expect(result.trend).toBe('stable');
	});

	it('falls back to oldest score when no prior window exists', () => {
		// Only scores from the last 7 days — no prior window
		const scores = [
			{ healthScore: 50, calculatedAt: now - 5 * day },
			{ healthScore: 58, calculatedAt: now - 2 * day },
			{ healthScore: 60, calculatedAt: now - 1 * day }
		];
		const result = computeMomentumWithTime(scores, now);
		expect(result.hasRecentActivity).toBe(true);
		// Recent avg: (50+58+60)/3 = 56, oldest: 50, delta = 6
		expect(result.delta).toBe(6);
		expect(result.trend).toBe('up');
	});

	it('uses ±3 threshold when no prior window (single-point comparison)', () => {
		const scores = [
			{ healthScore: 60, calculatedAt: now - 3 * day },
			{ healthScore: 62, calculatedAt: now - 1 * day }
		];
		const result = computeMomentumWithTime(scores, now);
		// Delta = 62 - 60 = 2 → stable (below ±3 threshold)
		expect(result.trend).toBe('stable');
	});

	it('handles empty scores gracefully', () => {
		const result = computeMomentumWithTime([], now);
		expect(result.hasRecentActivity).toBe(false);
		expect(result.delta).toBe(null);
		expect(result.trend).toBe('stable');
	});
});
