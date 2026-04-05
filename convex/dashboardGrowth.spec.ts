import { describe, expect, it } from 'vitest';
import { deriveGrowthMoments } from './dashboard';

describe('deriveGrowthMoments', () => {
	it('detects a best star week', () => {
		const moments = deriveGrowthMoments({
			starsLast7d: 12,
			scoreHistory: [{ healthScore: 60 }, { healthScore: 64 }, { healthScore: 66 }],
			recentSnapshots: [{ starsLast7d: 12, contributors14d: 2, capturedAt: 1 }, { starsLast7d: 5, contributors14d: 1, capturedAt: 2 }, { starsLast7d: 3, contributors14d: 1, capturedAt: 3 }]
		});

		expect(moments.map((moment) => moment.kind)).toContain('best_week');
	});

	it('detects a momentum recovery', () => {
		const moments = deriveGrowthMoments({
			starsLast7d: 2,
			scoreHistory: [{ healthScore: 62 }, { healthScore: 60 }, { healthScore: 68 }],
			recentSnapshots: [{ starsLast7d: 2, contributors14d: 1, capturedAt: 1 }, { starsLast7d: 1, contributors14d: 0, capturedAt: 2 }, { starsLast7d: 0, contributors14d: 0, capturedAt: 3 }]
		});

		expect(moments.map((moment) => moment.kind)).toContain('momentum_recovered');
	});
});
