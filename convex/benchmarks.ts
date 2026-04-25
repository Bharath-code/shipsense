import { internalAction, query, mutation, internalQuery, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { internal } from './_generated/api';

// ── Types ────────────────────────────────────────────────────────────────────

export type RepoBenchmark = {
	healthScore: number;
	percentile: number;
	cohortLabel: string;
	cohortSize: number;
	tier: 'elite' | 'strong' | 'average' | 'developing';
	tierLabel: string;
	narrative: string;
	usedStaticFallback: boolean;
};

export type CohortBreakdown = {
	cohortLabel: string;
	language: string;
	starRange: string;
	repoCount: number;
	updatedAt: number;
	overall: {
		score: number;
		percentile: number;
		p25: number;
		p50: number;
		p75: number;
		p90: number;
	};
	components: Array<{
		name: string;
		score: number;
		percentile: number;
		p25: number;
		p50: number;
		p75: number;
		p90: number;
	}>;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function starRange(stars: number): string {
	if (stars < 50) return '0-50';
	if (stars < 200) return '50-200';
	if (stars < 500) return '200-500';
	if (stars < 1000) return '500-1000';
	if (stars < 5000) return '1000-5000';
	return '5000+';
}

function starRangeLabel(stars: number): string {
	if (stars < 50) return 'repos with < 50 stars';
	if (stars < 200) return 'repos with 50–200 stars';
	if (stars < 500) return 'repos with 200–500 stars';
	if (stars < 1000) return 'repos with 500–1k stars';
	if (stars < 5000) return 'repos with 1k–5k stars';
	return 'repos with 5k+ stars';
}

function cohortKey(language: string, stars: number): string {
	return `${language.toLowerCase() || 'unknown'}|${starRange(stars)}`;
}

function percentile(sorted: number[], idx: number): number {
	if (sorted.length === 0) return 0;
	const pos = (idx / 100) * (sorted.length - 1);
	const lower = Math.floor(pos);
	const upper = Math.ceil(pos);
	const weight = pos - lower;
	if (upper >= sorted.length) return sorted[sorted.length - 1];
	return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function staticPercentile(score: number): number {
	if (score >= 85) return 95;
	if (score >= 80) return 88;
	if (score >= 75) return 80;
	if (score >= 70) return 72;
	if (score >= 65) return 63;
	if (score >= 60) return 54;
	if (score >= 55) return 45;
	if (score >= 50) return 37;
	if (score >= 45) return 28;
	if (score >= 40) return 20;
	if (score >= 30) return 12;
	return 5;
}

function estimatePercentile(value: number, p25: number, p50: number, p75: number, p90: number): number {
	if (value <= p25) {
		if (p25 <= 0) return 0;
		return Math.round(25 * (value / p25));
	}
	if (value <= p50) {
		if (p50 <= p25) return 25;
		return 25 + Math.round(25 * ((value - p25) / (p50 - p25)));
	}
	if (value <= p75) {
		if (p75 <= p50) return 50;
		return 50 + Math.round(25 * ((value - p50) / (p75 - p50)));
	}
	if (value <= p90) {
		if (p90 <= p75) return 75;
		return 75 + Math.round(15 * ((value - p75) / (p90 - p75)));
	}
	// Above p90 — extrapolate cautiously, cap at 99
	const extrap = Math.round(10 * ((value - p90) / Math.max(1, p90 - p75)));
	return Math.min(99, 90 + extrap);
}

function tierFromPercentile(percentile: number): { tier: RepoBenchmark['tier']; tierLabel: string } {
	if (percentile >= 85) return { tier: 'elite', tierLabel: 'Elite' };
	if (percentile >= 65) return { tier: 'strong', tierLabel: 'Strong' };
	if (percentile >= 35) return { tier: 'average', tierLabel: 'Average' };
	return { tier: 'developing', tierLabel: 'Developing' };
}

// ── Daily Cohort Aggregation ─────────────────────────────────────────────────

export const computeCohortBenchmarks = internalAction({
	args: {},
	handler: async (ctx): Promise<{ cohortsUpdated: number }> => {
		// 1. Collect all active repos with their latest scores
		const repos = await ctx.runQuery((internal as any).benchmarks.listActiveReposWithScores);

		// 2. Group by cohort
		const cohortMap = new Map<
			string,
			{
				language: string;
				starRange: string;
				healthScores: number[];
				starScores: number[];
				commitScores: number[];
				issueScores: number[];
				prScores: number[];
				contributorScores: number[];
			}
		>();

		for (const repo of repos) {
			const lang = (repo.language || 'Unknown').toLowerCase();
			const stars = repo.stars ?? 0;
			const key = cohortKey(lang, stars);

			if (!cohortMap.has(key)) {
				cohortMap.set(key, {
					language: lang,
					starRange: starRange(stars),
					healthScores: [],
					starScores: [],
					commitScores: [],
					issueScores: [],
					prScores: [],
					contributorScores: []
				});
			}

			const c = cohortMap.get(key)!;
			c.healthScores.push(repo.healthScore);
			c.starScores.push(repo.starScore);
			c.commitScores.push(repo.commitScore);
			c.issueScores.push(repo.issueScore);
			c.prScores.push(repo.prScore);
			c.contributorScores.push(repo.contributorScore);
		}

		// 3. Compute percentiles and upsert
		let cohortsUpdated = 0;
		const now = Date.now();

		for (const [key, data] of cohortMap.entries()) {
			if (data.healthScores.length < 3) continue; // Need at least 3 repos for meaningful stats

			const sort = (arr: number[]) => arr.slice().sort((a, b) => a - b);

			const h = sort(data.healthScores);
			const s = sort(data.starScores);
			const co = sort(data.commitScores);
			const i = sort(data.issueScores);
			const p = sort(data.prScores);
			const cn = sort(data.contributorScores);

			// Upsert: check if benchmark exists
			const existing = await ctx.runQuery((internal as any).benchmarks.getBenchmarkByCohortKey, {
				cohortKey: key
			});

			const benchmarkData = {
				cohortKey: key,
				language: data.language,
				starRange: data.starRange,
				repoCount: data.healthScores.length,
				healthP25: percentile(h, 25),
				healthP50: percentile(h, 50),
				healthP75: percentile(h, 75),
				healthP90: percentile(h, 90),
				starP25: percentile(s, 25),
				starP50: percentile(s, 50),
				starP75: percentile(s, 75),
				starP90: percentile(s, 90),
				commitP25: percentile(co, 25),
				commitP50: percentile(co, 50),
				commitP75: percentile(co, 75),
				commitP90: percentile(co, 90),
				issueP25: percentile(i, 25),
				issueP50: percentile(i, 50),
				issueP75: percentile(i, 75),
				issueP90: percentile(i, 90),
				prP25: percentile(p, 25),
				prP50: percentile(p, 50),
				prP75: percentile(p, 75),
				prP90: percentile(p, 90),
				contributorP25: percentile(cn, 25),
				contributorP50: percentile(cn, 50),
				contributorP75: percentile(cn, 75),
				contributorP90: percentile(cn, 90),
				updatedAt: now
			};

			if (existing) {
				await ctx.runMutation((internal as any).benchmarks.updateBenchmark, {
					id: existing._id,
					...benchmarkData
				});
			} else {
				await ctx.runMutation((internal as any).benchmarks.insertBenchmark, benchmarkData);
			}

			cohortsUpdated++;
		}

		return { cohortsUpdated };
	}
});

// ── Internal helpers for aggregation ─────────────────────────────────────────

export const listActiveReposWithScores = internalQuery({
	args: {},
	handler: async (ctx) => {
		const repos = await ctx.db
			.query('repos')
			.filter((q) => q.eq(q.field('isActive'), true))
			.collect();

		const results: Array<{
			repoId: string;
			language: string | null;
			stars: number;
			healthScore: number;
			starScore: number;
			commitScore: number;
			issueScore: number;
			prScore: number;
			contributorScore: number;
		}> = [];

		for (const repo of repos) {
			// Skip repos whose owners opted out of benchmarking
			const profile = await ctx.db
				.query('userProfiles')
				.withIndex('by_userId', (q) => q.eq('userId', repo.userId))
				.first();
			if (profile?.benchmarkOptOut) continue;

			const score = await ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repo._id))
				.order('desc')
				.first();

			const snapshot = await ctx.db
				.query('repoSnapshots')
				.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repo._id))
				.order('desc')
				.first();

			if (!score) continue;

			results.push({
				repoId: repo._id,
				language: repo.language ?? null,
				stars: snapshot?.stars ?? repo.starsCount,
				healthScore: score.healthScore,
				starScore: score.starScore,
				commitScore: score.commitScore,
				issueScore: score.issueScore,
				prScore: score.prScore,
				contributorScore: score.contributorScore
			});
		}

		return results;
	}
});

