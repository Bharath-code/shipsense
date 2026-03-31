import { internalAction, internalMutation, internalQuery } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { internal } from './_generated/api';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

type RepoGraphQLResponse = {
	data?: {
		repository?: {
			stargazerCount: number;
			forkCount: number;
			issues: { totalCount: number };
			pullRequests: { totalCount: number };
			mergedPRs?: {
				nodes?: Array<{ updatedAt: string }>;
			};
			defaultBranchRef?: {
				target?: {
					history?: {
						nodes?: Array<{ committedDate: string }>;
					};
				};
			};
		};
	};
};

type CollectorRepo = {
	userId: Id<'users'>;
	owner: string;
	name: string;
	fullName: string;
};

type GithubTokenResult = {
	accessToken: string;
} | null;

const GITHUB_REST_URL = 'https://api.github.com';

async function fetchContributors14d(
	owner: string,
	name: string,
	accessToken: string
): Promise<number> {
	const fourteenDaysAgo = new Date();
	fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
	const since = fourteenDaysAgo.toISOString().split('T')[0];

	try {
		const response = await fetch(
			`${GITHUB_REST_URL}/repos/${owner}/${name}/contributors?since=${since}&per_page=100`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			}
		);

		if (!response.ok) {
			console.warn('Failed to fetch contributors:', response.status);
			return 1;
		}

		const contributors = await response.json();
		return Array.isArray(contributors) ? contributors.length : 1;
	} catch (error) {
		console.warn('Error fetching contributors:', error);
		return 1;
	}
}

async function fetchMedianIssueResponseHours(
	owner: string,
	name: string,
	accessToken: string
): Promise<number> {
	try {
		const response = await fetch(
			`${GITHUB_REST_URL}/repos/${owner}/${name}/issues?state=closed&per_page=50`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			}
		);

		if (!response.ok) {
			console.warn('Failed to fetch issues:', response.status);
			return 24; // default to 1 day
		}

		const issues = await response.json();
		if (!Array.isArray(issues) || issues.length === 0) {
			return 24;
		}

		const responseTimes: number[] = [];
		for (const issue of issues) {
			if (issue.pull_request) continue;
			if (!issue.created_at || !issue.closed_at) continue;

			const created = new Date(issue.created_at).getTime();
			const closed = new Date(issue.closed_at).getTime();
			const hours = (closed - created) / (1000 * 60 * 60);
			if (hours > 0 && hours < 24 * 30) {
				responseTimes.push(hours);
			}
		}

		if (responseTimes.length === 0) {
			return 24;
		}

		responseTimes.sort((a, b) => a - b);
		const mid = Math.floor(responseTimes.length / 2);
		return responseTimes.length % 2 !== 0
			? responseTimes[mid]
			: (responseTimes[mid - 1] + responseTimes[mid]) / 2;
	} catch (error) {
		console.warn('Error fetching issue response times:', error);
		return 24;
	}
}

// Fetch full data for a single repo
export function processMergedPRs(nodes: any[], referenceTimeMs: number): number {
	if (!nodes) return 0;
	const sevenDaysAgo = referenceTimeMs - 7 * 24 * 60 * 60 * 1000;
	return nodes.filter((pr: any) => new Date(pr.updatedAt).getTime() > sevenDaysAgo).length;
}

export function processCommitGap(commits: any[], referenceTimeMs: number): number {
	let commitGapHours = 24 * 30; // default to 30 days if no commits
	if (commits.length > 0) {
		commitGapHours =
			(referenceTimeMs - new Date(commits[0].committedDate).getTime()) / (1000 * 60 * 60);
	}
	return commitGapHours;
}

export function extractLatestCommitDate(commits: Array<{ committedDate: string }>): string | null {
	if (commits.length === 0) return null;

	const latestCommitDate = new Date(commits[0].committedDate);
	if (Number.isNaN(latestCommitDate.getTime())) return null;

	return latestCommitDate.toISOString().slice(0, 10);
}

