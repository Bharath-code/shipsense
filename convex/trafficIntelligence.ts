import { internalQuery, query } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';

// ── Types ────────────────────────────────────────────────────────────────────

export type TrafficSourceInsight = {
	source: string;
	rawReferrer: string;
	views: number;
	uniques: number;
	conversionRate: number; // stars per 100 views
	isNew: boolean;
	isTrending: boolean;
	sentiment: 'positive' | 'neutral' | 'warning';
	action?: string;
};

export type TrafficConversionInsight = {
	viewsToStars: number;
	views: number;
	stars: number;
	conversionLabel: string;
	conversionTrend: 'improving' | 'declining' | 'stable';
	previousViewsToStars: number | null;
	analysis: string;
	action: string;
};

export type CloneInterestInsight = {
	clones: number;
	uniqueCloners: number;
	cloneToStarRatio: number | null;
	stars: number;
	label: string;
	analysis: string;
	action: string;
};

export type TrafficVelocityInsight = {
	currentViews: number;
	previousViews: number | null;
	changePercent: number;
	velocity: 'accelerating' | 'steady' | 'declining';
	analysis: string;
	action: string;
};

export type TrafficIntelligenceReport = {
	repoName: string;
	generatedAt: number;
	conversion: TrafficConversionInsight;
	cloning: CloneInterestInsight;
	velocity: TrafficVelocityInsight;
	topSources: TrafficSourceInsight[];
	topSourceAction: string | null;
	oneThing: string; // Single most important recommendation
	hasEnoughData: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const REFERRER_SOURCES: Record<string, string> = {
	'hacker news': 'Hacker News',
	'news.ycombinator': 'Hacker News',
	reddit: 'Reddit',
	twitter: 'X (Twitter)',
	'x.com': 'X (Twitter)',
	linkedin: 'LinkedIn',
	'dev.to': 'Dev.to',
	youtube: 'YouTube',
	google: 'Google Search',
	bing: 'Bing Search',
	duckduckgo: 'DuckDuckGo',
	github: 'GitHub',
	'producthunt': 'Product Hunt',
	'lobste.rs': 'Lobsters',
	medium: 'Medium',
	instagram: 'Instagram',
	facebook: 'Facebook'
};

function classifyReferrer(referrer: string): string | null {
	const lower = referrer.toLowerCase();
	for (const [key, label] of Object.entries(REFERRER_SOURCES)) {
		if (lower.includes(key)) return label;
	}
	return null; // direct / unknown
}

function isSearchEngine(source: string | null): boolean {
	return source === 'Google Search' || source === 'Bing Search' || source === 'DuckDuckGo';
}

function isSocialPlatform(source: string | null): boolean {
	return [
		'Hacker News',
		'Reddit',
		'X (Twitter)',
		'LinkedIn',
		'Dev.to',
		'YouTube'
	].includes(source ?? '');
}

function isDeveloperPlatform(source: string | null): boolean {
	return ['GitHub', 'Lobsters'].includes(source ?? '');
}

function formatRatio(numerator: number, denominator: number): string {
	if (denominator === 0) return '0.00';
	return (numerator / denominator).toFixed(2);
}

// ── Conversion Analysis ──────────────────────────────────────────────────────

function analyzeConversion(
	views: number,
	starsLast7d: number,
	prevViews: number | null,
	prevStarsLast7d: number | null
): TrafficConversionInsight {
	if (views === 0) {
		return {
			viewsToStars: 0,
			views: 0,
			stars: starsLast7d,
			conversionLabel: 'No data',
			conversionTrend: 'stable',
			previousViewsToStars: null,
			analysis: 'No traffic data yet. Traffic starts collecting after repo sync.',
			action: 'Run a sync and check back in 24 hours.'
		};
	}

	const viewsPerStar = views / Math.max(1, starsLast7d);
	const conversionPct = ((starsLast7d / Math.max(1, views)) * 100).toFixed(1);

	let conversionLabel: string;
	let analysis: string;
	let action: string;

	if (viewsPerStar <= 5) {
		conversionLabel = `${conversionPct}% (${Math.round(viewsPerStar)} views/star)`;
		analysis = `Exceptional conversion rate — roughly 1 star for every ${Math.round(viewsPerStar)} views. Your repo resonates strongly with visitors.`;
		action =
			'Lean in to this momentum. Double down on whatever traffic sources are driving this quality traffic. Consider pinning a "Star" CTA at the top of your README.';
	} else if (viewsPerStar <= 20) {
		conversionLabel = `${conversionPct}% (${Math.round(viewsPerStar)} views/star)`;
		analysis = `Healthy conversion — 1 star per ~${Math.round(viewsPerStar)} views. Typical for active open source projects.`;
		action =
			'Optimize your README hero section. Add a clear one-liner value proposition, screenshot/GIF demo, and a prominent "⭐ Star if you find this useful" badge.';
	} else if (viewsPerStar <= 50) {
		conversionLabel = `${conversionPct}% (${Math.round(viewsPerStar)} views/star)`;
		analysis = `Lower than average conversion. Visitors are arriving but not sticking around to star.`;
		action =
			'Your README is likely the bottleneck. Add: (1) a clear value prop in the first 2 lines, (2) a demo GIF or screenshot, (3) quick-start install instructions. Most visitors decide in 10 seconds.';
	} else {
		conversionLabel = `${conversionPct}% (${Math.round(viewsPerStar)} views/star)`;
		analysis = `Very few stars relative to traffic. This is a leak — visitors arrive and leave without engaging.`;
		action =
			'Likely causes: README unclear, project not maintained, or traffic source is unrelated. Review your top referrer — if it\'s irrelevant, ignore. If it\'s qualified, fix your README immediately. Add social proof (star count, contributors, recent commits).';
	}

	// Trend analysis
	let conversionTrend: 'improving' | 'declining' | 'stable' = 'stable';
	let previousViewsToStars: number | null = null;

	if (
		prevViews !== null &&
		prevStarsLast7d !== null &&
		prevViews > 0 &&
		prevStarsLast7d > 0
	) {
		previousViewsToStars = prevViews / prevStarsLast7d;
		if (viewsPerStar < previousViewsToStars * 0.8) {
			conversionTrend = 'improving';
			analysis += ` Conversion improved vs. last period (was 1 per ${Math.round(previousViewsToStars)} views).`;
		} else if (viewsPerStar > previousViewsToStars * 1.2) {
			conversionTrend = 'declining';
			analysis += ` Conversion dropped vs. last period (was 1 per ${Math.round(previousViewsToStars)} views).`;
		}
	}

	return {
		viewsToStars: Math.round(viewsPerStar),
		views,
		stars: starsLast7d,
		conversionLabel,
		conversionTrend,
		previousViewsToStars,
		analysis,
		action
	};
}

// ── Clone Interest Analysis ──────────────────────────────────────────────────

function analyzeCloning(
	clones: number,
	uniqueCloners: number,
	stars: number
): CloneInterestInsight {
	if (clones === 0) {
		return {
			clones: 0,
			uniqueCloners: 0,
			cloneToStarRatio: 0,
			stars,
			label: 'No data',
			analysis: 'No clone data yet. This tracks how many people are cloning your repo locally.',
			action: 'Sync again to start tracking developer interest.'
		};
	}

	const ratio = stars > 0 ? clones / stars : clones;
	const isDevInterest = uniqueCloners > 0 && uniqueCloners >= 3;

	let label: string;
	let analysis: string;
	let action: string;

	if (uniqueCloners >= 10 || (stars > 0 && ratio > 3)) {
		label = `${uniqueCloners} developers cloning`;
		analysis = `Strong developer interest — ${uniqueCloners} unique people cloned this repo. `;
		analysis +=
			ratio > 3
				? `Clone-to-star ratio of ${ratio.toFixed(1)}x shows people are using this, not just browsing.`
				: `People who clone are highly engaged developers. Consider adding a CONTRIBUTING.md if you don't have one.`;
		action =
			'Add a CONTRIBUTING.md with clear setup instructions. These developers are your future contributors — make onboarding frictionless.';
	} else if (uniqueCloners > 0) {
		label = `${uniqueCloners} developer${uniqueCloners > 1 ? 's' : ''} cloning`;
		analysis = `${uniqueCloners} developer${uniqueCloners > 1 ? 's' : ''} pulled this repo locally — they're evaluating or using it, not just starring.`;
		action =
			'Ensure your README has a "Getting Started" section. Developer who clone are the ones who will open issues and PRs.';
	} else {
		label = 'Traffic without clones';
		analysis = 'People are viewing but no one is cloning. These are passive visitors, not potential users.';
		action =
			'If you want developer adoption, make your value prop clearer. Show screenshots, benchmarks, or use cases that make cloning worth it.';
	}

	return {
		clones,
		uniqueCloners,
		cloneToStarRatio: stars > 0 ? Math.round(ratio * 10) / 10 : null,
		stars,
		label,
		analysis,
		action
	};
}

// ── Traffic Velocity Analysis ────────────────────────────────────────────────

function analyzeVelocity(
	currentViews: number,
	previousViews: number | null
): TrafficVelocityInsight {
	if (currentViews === 0) {
		return {
			currentViews: 0,
			previousViews: previousViews ?? 0,
			changePercent: 0,
			velocity: 'declining',
			analysis: 'No current traffic data. Run a sync to collect stats.',
			action: 'Click Sync Now to refresh all data.'
		};
	}

	let changePercent = 0;
	if (previousViews && previousViews > 0) {
		changePercent = ((currentViews - previousViews) / previousViews) * 100;
	} else {
		changePercent = 0;
	}

	let velocity: 'accelerating' | 'steady' | 'declining';
	let analysis: string;
	let action: string;

	if (!previousViews || previousViews === 0) {
		velocity = currentViews > 0 ? 'steady' : 'declining';
		analysis = `Baseline established at ${currentViews} views.`;
		action = 'Keep syncing daily to track the trend line.';
	} else if (changePercent > 30) {
		velocity = 'accelerating';
		analysis = `Traffic accelerated ${Math.round(changePercent)}% — you picked up ${currentViews - previousViews} more views than last period.`;
		action =
			'This is your biggest leverage moment. Find which source drove the spike and amplify it — share more content there, engage with comments.';
	} else if (changePercent > -15) {
		velocity = 'steady';
		analysis = `Traffic is stable, ${currentViews > 0 ? `${currentViews} views this period.` : 'consistent with prior period.'}`;
		action =
			'Stable is fine, but growth needs a catalyst. Consider posting on a developer community (HN, Reddit, Dev.to) to push traffic higher.';
	} else {
		velocity = 'declining';
		analysis = `Traffic declined ${Math.round(Math.abs(changePercent))}% — dropped from ${previousViews} to ${currentViews} views.`;
		action =
			'Likely a previous spike has normalized. Review top referrers — if a major source went quiet, consider re-engaging there or trying a new channel.';
	}

	return {
		currentViews,
		previousViews,
		changePercent: Math.round(changePercent),
		velocity,
		analysis,
		action
	};
}

// ── Source Analysis ──────────────────────────────────────────────────────────

function analyzeSources(
	currentReferrers: Array<{ referrer: string; count: number; uniques: number }>,
	previousReferrers: Array<{ referrer: string; count: number }> | null,
	starsLast7d: number
): TrafficSourceInsight[] {
	if (!currentReferrers || currentReferrers.length === 0) {
		return [];
	}

	const prevReferrerCount = new Map<string, number>();
	if (previousReferrers) {
		for (const r of previousReferrers) {
			prevReferrerCount.set(r.referrer, r.count);
		}
	}

	const topReferrerCount = Math.max(...currentReferrers.map((r) => r.count), 1);

	return currentReferrers.slice(0, 10).map((ref) => {
		const source = classifyReferrer(ref.referrer);
		const conversionPer100 =
			ref.count > 0 ? ((starsLast7d / Math.max(1, ref.count)) * 100).toFixed(1) : '0.0';
		const isNew = !prevReferrerCount.has(ref.referrer);
		const prevCount = prevReferrerCount.get(ref.referrer) || 0;
		const isTrending = prevCount > 0 && ref.count > prevCount * 1.3;

		let sentiment: 'positive' | 'neutral' | 'warning';
		let action: string | undefined;

		if (isNew && ref.count >= 10) {
			sentiment = 'positive';
			action = `First time seeing ${source || ref.referrer} traffic. Engage with that community!`;
		} else if (isTrending) {
			const growth = Math.round(((ref.count - prevCount) / Math.max(prevCount, 1)) * 100);
			sentiment = 'positive';
			action = `${source || ref.referrer} is ${growth}% bigger — double down on this channel.`;
		} else if (prevCount > 0 && ref.count < prevCount * 0.5) {
			const drop = Math.round(((prevCount - ref.count) / Math.max(prevCount, 1)) * 100);
			sentiment = 'warning';
			action = `${source || ref.referrer} dropped ${drop}% — check if your content was removed or buried.`;
		} else if (source && isSocialPlatform(source) && ref.count >= 5) {
			sentiment = 'positive';
			action = `You're getting qualified traffic from ${source}. Post more updates there.`;
		} else if (source && isSearchEngine(source)) {
			sentiment = 'neutral';
			action = 'SEO traffic is compounding. Keep README keywords aligned with your project\'s purpose.';
		} else {
			sentiment = 'neutral';
		}

		return {
			source: source || ref.referrer,
			rawReferrer: ref.referrer,
			views: ref.count,
			uniques: ref.uniques,
			conversionRate: parseFloat(conversionPer100),
			isNew,
			isTrending,
			sentiment,
			action
		};
	});
}

// ── Top Source Action ────────────────────────────────────────────────────────

function computeTopSourceAction(
	sources: TrafficSourceInsight[],
	conversion: TrafficConversionInsight
): string | null {
	if (sources.length === 0) return null;

	// Find the top converting source
	const socialSources = sources.filter(
		(s) => isSocialPlatform(s.source) && s.views >= 5
	);
	if (socialSources.length > 0) {
		const best = socialSources.sort((a, b) => b.conversionRate - a.conversionRate)[0];
		return `Your best traffic source is ${best.source} with ${best.views} views. Post weekly updates there to keep the pipeline full.`;
	}

	// Developer platforms drive highest quality traffic
	const devSources = sources.filter(
		(s) => isDeveloperPlatform(s.source) && s.views >= 3
	);
	if (devSources.length > 0) {
		return `${devSources[0].source} is sending developers your way. Make sure your CONTRIBUTING.md is ready for incoming interest.`;
	}

	// If conversion is bad, focus there
	if (conversion.viewsToStars > 30) {
		return `Traffic is flowing but not converting (${conversion.viewsToStars} views per star). Fix this before chasing more traffic.`;
	}

	return null;
}

// ── Compute "One Thing" ──────────────────────────────────────────────────────

function computeOneThing(report: {
	conversion: TrafficConversionInsight;
	cloning: CloneInterestInsight;
	velocity: TrafficVelocityInsight;
	topSources: TrafficSourceInsight[];
	topSourceAction: string | null;
}): string {
	const { conversion, cloning, velocity, topSources, topSourceAction } = report;

	// 1. Conversion leak is most urgent
	if (conversion.views > 0 && conversion.viewsToStars > 50) {
		return `🔴 Your README is losing 98% of visitors. ${conversion.action}`;
	}

	// 2. Declining velocity
	if (velocity.velocity === 'declining' && velocity.currentViews > 0) {
		return `📉 Traffic dropped ${Math.abs(velocity.changePercent)}%. ${topSourceAction || 'Find and re-engage with your top traffic source.'}`;
	}

	// 3. New high-quality source
	const newGoodSource = topSources.find(
		(s) => s.isNew && s.views >= 10 && (isSocialPlatform(s.source) || isDeveloperPlatform(s.source))
	);
	if (newGoodSource) {
		return `🎉 New traffic from ${newGoodSource.source}! ${newGoodSource.action}`;
	}

	// 4. High clone interest
	if (cloning.uniqueCloners >= 5) {
		return `👨‍💻 ${cloning.uniqueCloners} developers cloned this repo. ${cloning.action}`;
	}

	// 5. Good momentum
	if (velocity.velocity === 'accelerating' && conversion.conversionTrend === 'improving') {
		return `🚀 Traffic AND conversion both improving. ${topSourceAction || 'Keep doing what you\'re doing.'}`;
	}

	// 6. Stable, no urgent action needed
	if (velocity.velocity === 'steady' && conversion.views > 0) {
		return `✅ Traffic steady. ${topSourceAction || 'Consider posting on a dev community for a growth bump.'}`;
	}

	// 7. No data yet
	return 'Sync your repo to start collecting traffic intelligence.';
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function computeTrafficIntelligence(input: {
	repoName: string;
	currentViews: number;
	currentUniques: number;
	currentClones: number;
	currentUniqueCloners: number;
	starsLast7d: number;
	starsTotal: number;
	previousViews: number | null;
	previousStarsLast7d: number | null;
	currentReferrers: Array<{ referrer: string; count: number; uniques: number }>;
	previousReferrers: Array<{ referrer: string; count: number }> | null;
}): TrafficIntelligenceReport {
	const conversion = analyzeConversion(
		input.currentViews,
		input.starsLast7d,
		input.previousViews,
		input.previousStarsLast7d
	);

	const cloning = analyzeCloning(
		input.currentClones,
		input.currentUniqueCloners,
		input.starsTotal
	);

	const velocity = analyzeVelocity(input.currentViews, input.previousViews);

	const sources = analyzeSources(
		input.currentReferrers,
		input.previousReferrers,
		input.starsLast7d
	);

	const topSourceAction = computeTopSourceAction(sources, conversion);

	const report: TrafficIntelligenceReport = {
		repoName: input.repoName,
		generatedAt: Date.now(),
		conversion,
		cloning,
		velocity,
		topSources: sources,
		topSourceAction,
		oneThing: computeOneThing({ conversion, cloning, velocity, topSources: sources, topSourceAction }),
		hasEnoughData: input.currentViews > 0 && input.currentReferrers.length > 0
	};

	return report;
}

// ── Convex Queries ───────────────────────────────────────────────────────────

export const getTrafficIntelligence = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		// Current latest snapshot
		const latestSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		// Previous snapshot (for comparison)
		const snapshots = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.take(2);
		const previousSnapshot = snapshots[1] ?? null;

		// Current referrers
		const latestReferrers = await ctx.db
			.query('repoReferrers')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		// Previous referrers
		const referrerHistory = await ctx.db
			.query('repoReferrers')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.take(2);
		const previousReferrers = referrerHistory[1] ?? null;

		return computeTrafficIntelligence({
			repoName: repo.name,
			currentViews: latestSnapshot?.views ?? 0,
			currentUniques: latestSnapshot?.uniqueVisitors ?? 0,
			currentClones: latestSnapshot?.clones ?? 0,
			currentUniqueCloners: latestSnapshot?.uniqueCloners ?? 0,
			starsLast7d: latestSnapshot?.starsLast7d ?? 0,
			starsTotal: latestSnapshot?.stars ?? repo.starsCount,
			previousViews: previousSnapshot?.views ?? null,
			previousStarsLast7d: previousSnapshot?.starsLast7d ?? null,
			currentReferrers: (latestReferrers?.referrers ?? []).map((r) => ({
				referrer: r.referrer,
				count: r.count,
				uniques: r.uniques
			})),
			previousReferrers: previousReferrers?.referrers ?? null
		});
	}
});