export const getBenchmarkByCohortKey = internalQuery({
	args: { cohortKey: v.string() },
	handler: async (ctx, { cohortKey }) => {
		return await ctx.db
			.query('repoBenchmarks')
			.withIndex('by_cohortKey', (q) => q.eq('cohortKey', cohortKey))
			.first();
	}
});

export const insertBenchmark = internalMutation({
	args: {
		cohortKey: v.string(),
		language: v.string(),
		starRange: v.string(),
		repoCount: v.number(),
		healthP25: v.number(),
		healthP50: v.number(),
		healthP75: v.number(),
		healthP90: v.number(),
		starP25: v.number(),
		starP50: v.number(),
		starP75: v.number(),
		starP90: v.number(),
		commitP25: v.number(),
		commitP50: v.number(),
		commitP75: v.number(),
		commitP90: v.number(),
		issueP25: v.number(),
		issueP50: v.number(),
		issueP75: v.number(),
		issueP90: v.number(),
		prP25: v.number(),
		prP50: v.number(),
		prP75: v.number(),
		prP90: v.number(),
		contributorP25: v.number(),
		contributorP50: v.number(),
		contributorP75: v.number(),
		contributorP90: v.number(),
		updatedAt: v.number()
	},
	handler: async (ctx, args) => {
		await ctx.db.insert('repoBenchmarks', args);
	}
});

