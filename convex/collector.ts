import { internalAction, internalMutation, internalQuery, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';

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
						nodes?: Array<{
							committedDate: string;
							author: {
								name: string;
								email: string;
								user: { login: string } | null;
							};
						}>;
					};
				};
			};
			mentionableUsers?: {
				totalCount: number;
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

/**
 * Fetch stars gained in the last 7 days using the stargazers API.
 * This is more accurate than delta calculations when there's no historical snapshot.
 *
 * IMPORTANT: GitHub's stargazers API returns results in ASCENDING order (oldest first).
 * There's no way to sort descending, so we must fetch ALL stargazers and count recent ones.
 * For large repos (>1000 stars), we use a heuristic to avoid pagination issues.
 */
async function fetchStarsLast7d(
	owner: string,
	name: string,
	accessToken: string,
	totalStars: number
): Promise<number> {
	try {
		const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
		
		// If repo has <= 100 stars, fetch all and count recent
		// If repo has > 100 stars, we need to paginate to get the most recent ones
		// GitHub returns stars in ASC order (oldest first), so last page = newest stars
		
		let url = `${GITHUB_REST_URL}/repos/${owner}/${name}/stargazers?per_page=100`;
		
		// If more than 100 stars, calculate which page has the most recent stars
		// We want the LAST page (newest stars)
		if (totalStars > 100) {
			const totalPages = Math.ceil(totalStars / 100);
			// Fetch the last 2 pages to be safe (in case some stars are from exactly 7 days ago)
			const startPage = Math.max(1, totalPages - 1);
			url = `${GITHUB_REST_URL}/repos/${owner}/${name}/stargazers?per_page=100&page=${startPage}`;
		}
		
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/vnd.github.v3.star+json'
			}
		});

		if (!response.ok) {
			console.warn('[Stars] Failed to fetch stargazers:', response.status, response.statusText);
			return 0;
		}

		const stargazers = await response.json();
		if (!Array.isArray(stargazers)) {
			console.warn('[Stars] Unexpected response:', typeof stargazers);
			return 0;
		}

		// Count stargazers who starred in the last 7 days
		let count = 0;
		for (const stargazer of stargazers) {
			if (!stargazer.starred_at) {
				// Without the special Accept header, starred_at won't be in response
				console.warn('[Stars] Missing starred_at - check Accept header');
				continue;
			}
			const starredAt = new Date(stargazer.starred_at).getTime();
			if (starredAt >= sevenDaysAgo) {
				count++;
			}
		}

		console.log(`[Stars] Fetched ${stargazers.length} stargazers, ${count} from last 7 days`);
		return count;
	} catch (error) {
		console.warn('[Stars] Error fetching stars last 7d:', error);
		return 0;
	}
}

/**
 * Count unique commit authors in the last 14 days from GraphQL commit history.
 * This is more reliable than the /contributors REST endpoint which has known issues.
 *
 * NOTE: We only fetch 100 commits from the GraphQL API. If there are >100 commits
 * in 14 days, we'll miss some. For most repos this is fine.
 */