export const fetchRepoData = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }): Promise<Id<'repoSnapshots'> | null> => {
		console.log('[Collector] Starting fetch for repo:', repoId);

		const repo: CollectorRepo | null = await ctx.runQuery(internal.repos.getRepoById, { repoId });
		if (!repo) {
			console.error('[Collector] Repo not found:', repoId);
			throw new Error('Repo not found');
		}
		console.log('[Collector] Found repo:', repo.fullName);

		const tokens: GithubTokenResult = await ctx.runQuery(internal.users.getGithubToken, {
			userId: repo.userId
		});

		if (!tokens || !tokens.accessToken) {
			console.error('[Collector] No token for user:', repo.userId);
			await ctx.runMutation(internal.collector.markSyncError, {
				repoId,
				error: 'GitHub token not found. Please reconnect your GitHub account.'
			});
			return null;
		}
		console.log('[Collector] Got token for user');

		// Detailed query to get PRs, Issues, and commits
		const query = `
      query($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          stargazerCount
          forkCount
          issues(states: OPEN) { totalCount }
          pullRequests(states: OPEN) { totalCount }
          mergedPRs: pullRequests(states: MERGED, orderBy: {field: UPDATED_AT, direction: DESC}, first: 50) {
            nodes { updatedAt }
          }
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 50) {
                  nodes {
                    committedDate
                  }
                }
              }
            }
          }
        }
      }
    `;

		const response: Response = await fetch(GITHUB_GRAPHQL_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query,
				variables: { owner: repo.owner, name: repo.name }
			})
		});

		console.log('[Collector] GitHub API response status:', response.status);

		if (!response.ok) {
			console.error(
				`[Collector] Failed to fetch repo data for ${repo.fullName}: ${response.status}`
			);
			await ctx.runMutation(internal.collector.markSyncError, {
				repoId,
				error: `GitHub API error: ${response.status}`
			});
			return null;
		}

		const json: RepoGraphQLResponse = await response.json();
		console.log('[Collector] GraphQL response:', JSON.stringify(json, null, 2));

		const data = json.data?.repository;
		//console.log('[Collector] Repository data:', data);

		if (!data) {
			console.error('[Collector] No data in response');
			await ctx.runMutation(internal.collector.markSyncError, {
				repoId,
				error: 'Repository not found or access denied'
			});
			return null;
		}

		const now = Date.now();
		const observedDate = new Date(now).toISOString().slice(0, 10);
		const prsMerged7d = processMergedPRs(data.mergedPRs?.nodes || [], now);
		const commits = data.defaultBranchRef?.target?.history?.nodes || [];
		const commitGapHours = processCommitGap(commits, now);
		const latestCommitDate = extractLatestCommitDate(commits);

		// Calculate starsLast7d from snapshot history
		const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
		const oldSnapshot = await ctx.runQuery(internal.collector.getSnapshotAroundTime, {
			repoId,
			targetTime: sevenDaysAgo
		});

		const currentStars = data.stargazerCount;
		console.log('[Collector] Current stars:', currentStars);
		console.log('[Collector] Old snapshot for starsLast7d:', oldSnapshot);

		const starsLast7d = oldSnapshot ? Math.max(0, currentStars - oldSnapshot.stars) : 0;
		console.log('[Collector] Stars last 7d:', starsLast7d);

		// Fetch contributors from last 14 days using REST API
		console.log('[Collector] Fetching contributors14d...');
		const contributors14d = await fetchContributors14d(repo.owner, repo.name, tokens.accessToken);
		console.log('[Collector] Contributors14d:', contributors14d);

		// Fetch median issue response hours from closed issues
		console.log('[Collector] Fetching medianIssueResponseHours...');
		const medianIssueResponseHours = await fetchMedianIssueResponseHours(
			repo.owner,
			repo.name,
			tokens.accessToken
		);
		console.log('[Collector] Median issue response hours:', medianIssueResponseHours);

		// Capture Snapshot
		console.log('[Collector] Saving snapshot...');
		const snapshotId = await ctx.runMutation(internal.collector.saveSnapshot, {
			repoId,
			stars: currentStars,
			starsLast7d,
			issuesOpen: data.issues.totalCount,
			prsOpen: data.pullRequests.totalCount,
			prsMerged7d,
			contributors14d,
			commitGapHours,
			medianIssueResponseHours,
			forks: data.forkCount
		});
		console.log('[Collector] Snapshot saved:', snapshotId);

		if (latestCommitDate) {
			await ctx.runMutation(internal.streakTracker.updateStreak, {
				repoId,
				commitDate: latestCommitDate,
				observedDate
			});
		}

		return snapshotId;
	}
});

export const saveSnapshot = internalMutation({
	args: {
		repoId: v.id('repos'),
		stars: v.number(),
		starsLast7d: v.number(),
		issuesOpen: v.number(),
		prsOpen: v.number(),
		prsMerged7d: v.number(),
		contributors14d: v.number(),
		commitGapHours: v.number(),
		medianIssueResponseHours: v.number(),
		forks: v.number()
	},
	handler: async (ctx, args) => {
		const snapshotId = await ctx.db.insert('repoSnapshots', {
			...args,
			capturedAt: Date.now()
		});

		await ctx.db.patch(args.repoId, {
			lastSyncedAt: Date.now(),
			lastError: undefined
		});

		return snapshotId;
	}
});

export const getLatestSnapshot = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();
	}
});

export const getSnapshotFromDaysAgo = internalQuery({
	args: { repoId: v.id('repos'), daysAgo: v.number() },
	handler: async (ctx, { repoId, daysAgo }) => {
		const now = Date.now();
		const sevenDaysAgo = now - daysAgo * 24 * 60 * 60 * 1000;

		const snapshots = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.filter((q) => q.lte(q.field('capturedAt'), sevenDaysAgo))
			.order('desc')
			.first();

		return snapshots;
	}
});

export const getSnapshotAroundTime = internalQuery({
	args: { repoId: v.id('repos'), targetTime: v.number() },
	handler: async (ctx, { repoId, targetTime }) => {
		const sevenDaysAgo = targetTime - 7 * 24 * 60 * 60 * 1000;

		return await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.filter((q) => q.lte(q.field('capturedAt'), sevenDaysAgo))
			.order('desc')
			.first();
	}
});

export const markSyncError = internalMutation({
	args: { repoId: v.id('repos'), error: v.string() },
	handler: async (ctx, { repoId, error }) => {
		await ctx.db.patch(repoId, {
			lastError: error,
			lastSyncedAt: Date.now()
		});
	}
});
