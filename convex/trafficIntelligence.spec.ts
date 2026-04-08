import { describe, it, expect } from 'vitest';
import {
	analyzeConversion,
	analyzeCloning,
	analyzeVelocity,
	analyzeSources,
	computeTopSourceAction,
	computeOneThing,
	computeExternalReachScore,
	classifyReferrer,
	isSearchEngine,
	isSocialPlatform,
	isDeveloperPlatform,
	formatRatio
} from './trafficIntelligence';

// ── classifyReferrer ──────────────────────────────────────────────────────────

describe('classifyReferrer', () => {
	it('classifies known platforms', () => {
		expect(classifyReferrer('news.ycombinator.com')).toBe('Hacker News');
		expect(classifyReferrer('twitter.com')).toBe('X (Twitter)');
		expect(classifyReferrer('reddit.com')).toBe('Reddit');
		expect(classifyReferrer('linkedin.com')).toBe('LinkedIn');
		expect(classifyReferrer('dev.to')).toBe('Dev.to');
		expect(classifyReferrer('github.com')).toBe('GitHub');
		expect(classifyReferrer('google.com')).toBe('Google Search');
		expect(classifyReferrer('producthunt.com')).toBe('Product Hunt');
		expect(classifyReferrer('lobste.rs')).toBe('Lobsters');
	});

	it('is case-insensitive', () => {
		expect(classifyReferrer('NEWS.YCOMBINATOR.COM')).toBe('Hacker News');
		expect(classifyReferrer('Reddit')).toBe('Reddit');
	});

	it('returns null for unknown referrers', () => {
		expect(classifyReferrer('some-random-blog.com')).toBeNull();
		expect(classifyReferrer('')).toBeNull();
	});
});

// ── Platform type helpers ─────────────────────────────────────────────────────

describe('isSearchEngine', () => {
	it('returns true for search engines', () => {
		expect(isSearchEngine('Google Search')).toBe(true);
		expect(isSearchEngine('Bing Search')).toBe(true);
		expect(isSearchEngine('DuckDuckGo')).toBe(true);
	});

	it('returns false for non-search engines', () => {
		expect(isSearchEngine('Reddit')).toBe(false);
		expect(isSearchEngine(null)).toBe(false);
	});
});

describe('isSocialPlatform', () => {
	it('returns true for social platforms', () => {
		expect(isSocialPlatform('Hacker News')).toBe(true);
		expect(isSocialPlatform('Reddit')).toBe(true);
		expect(isSocialPlatform('X (Twitter)')).toBe(true);
		expect(isSocialPlatform('LinkedIn')).toBe(true);
		expect(isSocialPlatform('Dev.to')).toBe(true);
		expect(isSocialPlatform('YouTube')).toBe(true);
	});

	it('returns false for non-social platforms', () => {
		expect(isSocialPlatform('GitHub')).toBe(false);
		expect(isSocialPlatform('Google Search')).toBe(false);
		expect(isSocialPlatform(null)).toBe(false);
	});
});

describe('isDeveloperPlatform', () => {
	it('returns true for developer platforms', () => {
		expect(isDeveloperPlatform('GitHub')).toBe(true);
		expect(isDeveloperPlatform('Lobsters')).toBe(true);
	});

	it('returns false for non-developer platforms', () => {
		expect(isDeveloperPlatform('Reddit')).toBe(false);
		expect(isDeveloperPlatform(null)).toBe(false);
	});
});

describe('formatRatio', () => {
	it('formats a ratio to 2 decimal places', () => {
		expect(formatRatio(10, 3)).toBe('3.33');
		expect(formatRatio(1, 100)).toBe('0.01');
	});

	it('returns 0.00 for zero denominator', () => {
		expect(formatRatio(10, 0)).toBe('0.00');
	});
});

// ── analyzeConversion ─────────────────────────────────────────────────────────

describe('analyzeConversion', () => {
	it('returns no data when views are zero', () => {
		const result = analyzeConversion(0, 5, null, null);
		expect(result.conversionLabel).toBe('No data');
		expect(result.views).toBe(0);
	});

	it('classifies exceptional conversion (≤ 5 views/star)', () => {
		const result = analyzeConversion(10, 5, null, null); // 2 views/star
		expect(result.viewsToStars).toBe(2);
		expect(result.conversionTrend).toBe('stable');
	});

	it('classifies healthy conversion (≤ 20 views/star)', () => {
		const result = analyzeConversion(100, 10, null, null); // 10 views/star
		expect(result.viewsToStars).toBe(10);
	});

	it('classifies lower conversion (≤ 50 views/star)', () => {
		const result = analyzeConversion(500, 10, null, null); // 50 views/star
		expect(result.viewsToStars).toBe(50);
	});

	it('classifies very poor conversion (> 50 views/star)', () => {
		const result = analyzeConversion(1000, 5, null, null); // 200 views/star
		expect(result.viewsToStars).toBe(200);
		expect(result.conversionTrend).toBe('stable');
	});

	it('detects improving conversion trend', () => {
		// Current: 10 views/star, Previous: 20 views/star → improved
		const result = analyzeConversion(100, 10, 200, 10);
		expect(result.conversionTrend).toBe('improving');
		expect(result.previousViewsToStars).toBe(20);
	});

	it('detects declining conversion trend', () => {
		// Current: 30 views/star, Previous: 10 views/star → declined
		const result = analyzeConversion(300, 10, 100, 10);
		expect(result.conversionTrend).toBe('declining');
	});

	it('marks stable when within 20% threshold', () => {
		const result = analyzeConversion(150, 10, 140, 10);
		expect(result.conversionTrend).toBe('stable');
	});
});

