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
