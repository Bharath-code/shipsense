import { internalMutation, internalAction, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';

/**
 * Simplified health score calculator.
 * Uses only basic GitHub data (stars, issues, PRs, commit recency) to produce an
 * instant estimate while the full sync runs in the background.
 *
 * Weights are aligned with the full scorer (convex/scorer.ts):
 * - Stars:   35 points
 * - Commits: 25 points
 * - Issues:  20 points
 * - PRs:     10 points
 * - Contributors: 10 points
 *
 * For the estimate, we only have stars + open_issues + a rough commit signal,
 * so we fill in what we can and scale down the unavailable axes.
 */

interface QuickData {
	stars: number;
	openIssues: number;
	pushedAt: string | null;
	updatedAt: string | null;
}

function starScore(stars: number): number {
	if (stars >= 10000) return 35;
	if (stars >= 5000) return 33;
	if (stars >= 1000) return 30;
	if (stars >= 500) return 28;
	if (stars >= 100) return 24;
	if (stars >= 50) return 20;
	if (stars >= 10) return 14;
	if (stars >= 1) return 8;
	return 4; // 0 stars — still get some base for being a created project
}

function issueScore(openIssues: number, stars: number): number {
	// Few open issues = better hygiene. Scale by repo size.
	const ratio = stars > 0 ? openIssues / stars : openIssues;
	if (openIssues === 0) return 20;
	if (ratio <= 0.01) return 18;
	if (ratio <= 0.05) return 15;
	if (ratio <= 0.1) return 12;
	if (ratio <= 0.3) return 8;
	if (ratio <= 0.6) return 5;
	return 2;
}

function commitScore(pushedAt: string | null, updatedAt: string | null): number {
	// Recent push = active maintenance
	const now = Date.now();
	const latest = Math.max(
		pushedAt ? new Date(pushedAt).getTime() : 0,
		updatedAt ? new Date(updatedAt).getTime() : 0
	);

	if (latest === 0) return 0;

	const daysSinceActivity = (now - latest) / (1000 * 60 * 60 * 24);
	if (daysSinceActivity <= 1) return 25;
	if (daysSinceActivity <= 3) return 22;
	if (daysSinceActivity <= 7) return 18;
	if (daysSinceActivity <= 14) return 13;
	if (daysSinceActivity <= 30) return 8;
	return 3;
}

function prScore(_stars: number): number {
	// Full PR data requires deeper analysis. Estimate conservatively.
	return 5;
}

function contributorScore(pushedAt: string | null): number {
	// Contributor data requires deeper analysis. Estimate from push recency.
	if (!pushedAt) return 3;
	const daysSincePush = (Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60 * 24);
	if (daysSincePush <= 7) return 8;
	if (daysSincePush <= 30) return 5;
	return 2;
}

function scoreExplanation(components: Record<string, number>): string {
	const parts = [
		`Stars: ${components.stars}/35`,
		`Commits: ${components.commits}/25`,
		`Issues: ${components.issues}/20`,
		`PRs: ${components.prs}/10`,
		`Contributors: ${components.contribs}/10`
	];
	return `Estimate from quick GitHub scan — ${parts.join(', ')}. Full analysis in progress.`;
}

function estimateTrend(): 'up' | 'down' | 'stable' {
	return 'stable'; // Not enough data for trend on first scan
}

/**
 * Fetch basic GitHub repo data for a quick health estimate.
 * Only uses public GitHub REST API — no auth needed for public repos.
 */
async function fetchQuickGithubData(
	githubAccessToken: string,
	owner: string,
	repo: string
): Promise<QuickData> {
	const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
		headers: {
			Authorization: `Bearer ${githubAccessToken}`,
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'ShipSense'
		}
	});

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json() as Record<string, unknown>;

	return {
		stars: (data.stargazers_count as number) ?? 0,
		openIssues: (data.open_issues_count as number) ?? 0,
		pushedAt: (data.pushed_at as string) ?? null,
		updatedAt: (data.updated_at as string) ?? null
	};
}

/**
 * Public query — gets the latest score for a repo, returning whether it's an estimate.
 * Used by the frontend to show "Calculating..." vs. real score.
 */
export const getLatestEstimatedScore = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const score = await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();

		if (!score) return null;

		return {
			healthScore: score.healthScore,
			isEstimated: score.isEstimated ?? false,
			calculatedAt: score.calculatedAt,
			explanation: score.scoreExplanation
		};
	}
});

/**
 * Internal action — runs a quick scan and inserts an estimated score.
 * Called immediately after repo connection, before the full sync.
 */
export const runQuickScan = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const repo = await ctx.runQuery(internal.repos.getRepoById, { repoId });
		if (!repo) throw new Error('Repo not found');

		// Get the GitHub token
		const profile = await ctx.runQuery(internal.users.getUserProfile, {
			userId: repo.userId
		});
		if (!profile?.githubAccessToken) {
			console.warn(`[quickScan] No GitHub token for user ${repo.userId}, skipping`);
			return null;
		}

		try {
			const data = await fetchQuickGithubData(
				profile.githubAccessToken,
				repo.owner,
				repo.name
			);

			const components = {
				stars: starScore(data.stars),
				commits: commitScore(data.pushedAt, data.updatedAt),
				issues: issueScore(data.openIssues, data.stars),
				prs: prScore(data.stars),
				contribs: contributorScore(data.pushedAt)
			};

			const total = components.stars + components.commits + components.issues +
				components.prs + components.contribs;

			const healthScore = Math.round(total);

			const explanation = scoreExplanation(components);

			await ctx.runMutation(internal.repos.insertEstimatedScore, {
				repoId,
				healthScore,
				starScore: components.stars,
				commitScore: components.commits,
				issueScore: components.issues,
				prScore: components.prs,
				contributorScore: components.contribs,
				scoreExplanation: explanation,
				trend: estimateTrend()
			});

			return {
				healthScore,
				isEstimated: true,
				explanation,
				stars: data.stars,
				openIssues: data.openIssues
			};
		} catch (err) {
			console.error(`[quickScan] Failed for repo ${repoId}:`, err);
			return null;
		}
	}
});