// ── Internal: for daily digest integration ───────────────────────────────────

export const computeTrafficIntelligenceInternal = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const repo = await ctx.db.get(args.repoId);
		if (!repo) return null;

		const latestSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		const snapshots = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.take(2);
		const previousSnapshot = snapshots[1] ?? null;

		const latestReferrers = await ctx.db
			.query('repoReferrers')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		const referrerHistory = await ctx.db
			.query('repoReferrers')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.take(2);
		const previousReferrers = referrerHistory[1] ?? null;

		return computeTrafficIntelligence({
			repoName: repo.name,
			currentViews: latestSnapshot?.views ?? 0,
			currentUniques: latestSnapshot?.uniqueVisitors ?? 0,
			currentClones: latestSnapshot?.clones ?? 0,
			currentUniqueCloners: latestSnapshot?.uniqueCloners ?? 0,
			starsLast7d: latestSnapshot?.starsLast7d ?? 0,
			starsTotal: latestSnapshot?.stars ?? repo.starsCount,
			previousViews: previousSnapshot?.views ?? null,
			previousStarsLast7d: previousSnapshot?.starsLast7d ?? null,
			currentReferrers: (latestReferrers?.referrers ?? []).map((r) => ({
				referrer: r.referrer,
				count: r.count,
				uniques: r.uniques
			})),
			previousReferrers: previousReferrers?.referrers ?? null
		});
	}
});

