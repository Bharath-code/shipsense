import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';

export type TaskType = 'commit' | 'issue' | 'pr' | 'general' | 'anomaly';

export interface GeneratedTask {
	taskText: string;
	taskType: TaskType;
	priority: number;
}

export function determineTasks(
	isPrivate: boolean,
	commitGapHours: number,
	snapshot: {
		issuesOpen: number;
		prsOpen: number;
		prsMerged7d: number;
		contributors14d: number;
	},
	previousScore?: number,
	currentScore?: number
): GeneratedTask[] {
	const tasks: GeneratedTask[] = [];

	// Commit gap task - highest priority if no recent commits
	if (commitGapHours > 24) {
		if (commitGapHours > 48) {
			tasks.push({
				taskText: 'No commits in 2+ days. Push something today to keep your streak alive!',
				taskType: 'commit',
				priority: 1
			});
		} else {
			tasks.push({
				taskText: 'Push a commit today to keep your streak alive.',
				taskType: 'commit',
				priority: 2
			});
		}
	}

	// Open issues task - if there are many open issues
	if (!isPrivate && snapshot.issuesOpen > 10) {
		tasks.push({
			taskText: `${snapshot.issuesOpen} open issues. Consider triaging or closing some.`,
			taskType: 'issue',
			priority: 3
		});
	} else if (!isPrivate && snapshot.issuesOpen > 0) {
		tasks.push({
			taskText: 'Check for new issues that need triaging.',
			taskType: 'issue',
			priority: 5
		});
	}

	// Stale PRs task - if there are open PRs but no recent merges
	if (snapshot.prsOpen > 0 && snapshot.prsMerged7d === 0) {
		tasks.push({
			taskText: `${snapshot.prsOpen} open PRs with no merges this week. Follow up on reviews.`,
			taskType: 'pr',
			priority: 4
		});
	}

	// Growth task - if gaining contributors
	if (snapshot.contributors14d >= 3) {
		tasks.push({
			taskText: `${snapshot.contributors14d} new contributors this month. Welcome them!`,
			taskType: 'general',
			priority: 6
		});
	}

	// Score drop anomaly task - if score decreased significantly
	if (previousScore !== undefined && currentScore !== undefined) {
		const scoreDrop = previousScore - currentScore;
		if (scoreDrop >= 15) {
			tasks.push({
				taskText: `Health score dropped ${scoreDrop} points. Check what's changed.`,
				taskType: 'anomaly',
				priority: 1
			});
		} else if (scoreDrop >= 10) {
			tasks.push({
				taskText: `Health score dropped ${scoreDrop} points. Review your metrics.`,
				taskType: 'anomaly',
				priority: 2
			});
		}
	}

	// Sort by priority
	return tasks.sort((a, b) => a.priority - b.priority);
}

export const generateTasks = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		const repo = await ctx.runQuery(internal.repos.getRepoById, { repoId });
		if (!repo) return;

		const latestSnapshot = await ctx.runQuery(internal.collector.getLatestSnapshot, { repoId });
		if (!latestSnapshot) return;

		const latestScore = await ctx.runQuery(internal.scorer.getLatestScore, { repoId });

		// Get previous score for anomaly detection
		let previousScore: number | undefined;
		if (latestScore && latestScore.previousScore !== undefined) {
			previousScore = latestScore.previousScore;
		}

		const existingTasks = await ctx.runQuery(internal.taskGenerator.getOpenTasks, { repoId });
		for (const task of existingTasks) {
			await ctx.runMutation(internal.taskGenerator.completeTaskInternal, { taskId: task._id });
		}

		const generatedTasks = determineTasks(
			repo.isPrivate,
			latestSnapshot.commitGapHours,
			{
				issuesOpen: latestSnapshot.issuesOpen,
				prsOpen: latestSnapshot.prsOpen,
				prsMerged7d: latestSnapshot.prsMerged7d,
				contributors14d: latestSnapshot.contributors14d
			},
			previousScore,
			latestScore?.healthScore
		);

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
			v.literal('general'),
			v.literal('anomaly')
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
