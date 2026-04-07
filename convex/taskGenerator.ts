import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';

export type TaskType = 'commit' | 'issue' | 'pr' | 'general' | 'anomaly';
export type TaskSource = 'anomaly' | 'trend' | 'dependency' | 'readme' | 'hygiene';

export interface GeneratedTask {
	taskText: string;
	taskType: TaskType;
	priority: number;
	taskSource: TaskSource;
	expectedImpact: string;
	impactScore?: number;
}

type ActiveAnomaly = Pick<
	Doc<'repoAnomalies'>,
	'kind' | 'severity' | 'title' | 'recommendedAction' | 'description'
>;

function anomalyTasks(anomalies: ActiveAnomaly[], previousScore?: number): GeneratedTask[] {
	return anomalies.map((anomaly) => {
		if (anomaly.kind === 'star_spike') {
			return {
				taskText: `Star spike active. ${anomaly.recommendedAction}`,
				taskType: 'anomaly' as const,
				priority: anomaly.severity === 'high' ? 1 : 2,
				taskSource: 'anomaly',
				expectedImpact:
					'Helps you turn short-term attention into sustained distribution while momentum is high.',
				impactScore: 5
			};
		}

		if (anomaly.kind === 'contributor_spike') {
			return {
				taskText: `Contributor interest is up. ${anomaly.recommendedAction}`,
				taskType: 'anomaly' as const,
				priority: anomaly.severity === 'high' ? 1 : 2,
				taskSource: 'anomaly',
				expectedImpact:
					'Improves contributor activation and increases the chance that first-time contributors return.',
				impactScore: 10
			};
		}

		return {
			taskText: `Momentum slipped. ${anomaly.recommendedAction}`,
			taskType: 'anomaly' as const,
			priority: anomaly.severity === 'high' ? 1 : 2,
			taskSource: 'anomaly',
			expectedImpact:
				'Stops the current slowdown before it turns into a longer-term drop in repo health.',
			impactScore: Math.round(Math.min(previousScore ? previousScore * 0.1 : 8, 15))
		};
	});
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
	anomalies: ActiveAnomaly[] = [],
	previousScore?: number,
	currentScore?: number
): GeneratedTask[] {
	const tasks: GeneratedTask[] = [...anomalyTasks(anomalies)];

	// Commit gap task - highest priority if no recent commits
	if (commitGapHours > 24) {
		if (commitGapHours >= 48) {
			tasks.push({
				taskText: 'No commits in 2+ days. Push something today to keep your streak alive!',
				taskType: 'commit',
				priority: 1,
				taskSource: 'hygiene',
				expectedImpact:
					'Keeps your shipping streak alive and signals active maintenance to visitors and contributors.',
				impactScore: 4
			});
		} else {
			tasks.push({
				taskText: 'Push a commit today to keep your streak alive.',
				taskType: 'commit',
				priority: 2,
				taskSource: 'hygiene',
				expectedImpact: 'Maintains visible repo activity so momentum does not stall between syncs.',
				impactScore: 2
			});
		}
	}

	// Open issues task - if there are many open issues
	if (!isPrivate && snapshot.issuesOpen > 10) {
		tasks.push({
			taskText: `${snapshot.issuesOpen} open issues. Consider triaging or closing some.`,
			taskType: 'issue',
			priority: 3,
			taskSource: 'trend',
			expectedImpact:
				'Improves responsiveness and makes the project feel easier to join and trust.',
			impactScore: Math.min(Math.round(snapshot.issuesOpen / 5), 8)
		});
	} else if (!isPrivate && snapshot.issuesOpen > 0) {
		tasks.push({
			taskText: 'Check for new issues that need triaging.',
			taskType: 'issue',
			priority: 5,
			taskSource: 'trend',
			expectedImpact:
				'Prevents support debt from building up and keeps community questions from going cold.',
			impactScore: 1
		});
	}

	// Stale PRs task - if there are open PRs but no recent merges
	if (snapshot.prsOpen > 0 && snapshot.prsMerged7d === 0) {
		tasks.push({
			taskText: `${snapshot.prsOpen} open PRs with no merges this week. Follow up on reviews.`,
			taskType: 'pr',
			priority: 4,
			taskSource: 'trend',
			expectedImpact: 'Unlocks contribution flow so outside momentum does not stall in review.',
			impactScore: Math.min(snapshot.prsOpen * 2, 10)
		});
	}

	// Growth task - if gaining contributors
	if (snapshot.contributors14d >= 3) {
		tasks.push({
			taskText: `${snapshot.contributors14d} new contributors this month. Welcome them!`,
			taskType: 'general',
			priority: 6,
			taskSource: 'trend',
			expectedImpact:
				'Increases the odds that new contributors become repeat contributors instead of one-time visitors.',
			impactScore: 5
		});
	}

	// Score drop anomaly task - if score decreased significantly and no anomaly task already exists
	if (
		previousScore !== undefined &&
		currentScore !== undefined &&
		!anomalies.some((anomaly) => anomaly.kind === 'momentum_drop')
	) {
		const scoreDrop = previousScore - currentScore;
		if (scoreDrop >= 15) {
			tasks.push({
				taskText: `Health score dropped ${scoreDrop} points. Check what's changed.`,
				taskType: 'anomaly',
				priority: 1,
				taskSource: 'anomaly',
				expectedImpact: 'Helps you identify the largest regression quickly before it compounds.',
				impactScore: scoreDrop
			});
		} else if (scoreDrop >= 10) {
			tasks.push({
				taskText: `Health score dropped ${scoreDrop} points. Review your metrics.`,
				taskType: 'anomaly',
				priority: 2,
				taskSource: 'anomaly',
				expectedImpact: 'Keeps a short-term decline from becoming a longer-term momentum problem.',
				impactScore: scoreDrop
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
		const activeAnomalies: ActiveAnomaly[] = await ctx.runQuery(
			internal.anomalies.listActiveRepoAnomalies,
			{ repoId }
		);

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
			activeAnomalies,
			previousScore,
			latestScore?.healthScore
		);

		for (const task of generatedTasks) {
			await ctx.runMutation(internal.taskGenerator.createTask, {
				repoId,
				userId: repo.userId,
				taskText: task.taskText,
				taskType: task.taskType,
				priority: task.priority,
				taskSource: task.taskSource,
				expectedImpact: task.expectedImpact,
				impactScore: task.impactScore
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
		priority: v.number(),
		taskSource: v.optional(
			v.union(
				v.literal('anomaly'),
				v.literal('trend'),
				v.literal('dependency'),
				v.literal('readme'),
				v.literal('hygiene')
			)
		),
		expectedImpact: v.optional(v.string()),
		impactScore: v.optional(v.number())
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
