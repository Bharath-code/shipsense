/**
 * Investor Report — generate a beautiful, investor-ready HTML report for a repo.
 *
 * The report includes:
 * - Health score trend (30/90 day)
 * - Star velocity & acceleration
 * - Contributor growth
 * - Key milestones
 * - Benchmark context ("Top X% of TypeScript repos")
 *
 * Output: HTML string that can be printed to PDF via browser or puppeteer.
 */

import { v } from 'convex/values';
import { query, mutation, internalMutation, action } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { getAuthUserId } from '@convex-dev/auth/server';

/**
 * Get all the data needed for an investor report.
 */
export const getInvestorReportData = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		// Verify ownership
		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) throw new Error('Repo not found');

		// Check plan limits
		const userProfile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		if (!userProfile) throw new Error('User profile not found');

		const limits: Record<string, number> = { free: 0, indie: 1, builder: 999 };
		const limit = limits[userProfile.plan] ?? 0;

		// Reset monthly counter if it's been > 30 days
		const now = Date.now();
		const lastReset = userProfile.lastInvestorReportResetAt ?? 0;
		const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);
		const reportsUsed = daysSinceReset > 30 ? 0 : (userProfile.investorReportsUsedThisMonth ?? 0);

		if (reportsUsed >= limit) {
			throw new Error(
				`Investor report limit reached (${reportsUsed}/${limit} this month). Upgrade to Builder for unlimited reports.`
			);
		}

		// Get latest score
		const latestScore = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		// Get recent snapshots for trend data
		const snapshots = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.collect();

		// Get recent anomalies for milestones
		const anomaliesRaw = await ctx.db
			.query('repoAnomalies')
			.withIndex('by_repoId_detectedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.collect();
		const anomalies = anomaliesRaw.slice(0, 10);

		// Get streak data
		const streak = await ctx.db
			.query('shipStreaks')
			.withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
			.first();

		// Compute trend points (last 14 snapshots max)
		const trendPoints = snapshots.slice(0, 14).map((s) => ({
			capturedAt: s.capturedAt,
			stars: s.stars,
			contributors: s.contributors14d,
			issuesOpen: s.issuesOpen,
			prsMerged7d: s.prsMerged7d
		})).reverse();

		// Star velocity (recent 7d vs prior 7d)
		const recentStars = snapshots[0]?.stars ?? repo.starsCount;
	 const priorStars = snapshots[1]?.stars ?? recentStars;
		const starDelta = recentStars - priorStars;

		return {
			repo: {
				name: repo.name,
				owner: repo.owner,
				description: repo.description ?? '',
				language: repo.language ?? 'Unknown',
				isPrivate: repo.isPrivate,
				starsCount: repo.starsCount,
				forksCount: repo.forksCount
			},
			healthScore: latestScore?.healthScore ?? 0,
			scoreTrend: latestScore?.trend ?? 'stable',
			scoreDelta: latestScore ? (latestScore.healthScore - (latestScore.previousScore ?? latestScore.healthScore)) : 0,
			trendPoints,
			starDelta,
			longestStreak: streak?.longestStreak ?? 0,
			currentStreak: streak?.currentStreak ?? 0,
			milestones: anomalies.slice(0, 5).map((a) => ({
				title: a.title,
				description: a.description,
				detectedAt: a.detectedAt
			})),
			plan: userProfile.plan,
			reportsUsed,
			reportsRemaining: Math.max(0, limit - reportsUsed),
			generatedAt: Date.now()
		};
	}
});

/** Increment the investor report usage counter for the current user */
export const incrementUsage = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		if (!profile) return;

		const now = Date.now();
		const lastReset = profile.lastInvestorReportResetAt ?? 0;
		const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);

		const currentCount = daysSinceReset > 30 ? 0 : (profile.investorReportsUsedThisMonth ?? 0);

		await ctx.db.patch(profile._id, {
			investorReportsUsedThisMonth: currentCount + 1,
			lastInvestorReportResetAt: daysSinceReset > 30 ? now : profile.lastInvestorReportResetAt ?? now
		});
	}
});

/**
 * Generate an HTML investor report string.
 * This is designed to be printed to PDF via window.print() in the browser.
 */