export const updateBenchmark = internalMutation({
	args: {
		id: v.id('repoBenchmarks'),
		cohortKey: v.string(),
		language: v.string(),
		starRange: v.string(),
		repoCount: v.number(),
		healthP25: v.number(),
		healthP50: v.number(),
		healthP75: v.number(),
		healthP90: v.number(),
		starP25: v.number(),
		starP50: v.number(),
		starP75: v.number(),
		starP90: v.number(),
		commitP25: v.number(),
		commitP50: v.number(),
		commitP75: v.number(),
		commitP90: v.number(),
		issueP25: v.number(),
		issueP50: v.number(),
		issueP75: v.number(),
		issueP90: v.number(),
		prP25: v.number(),
		prP50: v.number(),
		prP75: v.number(),
		prP90: v.number(),
		contributorP25: v.number(),
		contributorP50: v.number(),
		contributorP75: v.number(),
		contributorP90: v.number(),
		updatedAt: v.number()
	},
	handler: async (ctx, args) => {
		const { id, ...data } = args;
		await ctx.db.patch(id, data);
	}
});

// ── Public Queries ───────────────────────────────────────────────────────────

export const getRepoBenchmark = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args): Promise<RepoBenchmark | null> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const myScore = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		if (!myScore) return null;

		const mySnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		const myStars = mySnapshot?.stars ?? repo.starsCount;
		const healthScore = myScore.healthScore;

		// 0-star repos have no meaningful cohort
		if (myStars === 0) {
			return {
				healthScore,
				percentile: 0,
				cohortLabel: 'getting started',
				cohortSize: 0,
				tier: 'developing',
				tierLabel: 'Getting Started',
				narrative: 'No stars yet — focus on distribution and making your repo discoverable.',
				usedStaticFallback: true
			};
		}

		const lang = (repo.language || 'Unknown').toLowerCase();
		const key = cohortKey(lang, myStars);
		const benchmark = await ctx.db
			.query('repoBenchmarks')
			.withIndex('by_cohortKey', (q) => q.eq('cohortKey', key))
			.first();

		const cohortLabel = starRangeLabel(myStars);
		let percentile: number;
		let cohortSize: number;
		let usedStaticFallback: boolean;

		if (benchmark && benchmark.repoCount >= 5) {
			percentile = estimatePercentile(
				healthScore,
				benchmark.healthP25,
				benchmark.healthP50,
				benchmark.healthP75,
				benchmark.healthP90
			);
			cohortSize = benchmark.repoCount;
			usedStaticFallback = false;
		} else {
			// Fall back to static percentile + network-wide cohort label
			percentile = staticPercentile(healthScore);
			cohortSize = 0;
			usedStaticFallback = true;
		}

		const { tier, tierLabel } = tierFromPercentile(percentile);

		const cohortStr = usedStaticFallback ? 'similar repos' : `${lang} ${cohortLabel}`;
		let narrative: string;
		if (tier === 'elite') {
			narrative = `Your repo is in the top ${100 - percentile}% of ${cohortStr}. You're maintaining a best-in-class repo — keep it up.`;
		} else if (tier === 'strong') {
			narrative = `You're outperforming ${percentile}% of ${cohortStr}. A few targeted improvements could push you into elite territory.`;
		} else if (tier === 'average') {
			narrative = `You're at the ${percentile}th percentile of ${cohortStr}. Focus on your top task to move the score meaningfully.`;
		} else {
			narrative = `Your score is below ${100 - percentile}% of ${cohortStr}. Address the top-priority tasks to build momentum fast.`;
		}

		return {
			healthScore,
			percentile,
			cohortLabel: usedStaticFallback ? 'open-source repos' : cohortLabel,
			cohortSize,
			tier,
			tierLabel,
			narrative,
			usedStaticFallback
		};
	}
});