export function countUniqueAuthors14d(
	commits: Array<{
		committedDate: string;
		author: {
			name: string;
			email: string;
			user: { login: string } | null;
		};
	}>,
	referenceTimeMs: number
): number {
	const fourteenDaysAgo = referenceTimeMs - 14 * 24 * 60 * 60 * 1000;

	// Filter commits from last 14 days and collect unique authors
	const uniqueAuthors = new Set<string>();
	let commitsInWindow = 0;

	for (const commit of commits) {
		const commitTime = new Date(commit.committedDate).getTime();
		if (commitTime >= fourteenDaysAgo) {
			commitsInWindow++;
			// Use GitHub login if available, otherwise use email
			const authorId = commit.author.user?.login || commit.author.email;
			if (authorId) {
				uniqueAuthors.add(authorId);
			}
		}
	}

	console.log(`[Contributors] Found ${commitsInWindow} commits in last 14 days, ${uniqueAuthors.size} unique authors`);
	
	// Return actual count (can be 0 if no commits in 14 days)
	return uniqueAuthors.size;
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

export function extractLatestCommitDate(commits: Array<{ 
	committedDate: string;
	author: {
		name: string;
		email: string;
		user: { login: string } | null;
	};
}>): string | null {
	if (commits.length === 0) return null;

	const latestCommitDate = new Date(commits[0].committedDate);
	if (Number.isNaN(latestCommitDate.getTime())) return null;

	return latestCommitDate.toISOString().slice(0, 10);
}

// Traffic data types
type TrafficViews = {
	count: number;
	uniques: number;
	views: Array<{ timestamp: string; count: number; uniques: number }>;
};

type TrafficClones = {
	count: number;
	uniques: number;
	clones: Array<{ timestamp: string; count: number; uniques: number }>;
};

type ReferrerTraffic = {
	referrer: string;
	count: number;
	uniques: number;
};

type ContentTraffic = {
	path: string;
	title: string;
	count: number;
	uniques: number;
};

type FetchedTrafficData = {
	views: number;
	uniqueVisitors: number;
	clones: number;
	uniqueCloners: number;
	referrers: ReferrerTraffic[];
	paths: ContentTraffic[];
};

/**
 * Fetch traffic data (views, clones, referrers) from GitHub REST API.
 * This is called during the main sync to ensure snapshot has traffic data.
 *
 * KNOWN LIMITATIONS:
 * - Only tracks last 14 days of traffic (GitHub's limit)
 * - Requires push access to the repo
 * - May return 0 for repos without recent web traffic
 * - Traffic starts collecting from FIRST sync, no historical data
 */
async function fetchTrafficData(
	owner: string,
	name: string,
	accessToken: string
): Promise<FetchedTrafficData> {
	const headers = {
		Authorization: `Bearer ${accessToken}`,
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28'
	};

	const baseUrl = `https://api.github.com/repos/${owner}/${name}`;

	try {
		console.log(`[Traffic] Fetching traffic for ${owner}/${name}...`);
		
		const [viewsRes, clonesRes, referrersRes, pathsRes] = await Promise.all([
			fetch(`${baseUrl}/traffic/views?per=day`, { headers }),
			fetch(`${baseUrl}/traffic/clones?per=day`, { headers }),
			fetch(`${baseUrl}/traffic/popular/referrers`, { headers }),
			fetch(`${baseUrl}/traffic/popular/paths`, { headers })
		]);

		console.log(`[Traffic] Views API: ${viewsRes.status} ${viewsRes.statusText}`);
		console.log(`[Traffic] Clones API: ${clonesRes.status} ${clonesRes.statusText}`);
		console.log(`[Traffic] Referrers API: ${referrersRes.status} ${referrersRes.statusText}`);

		const viewsData: TrafficViews = viewsRes.ok
			? await viewsRes.json()
			: { count: 0, uniques: 0, views: [] };
		const clonesData: TrafficClones = clonesRes.ok
			? await clonesRes.json()
			: { count: 0, uniques: 0, clones: [] };
		const referrers: ReferrerTraffic[] = referrersRes.ok ? await referrersRes.json() : [];
		const paths: ContentTraffic[] = pathsRes.ok ? await pathsRes.json() : [];

		console.log(
			`[Traffic] Views: ${viewsData.count} | Uniques: ${viewsData.uniques} | Clones: ${clonesData.count} | Cloners: ${clonesData.uniques} | Referrers: ${referrers.length}`
		);
		
		// Log daily breakdown if available
		if (viewsData.views && viewsData.views.length > 0) {
			console.log(`[Traffic] Daily views (last ${viewsData.views.length} days):`, 
				viewsData.views.map(v => `${v.timestamp}: ${v.count}`).join(', ')
			);
		}
		if (clonesData.clones && clonesData.clones.length > 0) {
			console.log(`[Traffic] Daily clones (last ${clonesData.clones.length} days):`,
				clonesData.clones.map(c => `${c.timestamp}: ${c.count}`).join(', ')
			);
		}

		return {
			views: viewsData.count,
			uniqueVisitors: viewsData.uniques,
			clones: clonesData.count,
			uniqueCloners: clonesData.uniques,
			referrers,
			paths
		};
	} catch (error) {
		console.error('[Traffic] Failed to fetch traffic:', error);
		return {
			views: 0,
			uniqueVisitors: 0,
			clones: 0,
			uniqueCloners: 0,
			referrers: [],
			paths: []
		};
	}
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

		// Detailed query to get PRs, Issues, commits with author info, and all-time contributors
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
                history(first: 100) {
                  nodes {
                    committedDate
                    author {
                      name
                      email
                      user {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
          mentionableUsers(first: 1) {
            totalCount
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

		// Calculate starsLast7d: Try from snapshot history first, fallback to API
		const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
		const oldSnapshot = await ctx.runQuery(internal.collector.getSnapshotAroundTime, {
			repoId,
			targetTime: sevenDaysAgo
		});

		const currentStars = data.stargazerCount;
		console.log('[Collector] Current stars:', currentStars);
		console.log('[Collector] Old snapshot for starsLast7d:', oldSnapshot);

		let starsLast7d: number;
		if (oldSnapshot) {
			// We have historical data - use delta
			starsLast7d = Math.max(0, currentStars - oldSnapshot.stars);
			console.log('[Collector] Stars last 7d (from snapshot):', starsLast7d);
		} else {
			// First sync or no old snapshot - fetch from GitHub API directly
			console.log('[Collector] No old snapshot, fetching starsLast7d from API...');
			starsLast7d = await fetchStarsLast7d(repo.owner, repo.name, tokens.accessToken, currentStars);
			console.log('[Collector] Stars last 7d (from API):', starsLast7d);
		}

		// Count unique commit authors in last 14 days from commit history
		console.log('[Collector] Counting unique contributors14d...');
		const contributors14d = countUniqueAuthors14d(commits, now);
		console.log('[Collector] Contributors14d (from commits):', contributors14d);

		// Fetch median issue response hours from closed issues
		console.log('[Collector] Fetching medianIssueResponseHours...');
		const medianIssueResponseHours = await fetchMedianIssueResponseHours(
			repo.owner,
			repo.name,
			tokens.accessToken
		);
		console.log('[Collector] Median issue response hours:', medianIssueResponseHours);

		// Fetch traffic data (views, clones, referrers) as part of main sync
		// This ensures the snapshot has traffic data on first sync
		console.log('[Collector] Fetching traffic data...');
		const trafficData = await fetchTrafficData(repo.owner, repo.name, tokens.accessToken);
		console.log('[Collector] Traffic data fetched:', trafficData);

		// Capture Snapshot
		console.log('[Collector] Saving snapshot...');
		const totalContributors = data.mentionableUsers?.totalCount ?? 0;
		console.log('[Collector] Total contributors (all-time):', totalContributors);
		
		const snapshotId = await ctx.runMutation(internal.collector.saveSnapshot, {
			repoId,
			stars: currentStars,
			starsLast7d,
			issuesOpen: data.issues.totalCount,
			prsOpen: data.pullRequests.totalCount,
			prsMerged7d,
			contributors14d,
			totalContributors,
			commitGapHours,
			medianIssueResponseHours,
			forks: data.forkCount,
			views: trafficData.views,
			uniqueVisitors: trafficData.uniqueVisitors,
			clones: trafficData.clones,
			uniqueCloners: trafficData.uniqueCloners
		});
		console.log('[Collector] Snapshot saved:', snapshotId);

		// Save referrer data to dedicated table
		if (trafficData.referrers.length > 0 || trafficData.paths.length > 0) {
			await ctx.runMutation(internal.collector.saveRepoReferrers, {
				repoId,
				referrers: trafficData.referrers,
				paths: trafficData.paths,
				totalViews: trafficData.views,
				totalUniques: trafficData.uniqueVisitors,
				totalClones: trafficData.clones,
				totalCloners: trafficData.uniqueCloners
			});
			console.log('[Collector] Referrer data saved');
		}

		if (latestCommitDate) {
			await ctx.runMutation(internal.streakTracker.updateStreak, {
				repoId,
				commitDate: latestCommitDate,
				observedDate
			});
		}

		// Validate snapshot data accuracy
		validateSnapshotData({
			stars: currentStars,
			starsLast7d,
			issuesOpen: data.issues.totalCount,
			prsOpen: data.pullRequests.totalCount,
			prsMerged7d,
			contributors14d,
			totalContributors,
			commitGapHours,
			views: trafficData.views,
			clones: trafficData.clones,
			uniqueCloners: trafficData.uniqueCloners
		});

		return snapshotId;
	}
});

/**
 * Validate snapshot data to catch accuracy issues early.
 * Logs warnings when data looks suspicious.
 */
function validateSnapshotData(data: {
	stars: number;
	starsLast7d: number;
	issuesOpen: number;
	prsOpen: number;
	prsMerged7d: number;
	contributors14d: number;
	totalContributors: number;
	commitGapHours: number;
	views: number;
	clones: number;
	uniqueCloners: number;
}): void {
	const warnings: string[] = [];

	// Stars validation
	if (data.starsLast7d > data.stars) {
		warnings.push(`starsLast7d (${data.starsLast7d}) > total stars (${data.stars}) - data inconsistency`);
	}
	if (data.starsLast7d === 0 && data.stars > 0) {
		warnings.push('starsLast7d is 0 but repo has stars - may indicate first sync or tracking issue');
	}

	// Contributors validation
	if (data.contributors14d === 0 && data.commitGapHours < 336) {
		// 336 hours = 14 days
		warnings.push('contributors14d is 0 but recent commits exist - author counting may be broken');
	}
	if (data.totalContributors > 0 && data.contributors14d > data.totalContributors) {
		warnings.push(`contributors14d (${data.contributors14d}) > totalContributors (${data.totalContributors}) - data error`);
	}

	// Traffic validation
	if (data.views === 0 && data.clones === 0) {
		warnings.push('Both views and clones are 0 - GitHub traffic API may not be tracking this repo');
	}
	if (data.uniqueCloners > data.clones) {
		warnings.push(`uniqueCloners (${data.uniqueCloners}) > total clones (${data.clones}) - data error`);
	}

	// PR validation
	if (data.prsMerged7d < 0) {
		warnings.push(`prsMerged7d is negative (${data.prsMerged7d}) - calculation error`);
	}

	// Commit validation
	if (data.commitGapHours < 0) {
		warnings.push(`commitGapHours is negative (${data.commitGapHours}) - calculation error`);
	}

	// Log all warnings
	if (warnings.length > 0) {
		console.warn('[Collector] Data validation warnings:', warnings);
	}
}

export const saveSnapshot = internalMutation({
	args: {
		repoId: v.id('repos'),
		stars: v.number(),
		starsLast7d: v.number(),
		issuesOpen: v.number(),
		prsOpen: v.number(),
		prsMerged7d: v.number(),
		contributors14d: v.number(),
		totalContributors: v.optional(v.number()),
		commitGapHours: v.number(),
		medianIssueResponseHours: v.number(),
		forks: v.number(),
		views: v.optional(v.number()),
		uniqueVisitors: v.optional(v.number()),
		clones: v.optional(v.number()),
		uniqueCloners: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const syncedAt = Date.now();
		const snapshotId = await ctx.db.insert('repoSnapshots', {
			...args,
			capturedAt: syncedAt
		});

		// Update cumulative traffic tracking in the repo record
		// This is needed because GitHub's traffic API only returns 14-day rolling totals
		const repo = await ctx.db.get(args.repoId);
		const previousSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.first(); // This is the one we just inserted

		// Get the snapshot BEFORE this one for delta calculation
		const snapshots = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', args.repoId))
			.order('desc')
			.take(2);
		const olderSnapshot = snapshots[1] ?? null;

		// Calculate cumulative traffic
		let cumulativeViews = repo?.cumulativeViews ?? 0;
		let cumulativeClones = repo?.cumulativeClones ?? 0;

		if (cumulativeViews === 0) {
			// First sync - initialize with current values
			cumulativeViews = args.views ?? 0;
			cumulativeClones = args.clones ?? 0;
		} else if (olderSnapshot) {
			// Subsequent sync - add the delta to cumulative
			const viewsDelta = Math.max(0, (args.views ?? 0) - (olderSnapshot.views ?? 0));
			const clonesDelta = Math.max(0, (args.clones ?? 0) - (olderSnapshot.clones ?? 0));
			cumulativeViews += viewsDelta;
			cumulativeClones += clonesDelta;
			console.log(`[Traffic] Cumulative update: +${viewsDelta} views, +${clonesDelta} clones`);
		}
		// If no older snapshot, keep the initial values

		await ctx.db.patch(args.repoId, {
			starsCount: args.stars,
			forksCount: args.forks,
			lastSyncedAt: syncedAt,
			lastError: undefined,
			cumulativeViews,
			cumulativeClones
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

export const getSnapshotBeforeLatest = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const snapshots = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.take(2);

		return snapshots[1] ?? null;
	}
});

export const getRecentSnapshots = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.take(5);
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

export const updateReadmeAnalysis = internalMutation({
	args: {
		repoId: v.id('repos'),
		readmeScore: v.number(),
		readmeSuggestions: v.array(v.string())
	},
	handler: async (ctx, { repoId, readmeScore, readmeSuggestions }) => {
		const latestSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();

		if (latestSnapshot) {
			await ctx.db.patch(latestSnapshot._id, {
				readmeScore,
				readmeSuggestions
			});
		}
	}
});

export const fetchRepoTraffic = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }): Promise<Id<'repoReferrers'> | null> => {
		console.log('[Traffic] Starting fetch for repo:', repoId);

		const repo: CollectorRepo | null = await ctx.runQuery(internal.repos.getRepoById, { repoId });
		if (!repo) {
			console.error('[Traffic] Repo not found:', repoId);
			throw new Error('Repo not found');
		}

		const tokens: GithubTokenResult = await ctx.runQuery(internal.users.getGithubToken, {
			userId: repo.userId
		});

		if (!tokens || !tokens.accessToken) {
			console.error('[Traffic] No token for user:', repo.userId);
			return null;
		}

		const headers = {
			Authorization: `Bearer ${tokens.accessToken}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		};

		const baseUrl = `https://api.github.com/repos/${repo.owner}/${repo.name}`;

		try {
			const [viewsRes, clonesRes, referrersRes, pathsRes] = await Promise.all([
				fetch(`${baseUrl}/traffic/views?per=day`, { headers }),
				fetch(`${baseUrl}/traffic/clones?per=day`, { headers }),
				fetch(`${baseUrl}/traffic/popular/referrers`, { headers }),
				fetch(`${baseUrl}/traffic/popular/paths`, { headers })
			]);

			const viewsData: TrafficViews = viewsRes.ok
				? await viewsRes.json()
				: { count: 0, uniques: 0, views: [] };
			const clonesData: TrafficClones = clonesRes.ok
				? await clonesRes.json()
				: { count: 0, uniques: 0, clones: [] };
			const referrers: ReferrerTraffic[] = referrersRes.ok ? await referrersRes.json() : [];
			const paths: ContentTraffic[] = pathsRes.ok ? await pathsRes.json() : [];

			console.log(
				'[Traffic] Views:',
				viewsData.count,
				'| Clones:',
				clonesData.count,
				'| Referrers:',
				referrers.length
			);

			const referrersId = await ctx.runMutation(internal.collector.saveRepoReferrers, {
				repoId,
				referrers,
				paths,
				totalViews: viewsData.count,
				totalUniques: viewsData.uniques,
				totalClones: clonesData.count,
				totalCloners: clonesData.uniques
			});

			// Also update latest snapshot with traffic data
			await ctx.runMutation(internal.collector.updateSnapshotTraffic, {
				repoId,
				views: viewsData.count,
				uniqueVisitors: viewsData.uniques,
				clones: clonesData.count,
				uniqueCloners: clonesData.uniques
			});

			return referrersId;
		} catch (error) {
			console.error('[Traffic] Failed to fetch traffic:', error);
			return null;
		}
	}
});

export const saveRepoReferrers = internalMutation({
	args: {
		repoId: v.id('repos'),
		referrers: v.array(
			v.object({
				referrer: v.string(),
				count: v.number(),
				uniques: v.number()
			})
		),
		paths: v.array(
			v.object({
				path: v.string(),
				title: v.string(),
				count: v.number(),
				uniques: v.number()
			})
		),
		totalViews: v.number(),
		totalUniques: v.number(),
		totalClones: v.number(),
		totalCloners: v.number()
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('repoReferrers', {
			...args,
			capturedAt: Date.now()
		});
	}
});

export const updateSnapshotTraffic = internalMutation({
	args: {
		repoId: v.id('repos'),
		views: v.number(),
		uniqueVisitors: v.number(),
		clones: v.number(),
		uniqueCloners: v.number()
	},
	handler: async (ctx, { repoId, views, uniqueVisitors, clones, uniqueCloners }) => {
		const latestSnapshot = await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();

		if (latestSnapshot) {
			await ctx.db.patch(latestSnapshot._id, {
				views,
				uniqueVisitors,
				clones,
				uniqueCloners
			});
		}
	}
});

export const getLatestReferrers = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoReferrers')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();
	}
});