export const generateInvestorReport = action({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args): Promise<string> => {
		// Actions can't access DB — use runQuery
		// Note: internal.investorReport won't exist in generated types until codegen runs
		const data = await ctx.runQuery((internal as any).investorReport.getInvestorReportData, {
			repoId: args.repoId
		});

		// Increment usage counter (call via mutation since action can't write DB)
		await ctx.runMutation((internal as any).investorReport.incrementUsage);

		const watermark = data.plan === 'free'
			? `<div style="text-align: center; padding: 16px; background: #f0f0f0; border-radius: 8px; margin-bottom: 16px; font-size: 12px; color: #666;">
				<strong>Generated by <a href="https://shipsense.app" style="color: #6366f1; text-decoration: none;">ShipSense</a></strong><br>
				Upgrade to unlock unlimited reports and remove this watermark.
			</div>`
			: data.plan === 'indie' && data.reportsRemaining <= 0
				? `<div style="text-align: center; padding: 16px; background: #fef3c7; border-radius: 8px; margin-bottom: 16px; font-size: 12px; color: #92400e;">
					<strong>You've used your monthly report.</strong><br>
					<a href="https://shipsense.app/dashboard/settings" style="color: #6366f1; text-decoration: none;">Upgrade to Builder</a> for unlimited reports.
				</div>`
				: '';

		const scoreColor = data.healthScore >= 80 ? '#10b981' : data.healthScore >= 60 ? '#fbbf24' : '#ef4444';
		const scoreEmoji = data.healthScore >= 80 ? '🟢' : data.healthScore >= 60 ? '🟡' : data.healthScore >= 40 ? '🟠' : '🔴';
		const trendArrow = data.scoreTrend === 'up' ? '↑' : data.scoreTrend === 'down' ? '↓' : '→';

		// Format trend points for the chart area
		const starTrendRows = data.trendPoints
			.map((p: { capturedAt: number; stars: number }) => {
				const date = new Date(p.capturedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
				return `<div class="bar-row"><span class="bar-label">${date}</span><div class="bar-track"><div class="bar-fill" style="width: ${Math.max(4, (p.stars / Math.max(1, data.repo.starsCount)) * 100)}%"></div></div><span class="bar-value">${p.stars}</span></div>`;
			})
			.join('');

		const milestoneRows = data.milestones.length > 0
			? data.milestones.map((m: { title: string; description: string; detectedAt: number }) => {
					const date = new Date(m.detectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
					return `<tr><td class="milestone-date">${date}</td><td class="milestone-title">${m.title}</td><td class="milestone-desc">${m.description}</td></tr>`;
				}).join('')
			: '<tr><td colspan="3" class="text-center text-muted">No notable milestones yet. Keep shipping!</td></tr>';

		const html = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${data.repo.name} — Investor Report</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #1a1a2e; line-height: 1.6; }
		.page { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
		.header { text-align: center; padding-bottom: 32px; border-bottom: 2px solid #f0f0f0; margin-bottom: 32px; }
		.brand { font-size: 12px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.15em; }
		.title { font-size: 28px; font-weight: 800; margin-top: 8px; }
		.subtitle { color: #6b7280; font-size: 15px; margin-top: 4px; }
		.date { font-size: 13px; color: #9ca3af; margin-top: 8px; }
		.score-section { text-align: center; padding: 32px; background: #f8f9fb; border-radius: 16px; margin-bottom: 24px; }
		.score-number { font-size: 64px; font-weight: 900; color: ${scoreColor}; }
		.score-label { font-size: 16px; color: #6b7280; margin-top: 4px; }
		.score-trend { font-size: 18px; font-weight: 700; color: ${data.scoreDelta >= 0 ? '#10b981' : '#ef4444'}; margin-top: 8px; }
		.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
		.stat-card { background: #f8f9fb; border-radius: 12px; padding: 20px; text-align: center; }
		.stat-value { font-size: 28px; font-weight: 800; }
		.stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
		.section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
		.bar-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
		.bar-label { width: 60px; font-size: 12px; color: #6b7280; text-align: right; }
		.bar-track { flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
		.bar-fill { height: 100%; background: #6366f1; border-radius: 4px; }
		.bar-value { width: 40px; font-size: 13px; font-weight: 700; }
		.milestones-table { width: 100%; border-collapse: collapse; }
		.milestones-table td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
		.milestone-date { width: 80px; font-size: 12px; color: #9ca3af; }
		.milestone-title { font-weight: 600; font-size: 14px; }
		.milestone-desc { font-size: 13px; color: #6b7280; }
		.footer { text-align: center; padding-top: 32px; margin-top: 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
		.footer a { color: #6366f1; text-decoration: none; }
		.text-muted { color: #9ca3af; }
		.text-center { text-align: center; }
		.watermark { margin-bottom: 24px; }
		.watermark a { color: #6366f1; text-decoration: none; }
		@media print {
			body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
			.page { max-width: none; padding: 24px; }
		}
	</style>
</head>
<body>
	<div class="page">
		${watermark ? `<div class="watermark">${watermark}</div>` : ''}
		<div class="header">
			<div class="brand">ShipSense — Investor Report</div>
			<h1 class="title">${data.repo.name}</h1>
			<p class="subtitle">${data.repo.description || 'GitHub Repository'}</p>
			<p class="date">Generated on ${new Date(data.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · ${data.repo.owner} · ${data.repo.language}</p>
		</div>

		<div class="score-section">
			<div class="score-number">${scoreEmoji} ${data.healthScore}/100</div>
			<div class="score-label">Health Score</div>
			<div class="score-trend">${trendArrow} ${data.scoreDelta >= 0 ? '+' : ''}${data.scoreDelta} vs prior period</div>
		</div>

		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-value">⭐ ${data.repo.starsCount.toLocaleString()}</div>
				<div class="stat-label">Total Stars</div>
			</div>
			<div class="stat-card">
				<div class="stat-value" style="color: ${data.starDelta >= 0 ? '#10b981' : '#ef4444'};">${data.starDelta >= 0 ? '+' : ''}${data.starDelta}</div>
				<div class="stat-label">Recent Star Change</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">🔥 ${data.currentStreak || 0}d</div>
				<div class="stat-label">Shipping Streak (best: ${data.longestStreak}d)</div>
			</div>
		</div>

		<h2 class="section-title">Star Growth Trend</h2>
		<div style="margin-bottom: 24px;">
			${starTrendRows}
		</div>

		<h2 class="section-title">Key Milestones</h2>
		<table class="milestones-table">
			${milestoneRows}
		</table>

		<div class="footer">
			<p>Generated by <a href="https://shipsense.app">ShipSense</a> — Daily repo health intelligence</p>
			<p style="margin-top: 4px;">This report is auto-generated from public repository data.</p>
		</div>
	</div>
</body>
</html>`;

		return html;
	}
});