// ── External Reach Score Composite ───────────────────────────────────────────
// Top referrer quality × traffic trend × conversion rate

export type ExternalReachTier = 'strong' | 'moderate' | 'weak' | 'none';

export type ExternalReachScore = {
	score: number; // 0-100
	tier: ExternalReachTier;
	narrative: string;
	topSource: string | null;
	topSourceViews: number;
	topSourceConversion: number;
	trafficTrend: 'accelerating' | 'steady' | 'declining';
};

const REFERRER_QUALITY: Record<string, number> = {
	'Hacker News': 3,
	'Reddit': 3,
	'X (Twitter)': 3,
	'Product Hunt': 3,
	'Lobsters': 3,
	'Dev.to': 2.5,
	'YouTube': 2.5,
	'LinkedIn': 2,
	'GitHub': 2,
	'Google Search': 1.5,
	'Bing Search': 1,
	'DuckDuckGo': 1,
	'Medium': 1,
	'Instagram': 0.8,
	'Facebook': 0.8
};

function referrerQualityScore(source: string | null): number {
	if (!source) return 1;
	return REFERRER_QUALITY[source] ?? 1;
}

function computeExternalReachScore(input: {
	topSources: TrafficSourceInsight[];
	trafficVelocity: TrafficVelocityInsight;
	conversion: TrafficConversionInsight;
}): ExternalReachScore {
	const { topSources, trafficVelocity, conversion } = input;

	if (topSources.length === 0 || conversion.views === 0) {
		return {
			score: 0,
			tier: 'none',
			narrative: 'No traffic data collected yet. Run a sync and check back in 24 hours.',
			topSource: null,
			topSourceViews: 0,
			topSourceConversion: 0,
			trafficTrend: 'declining'
		};
	}

	// 1. Referrer quality score (0-40 points)
	const socialReferrers = topSources.filter(
		(s) => isSocialPlatform(s.source) || isDeveloperPlatform(s.source)
	);
	const bestSocial = socialReferrers.sort((a, b) => b.views - a.views)[0];

	let qualityScore = 0;
	if (bestSocial && bestSocial.views >= 5) {
		const weight = referrerQualityScore(bestSocial.source);
		const viewsRatio = Math.min(bestSocial.views / 100, 1); // cap at 100 views
		qualityScore = Math.round(weight * viewsRatio * (40 / 3)); // max 40 points
	} else if (conversion.views > 0) {
		// All traffic is direct/unknown — still give a small score
		qualityScore = Math.round(Math.min(conversion.views / 50, 1) * 10);
	}

	// 2. Traffic trend (0-30 points)
	let trendScore = 0;
	let trend: 'accelerating' | 'steady' | 'declining';
	if (trafficVelocity.velocity === 'accelerating') {
		trend = 'accelerating';
		trendScore = Math.round(
			Math.min(trafficVelocity.changePercent / 100, 1) * 30
		);
	} else if (trafficVelocity.velocity === 'steady') {
		trend = 'steady';
		trendScore = conversion.views > 20 ? 18 : 10;
	} else {
		trend = 'declining';
		trendScore = Math.round(
			Math.max(0, 30 - Math.abs(trafficVelocity.changePercent))
		);
	}

	// 3. Conversion rate (0-30 points)
	let conversionScore = 0;
	const viewsToStars = conversion.viewsToStars;
	if (viewsToStars === 0) {
		conversionScore = 0;
	} else if (viewsToStars <= 5) {
		conversionScore = 30; // exceptional
	} else if (viewsToStars <= 10) {
		conversionScore = 25;
	} else if (viewsToStars <= 20) {
		conversionScore = 20; // healthy
	} else if (viewsToStars <= 30) {
		conversionScore = 12;
	} else {
		conversionScore = Math.max(2, Math.round(30 - viewsToStars / 5));
	}

	const totalScore = qualityScore + trendScore + conversionScore;

	let tier: ExternalReachTier;
	if (totalScore >= 65) tier = 'strong';
	else if (totalScore >= 35) tier = 'moderate';
	else if (totalScore > 0) tier = 'weak';
	else tier = 'none';

	// 4. Narrative generation
	const topSource = bestSocial?.source ?? topSources[0]?.source ?? null;
	const topSourceViews = bestSocial?.views ?? topSources[0]?.views ?? 0;
	const topSourceConversion = bestSocial?.conversionRate ?? topSources[0]?.conversionRate ?? 0;

	let narrative: string;

	if (tier === 'strong') {
		if (bestSocial && bestSocial.views >= 20) {
			narrative = `Your external reach is strong — ${bestSocial.source} sent ${bestSocial.views} visitors this week with ${bestSocial.conversionRate}% conversion. Double down there.`;
		} else if (trafficVelocity.velocity === 'accelerating') {
			narrative = `Traffic is accelerating ${trafficVelocity.changePercent > 0 ? `(+${trafficVelocity.changePercent}%)` : ''} and converting well. ${topSource ? `${topSource} is your primary channel.` : 'Keep the momentum going.'}`;
		} else {
			narrative = `Consistent high-quality reach — ${conversion.views} views with ${conversion.conversionLabel} conversion. Your audience is finding you reliably.`;
		}
	} else if (tier === 'moderate') {
		if (bestSocial && bestSocial.views > 0) {
			narrative = `Moderate reach — ${bestSocial.source} is sending ${bestSocial.views} visitors. Conversion is ${conversion.conversionLabel} — ${conversion.viewsToStars > 20 ? 'fix your README to improve it' : 'solid for this stage'}.`;
		} else if (trafficVelocity.velocity === 'declining') {
			narrative = `Reach is declining — traffic dropped ${Math.abs(trafficVelocity.changePercent)}% vs. prior period. Consider re-engaging on a developer platform.`;
		} else {
			narrative = `Steady but modest reach. Post on a developer community (HN, Reddit, Dev.to) to push traffic higher.`;
		}
	} else if (tier === 'weak') {
		if (conversion.viewsToStars > 30) {
			narrative = `Visitors are arriving but not converting (${conversion.viewsToStars} views per star). Fix your README before chasing more traffic.`;
		} else if (!bestSocial) {
			narrative = `Mostly direct traffic. Start posting on developer platforms to amplify your reach.`;
		} else {
			narrative = `Weak reach — ${topSource ? `${topSource} sent only ${topSourceViews} visitors` : 'minimal traffic'}. Focus on getting your project in front of one active community.`;
		}
	} else {
		narrative = 'No external reach data yet. Sync your repo to start collecting traffic intelligence.';
	}

	return {
		score: Math.min(totalScore, 100),
		tier,
		narrative,
		topSource,
		topSourceViews,
		topSourceConversion,
		trafficTrend: trend
	};
}