// ── analyzeCloning ────────────────────────────────────────────────────────────

describe('analyzeCloning', () => {
	it('returns no data when clones are zero', () => {
		const result = analyzeCloning(0, 0, 10);
		expect(result.label).toBe('No data');
		expect(result.clones).toBe(0);
	});

	it('detects strong developer interest (≥ 10 cloners or ratio > 3)', () => {
		const result = analyzeCloning(50, 12, 10);
		expect(result.uniqueCloners).toBe(12);
		expect(result.clones).toBe(50);
	});

	it('detects moderate interest (some cloners but < 10)', () => {
		const result = analyzeCloning(10, 3, 10);
		expect(result.label).toBe('3 developers cloning');
	});

	it('detects single developer interest', () => {
		const result = analyzeCloning(5, 1, 10);
		expect(result.label).toBe('1 developer cloning');
	});

	it('detects traffic without clones', () => {
		const result = analyzeCloning(100, 0, 50);
		expect(result.label).toBe('Traffic without clones');
	});

	it('computes clone-to-star ratio correctly', () => {
		const result = analyzeCloning(30, 5, 10);
		expect(result.cloneToStarRatio).toBe(3); // 30/10 = 3.0 → round(3.0*10)/10 = 3
	});

	it('returns null ratio when no stars', () => {
		const result = analyzeCloning(10, 2, 0);
		expect(result.cloneToStarRatio).toBeNull(); // ratio is null when stars = 0
	});
});

// ── analyzeVelocity ───────────────────────────────────────────────────────────

describe('analyzeVelocity', () => {
	it('returns declining when current views are zero', () => {
		const result = analyzeVelocity(0, 100);
		expect(result.velocity).toBe('declining');
	});

	it('marks steady with no previous data', () => {
		const result = analyzeVelocity(50, null);
		expect(result.velocity).toBe('steady');
		expect(result.changePercent).toBe(0);
	});

	it('detects accelerating traffic (> 30% increase)', () => {
		const result = analyzeVelocity(200, 100);
		expect(result.velocity).toBe('accelerating');
		expect(result.changePercent).toBe(100);
	});

	it('detects declining traffic (< -15% decrease)', () => {
		const result = analyzeVelocity(50, 100);
		expect(result.velocity).toBe('declining');
		expect(result.changePercent).toBe(-50);
	});

	it('marks steady for minor changes (-15% to +30%)', () => {
		expect(analyzeVelocity(110, 100).velocity).toBe('steady'); // +10%
		expect(analyzeVelocity(90, 100).velocity).toBe('steady'); // -10%
		expect(analyzeVelocity(130, 100).velocity).toBe('steady'); // +30% (edge)
	});

	it('handles zero previous views', () => {
		const result = analyzeVelocity(50, 0);
		expect(result.velocity).toBe('steady');
		expect(result.changePercent).toBe(0);
	});
});

// ── analyzeSources ────────────────────────────────────────────────────────────

describe('analyzeSources', () => {
	it('returns empty array for no referrers', () => {
		expect(analyzeSources([], null, 10)).toEqual([]);
	});

	it('classifies known referrers and marks new sources', () => {
		const referrers = [{ referrer: 'reddit.com/r/programming', count: 25, uniques: 20 }];
		const results = analyzeSources(referrers, null, 5);

		expect(results).toHaveLength(1);
		expect(results[0].source).toBe('Reddit');
		expect(results[0].isNew).toBe(true);
		expect(results[0].views).toBe(25);
	});

	it('marks trending sources (> 1.3x previous)', () => {
		const current = [{ referrer: 'twitter.com', count: 30, uniques: 20 }];
		const previous = [{ referrer: 'twitter.com', count: 20 }];
		const results = analyzeSources(current, previous, 5);

		expect(results[0].isTrending).toBe(true); // 30 > 20 * 1.3 = 26
	});

	it('marks dropped sources (< 0.5x previous)', () => {
		const current = [{ referrer: 'reddit.com', count: 8, uniques: 5 }];
		const previous = [{ referrer: 'reddit.com', count: 20 }];
		const results = analyzeSources(current, previous, 5);

		expect(results[0].sentiment).toBe('warning');
	});

	it('limits results to top 10 referrers', () => {
		const referrers = Array.from({ length: 15 }, (_, i) => ({
			referrer: `source${i}.com`,
			count: 100 - i,
			uniques: 50
		}));
		const results = analyzeSources(referrers, null, 10);
		expect(results.length).toBeLessThanOrEqual(10);
	});
});

