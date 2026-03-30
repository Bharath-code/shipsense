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
	userId: string;
	owner: string;
	name: string;
	fullName: string;
};

type GithubTokenResult = {
	accessToken: string;
} | null;

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

export const fetchRepoData = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }): Promise<Id<'repoSnapshots'> | null> => {
		const repo: CollectorRepo | null = await ctx.runQuery(internal.repos.getRepoById, { repoId });
		if (!repo) throw new Error('Repo not found');

		const tokens: GithubTokenResult = await ctx.runQuery(internal.users.getGithubToken, {
			subject: repo.userId.toString()
		});

		if (!tokens || !tokens.accessToken) {
			console.warn('No token for user', repo.userId);
			return null;
		}

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

		if (!response.ok) {
			console.error(`Failed to fetch repo data for ${repo.fullName}`);
			return null;
		}

		const json: RepoGraphQLResponse = await response.json();
		const data = json.data?.repository;

		if (!data) return null;

		const now = Date.now();
		const prsMerged7d = processMergedPRs(data.mergedPRs?.nodes || [], now);
		const commits = data.defaultBranchRef?.target?.history?.nodes || [];
		const commitGapHours = processCommitGap(commits, now);

		// Capture Snapshot
		return await ctx.runMutation(internal.collector.saveSnapshot, {
			repoId,
			stars: data.stargazerCount,
			starsLast7d: 0, // Simplified for now
			issuesOpen: data.issues.totalCount,
			prsOpen: data.pullRequests.totalCount,
			prsMerged7d,
			contributors14d: 1, // Requires REST API to get accurately, defaulting to 1
			commitGapHours,
			medianIssueResponseHours: 12, // Simplified for now
			forks: data.forkCount
		});
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
		return await ctx.db.insert('repoSnapshots', {
			...args,
			capturedAt: Date.now()
		});
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
