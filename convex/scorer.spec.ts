import { describe, it, expect } from 'vitest';
import { computeRepoScore, determineTrend } from './scorer';

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
	it('returns stable when there is no previous score', () => {
		expect(determineTrend(42)).toBe('stable');
	});

	it('returns up when the score increases', () => {
		expect(determineTrend(60, 55)).toBe('up');
	});

	it('returns down when the score decreases', () => {
		expect(determineTrend(40, 55)).toBe('down');
	});

	it('returns stable when the score stays the same', () => {
		expect(determineTrend(55, 55)).toBe('stable');
	});
});