export const getCohortBreakdown = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args): Promise<CohortBreakdown | null> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const myScore = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		if (!myScore) return null;

		const mySnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		const myStars = mySnapshot?.stars ?? repo.starsCount;
		const lang = (repo.language || 'Unknown').toLowerCase();
		const key = cohortKey(lang, myStars);

		const benchmark = await ctx.db
			.query('repoBenchmarks')
			.withIndex('by_cohortKey', (q) => q.eq('cohortKey', key))
			.first();

		if (!benchmark) return null;

		const overallPercentile = estimatePercentile(
			myScore.healthScore,
			benchmark.healthP25,
			benchmark.healthP50,
			benchmark.healthP75,
			benchmark.healthP90
		);

		const components = [
			{
				name: 'Stars',
				score: myScore.starScore,
				percentile: estimatePercentile(myScore.starScore, benchmark.starP25, benchmark.starP50, benchmark.starP75, benchmark.starP90),
				p25: benchmark.starP25,
				p50: benchmark.starP50,
				p75: benchmark.starP75,
				p90: benchmark.starP90
			},
			{
				name: 'Commits',
				score: myScore.commitScore,
				percentile: estimatePercentile(myScore.commitScore, benchmark.commitP25, benchmark.commitP50, benchmark.commitP75, benchmark.commitP90),
				p25: benchmark.commitP25,
				p50: benchmark.commitP50,
				p75: benchmark.commitP75,
				p90: benchmark.commitP90
			},
			{
				name: 'Issues',
				score: myScore.issueScore,
				percentile: estimatePercentile(myScore.issueScore, benchmark.issueP25, benchmark.issueP50, benchmark.issueP75, benchmark.issueP90),
				p25: benchmark.issueP25,
				p50: benchmark.issueP50,
				p75: benchmark.issueP75,
				p90: benchmark.issueP90
			},
			{
				name: 'PRs',
				score: myScore.prScore,
				percentile: estimatePercentile(myScore.prScore, benchmark.prP25, benchmark.prP50, benchmark.prP75, benchmark.prP90),
				p25: benchmark.prP25,
				p50: benchmark.prP50,
				p75: benchmark.prP75,
				p90: benchmark.prP90
			},
			{
				name: 'Contributors',
				score: myScore.contributorScore,
				percentile: estimatePercentile(myScore.contributorScore, benchmark.contributorP25, benchmark.contributorP50, benchmark.contributorP75, benchmark.contributorP90),
				p25: benchmark.contributorP25,
				p50: benchmark.contributorP50,
				p75: benchmark.contributorP75,
				p90: benchmark.contributorP90
			}
		];

		return {
			cohortLabel: `${lang} ${starRangeLabel(myStars)}`,
			language: lang,
			starRange: starRange(myStars),
			repoCount: benchmark.repoCount,
			updatedAt: benchmark.updatedAt,
			overall: {
				score: myScore.healthScore,
				percentile: overallPercentile,
				p25: benchmark.healthP25,
				p50: benchmark.healthP50,
				p75: benchmark.healthP75,
				p90: benchmark.healthP90
			},
			components
		};
	}
});

// ── Privacy Controls ─────────────────────────────────────────────────────────

export const updateBenchmarkOptOut = mutation({
	args: { optOut: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (!profile) throw new Error('Profile not found');

		await ctx.db.patch(profile._id, {
			benchmarkOptOut: args.optOut
		});

		return { benchmarkOptOut: args.optOut };
	}
});

export const getBenchmarkOptOut = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return false;

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		return profile?.benchmarkOptOut ?? false;
	}
});