// ── Risk Stack Composite ─────────────────────────────────────────────────────
// Vulnerabilities + Outdated majors + Anomalies + README gaps → single risk priority

export type RiskTier = 'critical' | 'high' | 'moderate' | 'low' | 'clean';

export type RiskItem = {
	type: 'vulnerability' | 'anomaly' | 'outdated_dep' | 'readme_gap';
	severity: 'critical' | 'high' | 'medium' | 'low';
	title: string;
	description: string;
	action: string;
	name?: string; // dep name or anomaly kind
};

export type RiskStack = {
	score: number; // 0 (clean) - 100 (critical)
	tier: RiskTier;
	topRisk: RiskItem | null;
	items: RiskItem[];
	narrative: string;
};

const VULN_SEVERITY_SCORE: Record<string, number> = {
	critical: 40,
	high: 30,
	moderate: 20,
	low: 10,
	none: 0,
	unknown: 5
};

const ANOMALY_SEVERITY_SCORE: Record<string, number> = {
	high: 25,
	medium: 15,
	low: 5
};

const OUTDATED_TYPE_SCORE: Record<string, number> = {
	major: 12,
	minor: 5,
	patch: 2,
	unknown: 3,
	none: 0
};

function computeRiskStack(input: {
	dependencies: Array<{
		name: string;
		hasVulnerability: boolean;
		vulnerabilitySeverity: string;
		vulnerabilitySummary?: string;
		isDeprecated: boolean;
		deprecationMessage?: string;
		outdatedType: string;
		latestVersion?: string;
		currentVersion: string;
	}>;
	anomalies: Array<{
		kind: string;
		severity: string;
		title: string;
		description: string;
		recommendedAction: string;
	}>;
	readmeScore: number | null;
	readmeSuggestions?: string[];
}): RiskStack {
	const items: RiskItem[] = [];
	let totalScore = 0;

	// 1. Critical vulnerabilities (highest priority)
	const vulns = input.dependencies.filter((d) => d.hasVulnerability);
	for (const vuln of vulns) {
		const sevScore = VULN_SEVERITY_SCORE[vuln.vulnerabilitySeverity] ?? 0;
		totalScore += sevScore;

		const severityLabel =
			vuln.vulnerabilitySeverity === 'critical' ? 'critical' : 'high';
		items.push({
			type: 'vulnerability',
			severity: severityLabel,
			title: `🔴 Vulnerability in ${vuln.name}`,
			description: vuln.vulnerabilitySummary ?? `${vuln.name} has a ${vuln.vulnerabilitySeverity} severity vulnerability.`,
			action: vuln.latestVersion
				? `Upgrade ${vuln.name} from ${vuln.currentVersion} to ${vuln.latestVersion}.`
				: `Review ${vuln.name} for a secure alternative or patch.`,
			name: vuln.name
		});
	}

	// Deprecated deps
	const deprecated = input.dependencies.filter((d) => d.isDeprecated);
	for (const dep of deprecated) {
		totalScore += 10;
		items.push({
			type: 'vulnerability',
			severity: 'high',
			title: `Deprecated dependency: ${dep.name}`,
			description: dep.deprecationMessage ?? `${dep.name} is no longer maintained.`,
			action: dep.latestVersion
				? `Migrate away from ${dep.name} (${dep.currentVersion}) — consider ${dep.latestVersion} or an alternative.`
				: `Find a maintained replacement for ${dep.name}.`,
			name: dep.name
		});
	}

	// 2. Active anomalies (momentum drop, etc.)
	for (const anomaly of input.anomalies) {
		const sevScore = ANOMALY_SEVERITY_SCORE[anomaly.severity] ?? 0;
		totalScore += sevScore;

		let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
		if (anomaly.kind === 'momentum_drop') {
			severity = anomaly.severity === 'high' ? 'high' : 'medium';
		}

		items.push({
			type: 'anomaly',
			severity,
			title: anomaly.title,
			description: anomaly.description,
			action: anomaly.recommendedAction,
			name: anomaly.kind
		});
	}

	// 3. Major outdated dependencies
	const majorOutdated = input.dependencies.filter((d) => d.outdatedType === 'major' && !d.hasVulnerability && !d.isDeprecated);
	for (const dep of majorOutdated) {
		const outScore = OUTDATED_TYPE_SCORE[dep.outdatedType] ?? 5;
		totalScore += outScore;
		items.push({
			type: 'outdated_dep',
			severity: 'medium',
			title: `Major update available: ${dep.name}`,
			description: `${dep.name} is on ${dep.currentVersion}, latest is ${dep.latestVersion ?? 'unknown'}.`,
			action: dep.latestVersion
				? `Schedule an update for ${dep.name} to ${dep.latestVersion} this week.`
				: `Check ${dep.name} for migration notes before updating.`,
			name: dep.name
		});
	}

	// Minor/patch outdated (lower priority)
	const minorOutdated = input.dependencies.filter(
		(d) => (d.outdatedType === 'minor' || d.outdatedType === 'patch') && !d.hasVulnerability && !d.isDeprecated
	);
	if (minorOutdated.length >= 3) {
		const batchScore = Math.min(minorOutdated.length * 3, 15);
		totalScore += batchScore;
		items.push({
			type: 'outdated_dep',
			severity: 'low',
			title: `${minorOutdated.length} dependencies have minor updates`,
			description: minorOutdated.map((d) => `${d.name} (${d.currentVersion})`).join(', '),
			action: 'Batch update these dependencies together to keep things current.',
			name: 'batch'
		});
	}

	// 4. README gaps
	if (input.readmeScore !== null && input.readmeScore < 60) {
		const gapScore = Math.round((60 - input.readmeScore) * 0.3);
		totalScore += gapScore;

		const missingItems = input.readmeSuggestions ?? [];
		items.push({
			type: 'readme_gap',
			severity: input.readmeScore < 40 ? 'medium' : 'low',
			title: `README needs improvement (score: ${input.readmeScore}/100)`,
			description: missingItems.length > 0
				? `Missing: ${missingItems.slice(0, 3).join(', ')}.`
				: 'Your README could be stronger with better structure and content.',
			action: missingItems.length > 0
				? `Add ${missingItems.slice(0, 2).join(' and ')} to boost your README score.`
				: 'Review and improve your README to increase visitor conversion.',
			name: 'readme'
		});
	}

	// Determine tier
	let tier: RiskTier;
	if (totalScore >= 60) tier = 'critical';
	else if (totalScore >= 35) tier = 'high';
	else if (totalScore >= 15) tier = 'moderate';
	else if (totalScore > 0) tier = 'low';
	else tier = 'clean';

	// Sort items by severity
	const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
	items.sort((a, b) => (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0));

	const topRisk = items[0] ?? null;

	// Narrative
	let narrative: string;
	if (tier === 'clean') {
		narrative = 'No significant risks detected. Your repo is in good shape.';
	} else if (tier === 'low') {
		narrative = `Minor items to address — ${items.length} low-priority suggestion${items.length > 1 ? 's' : ''}. Nice to have improvements.`;
	} else if (tier === 'moderate') {
		narrative = `A few things to schedule — ${items.length} item${items.length > 1 ? 's' : ''} to handle this week. Nothing urgent.`;
	} else if (tier === 'high') {
		narrative = `Act today — ${topRisk ? topRisk.title.toLowerCase() : 'a significant risk needs attention'}. ${items.length - 1} additional item${items.length > 2 ? 's' : ''} to follow up on.`;
	} else {
		narrative = `🔴 Critical risk — ${topRisk ? topRisk.action : 'Fix immediately'}. ${items.length - 1} more item${items.length > 2 ? 's' : ''} to review after.`;
	}

	return {
		score: Math.min(totalScore, 100),
		tier,
		topRisk,
		items,
		narrative
	};
}

