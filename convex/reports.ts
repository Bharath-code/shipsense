import { query, mutation, action } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

export type InvestorReportData = {
	repoName: string;
	owner: string;
	healthScore: number;
	scoreTrend: 'up' | 'down' | 'stable';
	starsGrowth: number;
	starVelocity: string;
	topWins: Array<{ title: string; description: string }>;
	milestones: Array<{ date: string; event: string }>;
	percentile: number;
	generatedAt: number;
};

/**
 * Aggregates all necessary data for an investor-ready report.
 * This gathers a comprehensive snapshot of the project's momentum.
 */
export const aggregateReportData = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return null;

		const [latestSnapshot, latestScore, scoreHistory, anomalies] = await Promise.all([
			ctx.db
				.query('repoSnapshots')
				.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first(),
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.first(),
			ctx.db
				.query('repoScores')
				.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
				.order('desc')
				.take(30),
			ctx.db
				.query('repoAnomalies')
				.withIndex('by_repoId_isActive', (q) => q.eq('repoId', args.repoId).eq('isActive', true))
				.collect()
		]);

		if (!latestSnapshot || !latestScore) return null;

		// Compute "Top Wins" from positive anomalies and milestones
		const topWins = anomalies
			.filter(a => a.severity === 'low' || a.severity === 'medium') // Focus on positive/neutral signals
			.slice(0, 3)
			.map(a => ({
				title: a.title,
				description: a.description
			}));

		// Create a simple milestone timeline from score spikes
		const milestones = scoreHistory
			.filter((s, i) => i > 0 && s.healthScore > (scoreHistory[i-1]?.healthScore ?? 0) + 5)
			.slice(0, 5)
			.map(s => ({
				date: new Date(s.calculatedAt).toLocaleDateString(),
				event: `Health Score Spike to ${s.healthScore}`
			}))
			.reverse();

		return {
			repoName: repo.name,
			owner: repo.owner,
			healthScore: latestScore.healthScore,
			scoreTrend: latestScore.trend,
			starsGrowth: latestSnapshot.starsLast7d,
			starVelocity: `${latestSnapshot.starsLast7d} stars/week`,
			topWins,
			milestones,
			percentile: 75, // Placeholder: would be calculated via repoBenchmarks
			generatedAt: Date.now()
		};
	}
});

/**
 * Generates a high-fidelity report URL.
 * In a production environment, this would use a PDF generation service (e.g., Puppeteer/Browserless).
 * For MVP, we generate a dedicated public report page and provide the URL.
 */
export const generateReportUrl = mutation({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Unauthorized');

		const repo = await ctx.db.get(args.repoId);
		if (!repo) throw new Error('Repo not found');

		// Generate a unique report token or use the repo slug
		const reportSlug = `report-${repo.slug || Math.random().toString(36).substring(7)}`;

		// In a real app, we'd store this report metadata in a 'reports' table
		return {
			url: `https://shipsense.app/report/${reportSlug}`,
			expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24h expiry
		};
	}
});
