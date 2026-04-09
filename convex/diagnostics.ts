import { query } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

/**
 * Diagnostic endpoint to debug funnel data issues.
 * Returns raw snapshot data and computed funnel values.
 */
export const diagnoseFunnelData = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return { error: 'Unauthenticated' };

		const repo = await ctx.db.get(args.repoId);
		if (!repo || repo.userId !== userId) return { error: 'Unauthorized' };

		// Get last 3 snapshots
		const snapshots = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.take(3);

		if (snapshots.length === 0) {
			return {
				repo: { owner: repo.owner, name: repo.name, fullName: repo.fullName },
				message: 'No snapshots found. Click "Sync Now" to collect data.',
				snapshots: [],
				weeklyFunnel: null,
				cumulativeFunnel: null
			};
		}

		const latest = snapshots[0];
		const previous = snapshots[1] ?? null;

		// Get referrer data for additional context
		const latestReferrers = await ctx.db
			.query('repoReferrers')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first();

		// Compute weekly funnel manually
		const viewsThisPeriod = previous
			? Math.max(0, (latest.views ?? 0) - (previous.views ?? 0))
			: latest.views ?? 0;
		const starsThisPeriod = latest.starsLast7d;
		const clonesThisPeriod = previous
			? Math.max(0, (latest.clones ?? 0) - (previous.clones ?? 0))
			: latest.clones ?? 0;
		const contributorsThisPeriod = latest.contributors14d;

		// Compute cumulative funnel
		const totalContributors = latest.totalContributors ?? latest.contributors14d;

		return {
			repo: { owner: repo.owner, name: repo.name, fullName: repo.fullName },
			snapshotCount: snapshots.length,
			latestSnapshot: {
				capturedAt: new Date(latest.capturedAt).toISOString(),
				stars: latest.stars,
				starsLast7d: latest.starsLast7d,
				views: latest.views,
				uniqueVisitors: latest.uniqueVisitors,
				clones: latest.clones,
				uniqueCloners: latest.uniqueCloners,
				contributors14d: latest.contributors14d,
				totalContributors: latest.totalContributors,
				commitGapHours: latest.commitGapHours,
				prsMerged7d: latest.prsMerged7d
			},
			repoCumulativeTraffic: {
				cumulativeViews: repo.cumulativeViews ?? 'Not set yet (will be set after sync)',
				cumulativeClones: repo.cumulativeClones ?? 'Not set yet (will be set after sync)'
			},
			previousSnapshot: previous ? {
				capturedAt: new Date(previous.capturedAt).toISOString(),
				stars: previous.stars,
				starsLast7d: previous.starsLast7d,
				views: previous.views,
				clones: previous.clones,
				uniqueCloners: previous.uniqueCloners,
				contributors14d: previous.contributors14d,
			} : null,
			weeklyFunnel: {
				viewsThisPeriod,
				starsThisPeriod,
				clonesThisPeriod,
				contributorsThisPeriod,
				explanation: previous
					? 'Using deltas between snapshots'
					: 'Using absolute values (first sync)'
			},
			trafficDetails: latestReferrers ? {
				totalViews: latestReferrers.totalViews,
				totalUniques: latestReferrers.totalUniques,
				totalClones: latestReferrers.totalClones,
				totalCloners: latestReferrers.totalCloners,
				topReferrers: latestReferrers.referrers.slice(0, 5).map(r => ({
					source: r.referrer,
					views: r.count,
					uniques: r.uniques
				})),
				hasReferrerData: latestReferrers.referrers.length > 0
			} : null,
			cumulativeFunnel: {
				totalViews: latest.views ?? 0,
				totalStars: latest.stars,
				totalClones: latest.clones ?? 0,
				totalContributors,
				totalContributorsSource: latest.totalContributors !== undefined ? 'totalContributors field' : 'contributors14d (fallback)'
			},
			diagnosis: {
				starsIssue: latest.starsLast7d === 0
					? (latest.stars > 0
						? 'starsLast7d is 0 but repo has stars. Old snapshot from before fix. RE-SYNC NOW.'
						: 'Repo has 0 total stars. starsLast7d=0 is correct.')
					: `starsLast7d=${latest.starsLast7d} looks correct`,
				viewsIssue: (latest.views ?? 0) === 0
					? 'GitHub traffic API returned 0 views. This happens for repos without recent web traffic. API is working but no visitors. Check sync logs for [Traffic] API response status.'
					: `Views=${latest.views} looks correct. Daily data available for review in sync logs.`,
				clonesIssue: (latest.clones ?? 0) === 0
					? 'GitHub traffic API returned 0 clones. Clones tracking starts from first sync. If you have developers cloning, this should populate after 1-2 days.'
					: `Clones=${latest.clones} looks correct.`,
				contributorsIssue: latest.contributors14d === 0
					? 'contributors14d is 0 - no commits from unique authors in last 14 days. Check if latest commit is older than 14 days.'
					: latest.totalContributors !== undefined
						? `contributors14d=${latest.contributors14d}, totalContributors=${latest.totalContributors}. Looks correct.`
						: `contributors14d=${latest.contributors14d}. totalContributors not set yet - RE-SYNC to fix cumulative.`
			},
			recommendation: 'Click "Sync Now" to create a new snapshot with corrected data collection.'
		};
	}
});
