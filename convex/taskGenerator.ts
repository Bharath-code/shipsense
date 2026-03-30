import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';

export function determineTasks(isPrivate: boolean, commitGapHours: number) {
	const tasks = [];

	if (commitGapHours > 24) {
		tasks.push({
			taskText: 'Push a commit today to keep your streak alive.',
			taskType: 'commit' as const,
			priority: 1
		});
	}

	if (!isPrivate) {
		tasks.push({
			taskText: 'Check for new issues that need triaging.',
			taskType: 'issue' as const,
			priority: 2
		});
	}

	return tasks;
}

export const generateTasks = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const repo = await ctx.runQuery(internal.repos.getRepoById, { repoId });
		if (!repo) return;

		const latestSnapshot = await ctx.runQuery(internal.collector.getLatestSnapshot, { repoId });
		if (!latestSnapshot) return;

		const existingTasks = await ctx.runQuery(internal.taskGenerator.getOpenTasks, { repoId });
		for (const task of existingTasks) {
			await ctx.runMutation(internal.taskGenerator.completeTaskInternal, { taskId: task._id });
		}

		const commitGapHours = latestSnapshot.commitGapHours;
		const isPrivate = repo.isPrivate;

		const generatedTasks = determineTasks(isPrivate, commitGapHours);

		for (const task of generatedTasks) {
			await ctx.runMutation(internal.taskGenerator.createTask, {
				repoId,
				userId: repo.userId,
				taskText: task.taskText,
				taskType: task.taskType,
				priority: task.priority
			});
		}
	}
});

export const createTask = internalMutation({
	args: {
		repoId: v.id('repos'),
		userId: v.id('users'),
		taskText: v.string(),
		taskType: v.union(
			v.literal('commit'),
			v.literal('issue'),
			v.literal('pr'),
			v.literal('general')
		),
		priority: v.number()
	},
	handler: async (ctx, args) => {
		// Avoid creating duplicate unresolved tasks of same type
		const existing = await ctx.db
			.query('repoTasks')
			.withIndex('by_repoId_isCompleted', (q) =>
				q.eq('repoId', args.repoId).eq('isCompleted', false)
			)
			.filter((q) => q.eq(q.field('taskType'), args.taskType))
			.unique();

		if (!existing) {
			await ctx.db.insert('repoTasks', {
				...args,
				isCompleted: false,
				createdAt: Date.now()
			});
		}
	}
});

export const getOpenTasks = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoTasks')
			.withIndex('by_repoId_isCompleted', (q) => q.eq('repoId', repoId).eq('isCompleted', false))
			.collect();
	}
});

export const completeTaskInternal = internalMutation({
	args: { taskId: v.id('repoTasks') },
	handler: async (ctx, { taskId }) => {
		await ctx.db.patch(taskId, {
			isCompleted: true,
			completedAt: Date.now()
		});
	}
});
