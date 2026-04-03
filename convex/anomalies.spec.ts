import { describe, expect, it } from 'vitest';
import { detectAnomalies } from './anomalies';

describe('detectAnomalies', () => {
	it('detects star spikes and contributor spikes', () => {
		const anomalies = detectAnomalies({
			starsLast7d: 20,
			previousStarsLast7d: 5,
			contributors14d: 5,
			previousContributors14d: 1,
			previousScore: 70,
			currentScore: 69
		});

		expect(anomalies.map((a) => a.kind)).toContain('star_spike');
		expect(anomalies.map((a) => a.kind)).toContain('contributor_spike');
	});

	it('detects momentum drops from score changes', () => {
		const anomalies = detectAnomalies({
			starsLast7d: 2,
			previousStarsLast7d: 2,
			contributors14d: 1,
			previousContributors14d: 1,
			previousScore: 78,
			currentScore: 62
		});

		expect(anomalies.map((a) => a.kind)).toContain('momentum_drop');
	});
});
