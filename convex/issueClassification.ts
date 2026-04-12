/**
 * Issue Classification — AI-powered issue triage during sync.
 *
 * Fetches recent open issues, classifies urgency/type/duplicates via Gemini,
 * and creates prioritized tasks with urgency badges.
 *
 * This is the burnout antidote: instead of more alerts, maintainers get
 * fewer, better-prioritized tasks.
 */

import { v } from 'convex/values';
import { query, action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { getAuthUserId } from '@convex-dev/auth/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

interface ClassifiedIssue {
	issueNumber: number;
	title: string;
	urgency: UrgencyLevel;
	type: 'bug' | 'feature' | 'question' | 'discussion';
	isLikelyDuplicate: boolean;
	duplicateOf?: number;
	summary: string;
}

/**
 * Classify recent open issues for a repo.
 * Called during the sync pipeline to create prioritized issue tasks.
 */
export const classifyRecentIssues = action({
	args: {
		repoId: v.id('repos')
	},
	handler: async (ctx, args): Promise<ClassifiedIssue[]> => {
		if (!OPENROUTER_API_KEY) {
			console.warn('OPENROUTER_API_KEY not configured. Skipping issue classification.');
			return [];
		}

		// Get repo details
		const repo = await ctx.runQuery((internal as any).repos.getRepoById, { repoId: args.repoId });
		if (!repo) return [];
		const repoData = repo as any;

		// Get user's GitHub token
		const profile = await ctx.runQuery((internal as any).users.getUserProfile, { userId: repoData.userId });
		if (!profile) return [];

		// Fetch recent open issues from GitHub (last 20, sorted by newest)
		const query = `
			query($owner: String!, $name: String!, $states: [IssueState!]) {
				repository(owner: $owner, name: $name) {
					issues(first: 20, states: $states, orderBy: {field: CREATED_AT, direction: DESC}) {
						nodes {
							number
							title
							body
							createdAt
							author { login }
							labels(first: 10) { nodes { name } }
							comments { totalCount }
						}
					}
				}
			}
		`;

		try {
			const githubResponse = await fetch('https://api.github.com/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${profile.githubAccessToken}`,
					'User-Agent': 'ShipSense-IssueTriage'
				},
				body: JSON.stringify({
					query,
					variables: {
						owner: repoData.owner,
						name: repoData.name,
						states: ['OPEN']
					}
				})
			});

			if (!githubResponse.ok) {
				console.warn(`GitHub API error: ${githubResponse.status}`);
				return [];
			}

			const githubData = await githubResponse.json();
			const issues = githubData.data?.repository?.issues?.nodes ?? [];

			if (issues.length === 0) return [];

			// Build context for Gemini — batch classify all issues in one call
			const issuesContext = issues
				.map((issue: any, i: number) => {
					const labels = (issue.labels?.nodes ?? []).map((l: any) => l.name).join(', ');
					return `Issue #${issue.number}: "${issue.title}"
Labels: ${labels || 'none'}
Author: ${issue.author?.login ?? 'unknown'}
Comments: ${issue.comments?.totalCount ?? 0}
Body: ${(issue.body ?? '').substring(0, 500)}
---`;
				})
				.join('\n');

			const prompt = `You are an expert open-source maintainer triaging issues. Classify each issue below.

**Rules:**
- **urgency**: "critical" if production-down, security, or blocking users; "high" if affecting many users; "medium" if normal bug/feature; "low" if nice-to-have or discussion
- **type**: "bug", "feature", "question", or "discussion"
- **isLikelyDuplicate**: true if the issue seems to repeat an existing issue (similar description/title)
- **summary**: one sentence explaining the core issue/request
- **duplicateOf**: if isLikelyDuplicate, guess which issue number it might duplicate (from the list)

**Output format:** Return ONLY a JSON array, one object per issue, in the same order. No markdown, no explanation.
Format: [{"issueNumber": N, "urgency": "critical|high|medium|low", "type": "bug|feature|question|discussion", "isLikelyDuplicate": true/false, "duplicateOf": N_or_null, "summary": "..."}]

${issuesContext}`;

			const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${OPENROUTER_API_KEY}`,
					'HTTP-Referer': 'https://shipsense.app',
					'X-Title': 'ShipSense'
				},
				body: JSON.stringify({
					model: 'openrouter/free',
					messages: [
						{ role: 'system', content: 'You are an expert open-source maintainer triaging issues. Return ONLY valid JSON. No markdown, no explanation.' },
						{ role: 'user', content: prompt }
					],
					temperature: 0.3,
					max_tokens: 2000
				})
			});

			if (!response.ok) {
				console.warn(`OpenRouter API error: ${response.status}`);
				return [];
			}

			const data = await response.json();
			const text = data?.choices?.[0]?.message?.content ?? '';

			// Parse JSON from response (may be wrapped in markdown code blocks)
			const jsonMatch = text.match(/\[[\s\S]*\]/);
			if (!jsonMatch) {
				console.warn('OpenRouter returned non-JSON response for issue classification.');
				return [];
			}

			const classified = JSON.parse(jsonMatch[0]) as ClassifiedIssue[];
			return classified.filter((c) => c.issueNumber && c.urgency && c.type);
		} catch (err) {
			console.error('Issue classification failed:', err);
			return [];
		}
	}
});

/**
 * Store classified issues as tasks with urgency.
 * Called by the orchestrator after classification.
 */
export const storeClassifiedIssues = internalMutation({
	args: {
		repoId: v.id('repos'),
		issues: v.array(
			v.object({
				issueNumber: v.number(),
				title: v.string(),
				urgency: v.union(v.literal('critical'), v.literal('high'), v.literal('medium'), v.literal('low')),
				type: v.union(v.literal('bug'), v.literal('feature'), v.literal('question'), v.literal('discussion')),
				isLikelyDuplicate: v.boolean(),
				duplicateOf: v.optional(v.number()),
				summary: v.string()
			})
		)
	},
	handler: async (ctx, args) => {
		const repo = await ctx.db.get(args.repoId);
		if (!repo) return;

		for (const issue of args.issues) {
			// Priority mapping: urgency → numeric priority (lower = more important)
			const priorityMap: Record<string, number> = { critical: 1, high: 2, medium: 4, low: 6 };
			const priority = priorityMap[issue.urgency] ?? 4;

			const urgencyEmoji: Record<string, string> = { critical: '🔴', high: '🟡', medium: '⚪', low: '💬' };

			let taskText = `${urgencyEmoji[issue.urgency] ?? ''} Reply to issue #${issue.issueNumber}: ${issue.title}`;
			if (issue.isLikelyDuplicate) {
				taskText = `🔀 Check if issue #${issue.issueNumber} is a duplicate of #${issue.duplicateOf ?? 'another issue'}`;
			}

			const staleKey = `issue_${issue.issueNumber}`;

			// Check if task already exists
			const existing = await ctx.db
				.query('repoTasks')
				.withIndex('by_repoId_isCompleted', (q) => q.eq('repoId', args.repoId).eq('isCompleted', false))
				.collect()
				.then((tasks) => tasks.find((t) => t.staleKey === staleKey));

			if (existing) {
				// Update urgency if changed
				await ctx.db.patch(existing._id, {
					urgency: issue.urgency,
					priority,
					issueNumber: issue.issueNumber
				});
			} else {
				await ctx.db.insert('repoTasks', {
					repoId: args.repoId,
					userId: repo.userId,
					taskText,
					taskType: 'issue',
					priority,
					taskSource: 'trend',
					expectedImpact: issue.summary,
					impactScore: issue.urgency === 'critical' ? 10 : issue.urgency === 'high' ? 7 : 4,
					issueNumber: issue.issueNumber,
					urgency: issue.urgency,
					staleKey,
					isCompleted: false,
					createdAt: Date.now()
				});
			}
		}
	}
});

/**
 * Query: get classified issues for a repo (for UI display).
 */
export const getClassifiedIssues = query({
	args: { repoId: v.id('repos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const tasks = await ctx.db
			.query('repoTasks')
			.withIndex('by_repoId_isCompleted', (q) => q.eq('repoId', args.repoId).eq('isCompleted', false))
			.filter((q) => q.eq(q.field('taskType'), 'issue'))
			.order('asc')
			.collect();

		return tasks
			.filter((t) => t.urgency)
			.map((t) => ({
				_id: t._id,
				issueNumber: t.issueNumber,
				urgency: t.urgency,
				taskText: t.taskText,
				expectedImpact: t.expectedImpact,
				priority: t.priority
			}))
			.sort((a, b) => a.priority - b.priority);
	}
});