// ── Conversion Funnel Composite ──────────────────────────────────────────────
// Views → Stars → Clones → Contributors with conversion rates + Momentum Vector

export type FunnelStage = {
	label: string;
	value: number;
	subLabel: string;
	conversionRate: number | null; // % from previous stage, null for first stage
	conversionLabel: string;
	sentiment: 'excellent' | 'good' | 'weak' | 'none';
};

export type MomentumVector = 'accelerating' | 'coasting' | 'stalling';

export type ConversionFunnelReport = {
	stages: [FunnelStage, FunnelStage, FunnelStage, FunnelStage];
	momentumVector: MomentumVector;
	momentumReason: string;
	externalReach: ExternalReachScore | null;
	riskStack: RiskStack | null;
	oneThing: string;
	hasData: boolean;
};

function computeFunnelStages(input: {
	views: number;
	uniqueVisitors: number;
	starsLast7d: number;
	clones: number;
	uniqueCloners: number;
	contributors14d: number;
}): [FunnelStage, FunnelStage, FunnelStage, FunnelStage] {
	const { views, uniqueVisitors, starsLast7d, clones, uniqueCloners, contributors14d } = input;

	const stage1: FunnelStage = {
		label: 'Views',
		value: views,
		subLabel: `${uniqueVisitors} unique visitors`,
		conversionRate: null,
		conversionLabel: 'Traffic in',
		sentiment: views > 100 ? 'excellent' : views > 20 ? 'good' : views > 0 ? 'weak' : 'none'
	};

	const viewsToStarsRate = views > 0 ? (starsLast7d / views) * 100 : null;
	const stage2: FunnelStage = {
		label: 'Stars',
		value: starsLast7d,
		subLabel: 'this week',
		conversionRate: viewsToStarsRate,
		conversionLabel:
			viewsToStarsRate !== null
				? viewsToStarsRate >= 5
					? 'Exceptional'
					: viewsToStarsRate >= 2
						? 'Healthy'
						: viewsToStarsRate >= 0.5
							? 'Below avg'
							: 'Very low'
				: '—',
		sentiment:
			viewsToStarsRate === null
				? 'none'
				: viewsToStarsRate >= 5
					? 'excellent'
					: viewsToStarsRate >= 2
						? 'good'
						: 'weak'
	};

	const baseline = starsLast7d > 0 ? starsLast7d : uniqueVisitors;
	const starsToCloneRate = baseline > 0 ? (uniqueCloners / baseline) * 100 : null;
	const stage3: FunnelStage = {
		label: 'Clones',
		value: clones,
		subLabel: `${uniqueCloners} unique cloners`,
		conversionRate: starsToCloneRate,
		conversionLabel:
			starsToCloneRate !== null
				? starsToCloneRate >= 50
					? 'Developer-grade'
					: starsToCloneRate >= 20
						? 'Strong interest'
						: starsToCloneRate >= 5
							? 'Some adoption'
							: 'Low intent'
				: '—',
		sentiment:
			starsToCloneRate === null
				? 'none'
				: starsToCloneRate >= 50
					? 'excellent'
					: starsToCloneRate >= 20
						? 'good'
						: 'weak'
	};

	const clonerToContribRate =
		uniqueCloners > 0 ? (contributors14d / uniqueCloners) * 100 : null;
	const stage4: FunnelStage = {
		label: 'Contributors',
		value: contributors14d,
		subLabel: 'last 14 days',
		conversionRate: clonerToContribRate,
		conversionLabel:
			clonerToContribRate !== null
				? clonerToContribRate >= 40
					? 'Elite activation'
					: clonerToContribRate >= 15
						? 'Good activation'
						: clonerToContribRate >= 5
							? 'Moderate'
							: 'Low activation'
				: contributors14d > 0
					? `${contributors14d} active`
					: '—',
		sentiment:
			contributors14d === 0
				? 'none'
				: clonerToContribRate === null
					? 'good'
					: clonerToContribRate >= 40
						? 'excellent'
						: clonerToContribRate >= 15
							? 'good'
							: 'weak'
	};

	return [stage1, stage2, stage3, stage4];
}

