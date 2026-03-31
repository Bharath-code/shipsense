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
		expect(result.commitScore).toBe(24.5); // 25 - 1 * 0.5
		expect(result.issueScore).toBe(17.5); // 20 - 5 * 0.5
		expect(result.prScore).toBe(10); // capped at 10
		expect(result.contributorScore).toBe(10); // capped at 10

		// Total should be sum of the above: 35 + 24.5 + 17.5 + 10 + 10 = 97
		expect(result.healthScore).toBe(97);
	});

	it('calculates a low score for inactive repositories', () => {
		const snapshot = {
			stars: 5,
			commitGapHours: 100, // 25 - 50 = < 0
			issuesOpen: 50, // 20 - 25 = < 0
			prsMerged7d: 0,
			contributors14d: 0
		};
		const result = computeRepoScore(snapshot);

		expect(result.starScore).toBe((5 / 100) * 35); // 1.75
		expect(result.commitScore).toBe(0); // capped at 0 minimum
		expect(result.issueScore).toBe(0); // capped at 0 minimum
		expect(result.prScore).toBe(0);
		expect(result.contributorScore).toBe(0);

		expect(result.healthScore).toBe(2); // Math.round(1.75)
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