export const getPreviousReferrers = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const all = await ctx.db
			.query('repoReferrers')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.take(2);
		return all[1] ?? null;
	}
});

export const getReferrersHistory = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
		return await ctx.db
			.query('repoReferrers')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.filter((q) => q.gte(q.field('capturedAt'), thirtyDaysAgo))
			.order('desc')
			.collect();
	}
});

export const getLatestSnapshotWithTraffic = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();
	}
});

// Public query for frontend - wrapper around internal
export const getLatestReferrersPublic = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;
		const repo = await ctx.db.get(repoId);
		if (!repo || repo.userId !== userId) return null;
		return await ctx.db
			.query('repoReferrers')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();
	}
});

export const getLatestSnapshotWithTrafficPublic = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;
		const repo = await ctx.db.get(repoId);
		if (!repo || repo.userId !== userId) return null;
		return await ctx.db
			.query('repoSnapshots')
			.withIndex('by_repoId_capturedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();
	}
});

// Cleanup old referrer data (keep 30 days)
export const cleanupOldReferrers = internalMutation({
	args: {},
	handler: async (ctx) => {
		const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
		const oldRecords = await ctx.db
			.query('repoReferrers')
			.filter((q) => q.lt(q.field('capturedAt'), thirtyDaysAgo))
			.collect();

		for (const record of oldRecords) {
			await ctx.db.delete(record._id);
		}
		console.log('[Traffic] Cleaned up', oldRecords.length, 'old referrer records');
	}
});
