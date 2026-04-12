/**
 * Issue Reply Drafts — AI-drafted responses to GitHub issues.
 *
 * When a task says "Reply to issue #214", this generates a professional
 * draft response that the user can review, edit, and post.
 *
 * This transforms ShipSense from a dashboard → an agent.
 */

import { v } from 'convex/values';
import { query, action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { getAuthUserId } from '@convex-dev/auth/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Fetch a specific issue's content from GitHub and generate a draft reply.
 */
export const generateIssueReplyDraft = action({
	args: {
		repoId: v.id('repos'),
		issueNumber: v.number()
	},
	handler: async (ctx, args): Promise<{ draft: string; issueTitle: string; issueBody: string }> => {
		if (!OPENROUTER_API_KEY) {
			throw new Error('OPENROUTER_API_KEY not configured.');
		}

		// Verify ownership and get repo details via query
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		// We need to pass the repo data via a query since actions can't access ctx.db
		const repoQuery = await ctx.runQuery((internal as any).repos.getRepoById, { repoId: args.repoId });
		if (!repoQuery) throw new Error('Repo not found');
		const repo = repoQuery as any;

		if (repo.userId !== userId) throw new Error('Not authorized');

		// Get user's GitHub token
		const profile = await ctx.runQuery((internal as any).users.getUserProfile, { userId });
		if (!profile) throw new Error('User profile not found');

		// Fetch issue from GitHub
		const query = `
			query($owner: String!, $name: String!, $number: Int!) {
				repository(owner: $owner, name: $name) {
					issue(number: $number) {
						title
						body
						author { login }
						comments(first: 5) {
							nodes {
								body
								author { login }
							}
						}
						labels(first: 10) {
							nodes { name }
						}
					}
				}
			}
		`;

		const githubResponse = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${profile.githubAccessToken}`,
				'User-Agent': 'ShipSense-IssueDrafts'
			},
			body: JSON.stringify({
				query,
				variables: {
					owner: repo.owner,
					name: repo.name,
					number: args.issueNumber
				}
			})
		});

		if (!githubResponse.ok) {
			throw new Error(`Failed to fetch issue from GitHub: ${githubResponse.status}`);
		}

		const githubData = await githubResponse.json();
		const issue = githubData.data?.repository?.issue;
		if (!issue) throw new Error(`Issue #${args.issueNumber} not found`);

		// Build context for Gemini
		const commentsContext = (issue.comments?.nodes ?? [])
			.map((c: any) => `${c.author?.login ?? 'User'}: ${c.body.substring(0, 300)}`)
			.join('\n\n');

		const labels = (issue.labels?.nodes ?? []).map((l: any) => l.name).join(', ');

		const prompt = `You are a helpful, professional open-source maintainer. Draft a reply to the following GitHub issue.

**Rules:**
- Be friendly, professional, and concise
- Acknowledge the user's concern
- If it's a bug: ask for reproduction steps if not provided
- If it's a feature request: ask about their use case
- If it's a question: answer helpfully
- Keep it under 150 words
- Use markdown formatting
- Do NOT make promises about timelines
- If you don't have enough info, ask clarifying questions

**Repo:** ${repo.name} (${repo.language ?? 'unknown'})
${repo.description ? `**Description:** ${repo.description}` : ''}

**Issue #${args.issueNumber}: ${issue.title}**
${labels ? `**Labels:** ${labels}` : ''}
**Author:** ${issue.author?.login ?? 'Unknown'}

**Issue body:**
${issue.body?.substring(0, 2000) ?? 'No body provided.'}

${commentsContext ? `**Recent comments:**\n${commentsContext.substring(0, 1000)}` : ''}

**Draft reply:**`;

		// Call OpenRouter (openrouter/free auto-routes across available models)
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
					{ role: 'system', content: 'You are a helpful, professional open-source maintainer. Draft a reply to a GitHub issue. Keep it concise and friendly. Use markdown formatting.' },
					{ role: 'user', content: prompt }
				],
				temperature: 0.7,
				max_tokens: 500
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenRouter API error: ${errorText}`);
		}

		const data = await response.json();
		const draft = data?.choices?.[0]?.message?.content ?? '';

		if (!draft) {
			throw new Error('OpenRouter returned an empty draft.');
		}

		return {
			draft: draft.trim(),
			issueTitle: issue.title,
			issueBody: issue.body?.substring(0, 500) ?? ''
		};
	}
});

/**
 * Store a generated draft for an issue task.
 * Attaches the draft text to the task so it shows in the UI.
 */
export const storeIssueDraft = internalMutation({
	args: {
		taskId: v.id('repoTasks'),
		draft: v.string(),
		issueTitle: v.string(),
		issueNumber: v.number()
	},
	handler: async (ctx, args) => {
		// We store drafts in the task's expectedImpact field (it's a string field)
		// A better approach would be a separate repoIssueDrafts table, but for MVP
		// we encode as JSON in expectedImpact
		const draftData = JSON.stringify({
			type: 'issue_reply',
			draft: args.draft,
			issueTitle: args.issueTitle,
			issueNumber: args.issueNumber,
			generatedAt: Date.now()
		});

		await ctx.db.patch(args.taskId, {
			expectedImpact: draftData
		});
	}
});

/**
 * Public query to get a draft for a task.
 */
export const getTaskDraft = query({
	args: { taskId: v.id('repoTasks') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const task = await ctx.db.get(args.taskId);
		if (!task || task.userId !== userId) return null;

		// Check if expectedImpact contains a draft
		if (!task.expectedImpact) return null;

		try {
			const parsed = JSON.parse(task.expectedImpact);
			if (parsed.type === 'issue_reply') {
				return {
					draft: parsed.draft,
					issueTitle: parsed.issueTitle,
					issueNumber: parsed.issueNumber,
					generatedAt: parsed.generatedAt
				};
			}
		} catch {
			// Not a draft, just regular expected impact text
		}

		return null;
	}
});
