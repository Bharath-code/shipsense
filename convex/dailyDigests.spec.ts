import { describe, expect, it } from 'vitest';
import { buildDailyDigest } from './dailyDigests';

describe('buildDailyDigest', () => {
	it('creates a quiet-day fallback when nothing notable changed', () => {
		const digest = buildDailyDigest({
			repoName: 'shipsense',
			latestSnapshot: {
				starsLast7d: 0,
				contributors14d: 1,
				commitGapHours: 10,
				readmeSuggestions: [],
				readmeScore: 80,
				prsMerged7d: 0
			},
			previousSnapshot: {
				starsLast7d: 0,
				contributors14d: 1,
				commitGapHours: 10,
				prsMerged7d: 0
			},
			latestScore: { healthScore: 62 },
			previousScore: 62,
			insight: {
				summary: 'Momentum is steady.',
				risk: 'low',
				actions: ['Keep shipping']
			},
			topTask: null,
			topAnomaly: null,
			growthMoments: [],
			dependencySummary: {
				total: 5,
				outdated: 0,
				majorOutdated: 0,
				deprecated: 0,
				vulnerable: 0
			},
			latestReferrers: null,
			previousReferrers: null,
			trafficIntelligence: null
		});

		expect(digest.isQuietDay).toBe(true);
		expect(digest.summary).toContain('Quiet day');
		expect(digest.recommendedActionSource).toBe('trend');
	});

	it('prefers the top task action and anomaly risk when available', () => {
		const digest = buildDailyDigest({
			repoName: 'shipsense',
			latestSnapshot: {
				starsLast7d: 14,
				contributors14d: 4,
				commitGapHours: 3,
				readmeSuggestions: ['Add a Contributing section'],
				readmeScore: 60,
				prsMerged7d: 3
			},
			previousSnapshot: {
				starsLast7d: 6,
				contributors14d: 2,
				commitGapHours: 18,
				prsMerged7d: 1
			},
			latestScore: { healthScore: 74 },
			previousScore: 65,
			insight: {
				summary: 'The repo is accelerating.',
				risk: 'medium',
				actions: ['Welcome new contributors']
			},
			topTask: {
				taskText: 'Share the momentum publicly.',
				taskSource: 'anomaly',
				expectedImpact: 'Turns a spike into broader awareness.'
			},
			topAnomaly: {
				title: 'Star spike detected',
				description: 'Stars jumped sharply this week.',
				recommendedAction: 'Share it now.',
				severity: 'high'
			},
			growthMoments: [
				{
					kind: 'best_week',
					title: 'Best week for stars',
					description: 'This repo just matched its best week for stars.'
				}
			],
			dependencySummary: {
				total: 12,
				outdated: 3,
				majorOutdated: 1,
				deprecated: 0,
				vulnerable: 0
			},
			latestReferrers: null,
			previousReferrers: null,
			trafficIntelligence: null
		});

		expect(digest.isQuietDay).toBe(false);
		expect(digest.topRisk).toContain('Stars jumped');
		expect(digest.topWin).toContain('best week');
		expect(digest.recommendedAction).toBe('Share the momentum publicly.');
		expect(digest.recommendedActionImpact).toContain('broader awareness');
	});
});
