import { describe, it, expect } from 'vitest';
import { computeRepoScore, determineTrend } from './scorer';

describe('computeRepoScore', () => {
	it('calculates a near-perfect score for high activity', () => {
		const snapshot = {
			stars: 500,
			commitGapHours: 1,
			issuesOpen: 5,
			prsMerged7d: 10,
			contributors14d: 15
		};
		const result = computeRepoScore(snapshot);

		expect(result.starScore).toBe(35); // capped at 35
		expect(result.commitScore).toBe(25); // Math.round(25 - 1 * 0.5) = Math.round(24.5) = 25
		expect(result.issueScore).toBe(18); // Math.round(20 - 5 * 0.5) = Math.round(17.5) = 18
		expect(result.prScore).toBe(10); // capped at 10
		expect(result.contributorScore).toBe(10); // capped at 10

		// Total is Math.round of raw sum: 35 + 24.5 + 17.5 + 10 + 10 = 97
		expect(result.healthScore).toBe(97);
	});

	it('calculates a low score for inactive repositories', () => {
		const snapshot = {
			stars: 5,
			commitGapHours: 100, // 25 - 50 = < 0, capped at 0
			issuesOpen: 50, // 20 - 25 = < 0, capped at 0
			prsMerged7d: 0,
			contributors14d: 0
		};
		const result = computeRepoScore(snapshot);

		expect(result.starScore).toBe(2); // Math.round((5 / 100) * 35) = Math.round(1.75) = 2
		expect(result.commitScore).toBe(0); // capped at 0 minimum
		expect(result.issueScore).toBe(0); // capped at 0 minimum
		expect(result.prScore).toBe(0);
		expect(result.contributorScore).toBe(0);

		expect(result.healthScore).toBe(2);
	});

	it('caps star score at 35 for 100+ stars', () => {
		expect(computeRepoScore({ stars: 100, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).starScore).toBe(35);
		expect(computeRepoScore({ stars: 500, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).starScore).toBe(35);
	});

	it('caps commit score at 25 for same-day commits', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 0, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).commitScore).toBe(25);
	});

	it('caps commit score at 0 for 50+ hour gaps', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 50, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).commitScore).toBe(0);
	});

	it('caps issue score at 20 for 0 open issues', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 }).issueScore).toBe(20);
	});

	it('caps issue score at 0 for 40+ open issues', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 40, prsMerged7d: 0, contributors14d: 0 }).issueScore).toBe(0);
	});

	it('caps PR score at 10 for 10+ merged PRs', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 10, contributors14d: 0 }).prScore).toBe(10);
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 50, contributors14d: 0 }).prScore).toBe(10);
	});

	it('caps contributor score at 10 for 20+ contributors', () => {
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 20 }).contributorScore).toBe(10);
		expect(computeRepoScore({ stars: 10, commitGapHours: 1, issuesOpen: 0, prsMerged7d: 0, contributors14d: 100 }).contributorScore).toBe(10);
	});

	it('handles zero for all metrics', () => {
		const result = computeRepoScore({ stars: 0, commitGapHours: 0, issuesOpen: 0, prsMerged7d: 0, contributors14d: 0 });

		expect(result.starScore).toBe(0);
		expect(result.commitScore).toBe(25); // commitGapHours = 0 → max
		expect(result.issueScore).toBe(20); // issuesOpen = 0 → max
		expect(result.prScore).toBe(0);
		expect(result.contributorScore).toBe(0);
	});

	it('returns raw metrics for downstream use', () => {
		const result = computeRepoScore({ stars: 150, commitGapHours: 3, issuesOpen: 10, prsMerged7d: 5, contributors14d: 8 });

		expect(result.scores.stars.rawValue).toBe(150);
		expect(result.scores.commits.rawValue).toBe(3);
		expect(result.scores.issues.rawValue).toBe(10);
		expect(result.scores.prs.rawValue).toBe(5);
		expect(result.scores.contributors.rawValue).toBe(8);
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