function computeMomentumVector(input: {
	scoreTrend: 'up' | 'down' | 'stable';
	starsLast7d: number;
	prevStarsLast7d: number | null;
	commitGapHours: number;
}): { vector: MomentumVector; reason: string } {
	const { scoreTrend, starsLast7d, prevStarsLast7d, commitGapHours } = input;
	const starAccelerating =
		prevStarsLast7d !== null && prevStarsLast7d >= 0 && starsLast7d > prevStarsLast7d;
	const commitFresh = commitGapHours <= 48;

	if (scoreTrend === 'up' && starAccelerating && commitFresh) {
		return { vector: 'accelerating', reason: 'Score improving, stars growing, commits fresh' };
	}
	if (scoreTrend === 'down' || commitGapHours > 168) {
		return {
			vector: 'stalling',
			reason:
				scoreTrend === 'down'
					? 'Health score is declining'
					: 'No commits in the last 7 days'
		};
	}
	if (starAccelerating || scoreTrend === 'up') {
		return { vector: 'accelerating', reason: 'Stars growing or score on the rise' };
	}
	return { vector: 'coasting', reason: 'Steady but not growing — needs a catalyst' };
}

function computeFunnelOneThing(
	stages: [FunnelStage, FunnelStage, FunnelStage, FunnelStage],
	vector: MomentumVector
): string {
	const [viewsStage, starsStage, clonesStage, contributorsStage] = stages;

	if (viewsStage.value > 50 && (starsStage.conversionRate ?? 0) < 1) {
		return "🔴 Visitors aren't converting to stars. Fix your README — add a one-liner value prop, demo GIF, and a \"⭐ Star if useful\" CTA.";
	}
	if (starsStage.value > 5 && clonesStage.value === 0) {
		return '📦 Stars but no clones — people are curious but not trying it. Add a 30-second quick-start section to your README.';
	}
	if (clonesStage.value > 0 && contributorsStage.value === 0) {
		return '👥 Developers are cloning but not contributing. Add a CONTRIBUTING.md with a clear "first issue" label.';
	}
	if (vector === 'stalling') {
		return '⚠️ Momentum is stalling. Push one commit or reply to an open issue today to keep the signals alive.';
	}
	if (vector === 'accelerating') {
		return '🚀 Everything is pointing up. Find the traffic source driving this and double down there.';
	}
	return '✅ Funnel looks healthy. Focus on growing top-of-funnel traffic to amplify the results.';
}

