import { action } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { internal } from './_generated/api';

/**
 * Complete a task by taking action on GitHub.
 * Currently supports closing issues for issue-type tasks that have an issueNumber.
 */
export const completeTaskOnGitHub = action({
	args: { taskId: v.id('repoTasks') },
	handler: async (ctx, args): Promise<{ success: boolean; closedIssueNumber: number }> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Unauthenticated');

		const task = await ctx.runQuery((internal as any).dashboard.getTaskById, {
			taskId: args.taskId
		});
		if (!task || task.userId !== userId) throw new Error('Unauthorized');

		if (task.taskType !== 'issue' || !task.issueNumber) {
			throw new Error('This task does not support a GitHub action');
		}

		const [repo, token] = await Promise.all([
			ctx.runQuery((internal as any).repos.getRepoById, { repoId: task.repoId }),
			ctx.runQuery((internal as any).users.getGithubToken, { userId })
		]);

		if (!repo) throw new Error('Repo not found');
		if (!token) throw new Error('GitHub token not found');

		const response = await fetch(
			`https://api.github.com/repos/${repo.owner}/${repo.name}/issues/${task.issueNumber}`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token.accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/vnd.github+json'
				},
				body: JSON.stringify({ state: 'closed', state_reason: 'completed' })
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
		}

		await ctx.runMutation((internal as any).taskGenerator.completeTaskInternal, {
			taskId: args.taskId
		});

		return { success: true, closedIssueNumber: task.issueNumber };
	}
});