// ── computeTopSourceAction ────────────────────────────────────────────────────

describe('computeTopSourceAction', () => {
	it('returns null for no sources', () => {
		const conversion = analyzeConversion(100, 10, null, null);
		expect(computeTopSourceAction([], conversion)).toBeNull();
	});

	it('recommends social platform when available', () => {
		const sources = analyzeSources(
			[{ referrer: 'reddit.com', count: 50, uniques: 40 }],
			null,
			10
		);
		const conversion = analyzeConversion(100, 10, null, null);
		const action = computeTopSourceAction(sources, conversion);

		expect(action).toContain('Reddit');
	});

	it('recommends developer platform when available', () => {
		const sources = analyzeSources(
			[{ referrer: 'github.com', count: 10, uniques: 8 }],
			null,
			5
		);
		const conversion = analyzeConversion(50, 5, null, null);
		const action = computeTopSourceAction(sources, conversion);

		expect(action).toContain('GitHub');
	});
});

// ── computeOneThing ───────────────────────────────────────────────────────────

describe('computeOneThing', () => {
	it('prioritizes conversion leak over everything', () => {
		const conversion = analyzeConversion(1000, 5, null, null); // 200 views/star
		const cloning = analyzeCloning(0, 0, 5);
		const velocity = analyzeVelocity(500, 400);
		const sources = analyzeSources(
			[{ referrer: 'reddit.com', count: 100, uniques: 80 }],
			null,
			5
		);

		const result = computeOneThing({
			conversion,
			cloning,
			velocity,
			topSources: sources,
			topSourceAction: computeTopSourceAction(sources, conversion)
		});

		expect(result).toContain('README');
	});

	it('prioritizes declining velocity when conversion is ok', () => {
		const conversion = analyzeConversion(50, 10, null, null); // 5 views/star
		const cloning = analyzeCloning(0, 0, 10);
		const velocity = analyzeVelocity(20, 100);
		const sources = analyzeSources([], null, 10);

		const result = computeOneThing({
			conversion,
			cloning,
			velocity,
			topSources: sources,
			topSourceAction: null
		});

		expect(result).toContain('Traffic dropped');
	});

	it('returns steady message when nothing urgent', () => {
		const conversion = analyzeConversion(100, 10, null, null);
		const cloning = analyzeCloning(0, 0, 10);
		const velocity = analyzeVelocity(100, 95);
		const sources = analyzeSources([], null, 10);

		const result = computeOneThing({
			conversion,
			cloning,
			velocity,
			topSources: sources,
			topSourceAction: null
		});

		expect(result).toContain('steady');
	});
});

// ── computeExternalReachScore ─────────────────────────────────────────────────

describe('computeExternalReachScore', () => {
	it('returns zero score with no data', () => {
		const conversion = analyzeConversion(0, 0, null, null);
		const velocity = analyzeVelocity(0, null);

		const result = computeExternalReachScore({
			topSources: [],
			trafficVelocity: velocity,
			conversion
		});

		expect(result.score).toBe(0);
		expect(result.tier).toBe('none');
	});

	it('scores strong reach with social traffic + good conversion', () => {
		const conversion = analyzeConversion(50, 20, null, null); // 2.5 views/star
		const velocity = analyzeVelocity(50, 30);
		const sources = analyzeSources(
			[{ referrer: 'news.ycombinator.com', count: 50, uniques: 40 }],
			null,
			20
		);

		const result = computeExternalReachScore({
			topSources: sources,
			trafficVelocity: velocity,
			conversion
		});

		expect(result.score).toBeGreaterThan(0);
		expect(result.trafficTrend).toBe('accelerating');
	});

	it('scores weak reach with poor conversion', () => {
		const conversion = analyzeConversion(500, 2, null, null); // 250 views/star
		const velocity = analyzeVelocity(500, 450);
		const sources = analyzeSources(
			[{ referrer: 'some-unknown-site.com', count: 500, uniques: 400 }],
			null,
			2
		);

		const result = computeExternalReachScore({
			topSources: sources,
			trafficVelocity: velocity,
			conversion
		});

		// Should be low but not zero
		expect(result.score).toBeLessThan(40);
	});
});