export const getConversionFunnel = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args): Promise<ConversionFunnelReport | null> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const snapshots = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.take(2);

		const latest = snapshots[0] ?? null;
		const previous = snapshots[1] ?? null;

		const latestScore = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		const hasData = latest !== null && (latest.views ?? 0) > 0;

		const views = latest?.views ?? 0;
		const uniqueVisitors = latest?.uniqueVisitors ?? 0;
		const starsLast7d = latest?.starsLast7d ?? 0;
		const clones = latest?.clones ?? 0;
		const uniqueCloners = latest?.uniqueCloners ?? 0;
		const contributors14d = latest?.contributors14d ?? 0;
		const commitGapHours = latest?.commitGapHours ?? 999;
		const prevStarsLast7d = previous?.starsLast7d ?? null;
		const scoreTrend = latestScore?.trend ?? 'stable';

		const stages = computeFunnelStages({
			views,
			uniqueVisitors,
			starsLast7d,
			clones,
			uniqueCloners,
			contributors14d
		});

		const { vector, reason } = computeMomentumVector({
			scoreTrend,
			starsLast7d,
			prevStarsLast7d,
			commitGapHours
		});

		const oneThing = computeFunnelOneThing(stages, vector);

		// External Reach Score
		let externalReach: ExternalReachScore | null = null;
		if (hasData) {
			const latestReferrers = await ctx.db
				.query('repoReferrers')
				.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first();

			const referrerHistory = await ctx.db
				.query('repoReferrers')
				.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.take(2);
			const previousReferrers = referrerHistory[1] ?? null;

			const sources = analyzeSources(
				(latestReferrers?.referrers ?? []).map((r) => ({
					referrer: r.referrer,
					count: r.count,
					uniques: r.uniques
				})),
				previousReferrers?.referrers ?? null,
				starsLast7d
			);

			const velocity = analyzeVelocity(views, previous?.views ?? null);
			const conversion = analyzeConversion(
				views,
				starsLast7d,
				previous?.views ?? null,
				prevStarsLast7d
			);

			externalReach = computeExternalReachScore({
				topSources: sources,
				trafficVelocity: velocity,
				conversion
			});
		}

		// Risk Stack (always computed, even without traffic data)
		const [dependencies, anomalies, scoreForReadme] = await Promise.all([
			ctx.db
				.query('repoDependencies')
				.withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
				.collect(),
			ctx.db
				.query('repoAnomalies')
				.withIndex('by_repoId_isActive', (q) => q.eq('repoId', args.repoId).eq('isActive', true))
				.collect(),
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first()
		]);

		// Get README score from latest snapshot
		const readmeScore = latest?.readmeScore ?? null;
		const readmeSuggestions = latest?.readmeSuggestions ?? [];

		const riskStack = computeRiskStack({
			dependencies: dependencies.map((d) => ({
				name: d.name,
				hasVulnerability: d.hasVulnerability,
				vulnerabilitySeverity: d.vulnerabilitySeverity,
				vulnerabilitySummary: d.vulnerabilitySummary,
				isDeprecated: d.isDeprecated,
				deprecationMessage: d.deprecationMessage,
				outdatedType: d.outdatedType,
				latestVersion: d.latestVersion,
				currentVersion: d.currentVersion
			})),
			anomalies: anomalies.map((a) => ({
				kind: a.kind,
				severity: a.severity,
				title: a.title,
				description: a.description,
				recommendedAction: a.recommendedAction
			})),
			readmeScore,
			readmeSuggestions
		});

		return {
			stages,
			momentumVector: vector,
			momentumReason: reason,
			externalReach,
			riskStack,
			oneThing,
			hasData
		};
	}
});
