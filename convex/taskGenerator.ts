import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';

export type TaskType = 'commit' | 'issue' | 'pr' | 'general' | 'anomaly' | 'dependency' | 'readme';
export type TaskSource = 'anomaly' | 'trend' | 'dependency' | 'readme' | 'hygiene';

export interface GeneratedTask {
	taskText: string;
	taskType: TaskType;
	priority: number;
	taskSource: TaskSource;
	expectedImpact: string;
	impactScore?: number;
	/**
	 * A stable key used to determine whether an existing task is still relevant.
	 * If the condition that produced the task no longer exists, the task is auto-completed.
	 */
	staleKey: string;
}

type ActiveAnomaly = Pick<
	Doc<'repoAnomalies'>,
	'kind' | 'severity' | 'title' | 'recommendedAction' | 'description'
>;

type ExistingTask = Doc<'repoTasks'>;

// ── Stale-key helpers ────────────────────────────────────────────────
// Each task condition gets a stable key. On every sync, we compare the
// set of current stale-keys against the set of open-task stale-keys.
// Tasks whose stale-key is NOT in the current set are auto-completed.

function commitGapKey(hours: number): string {
	return hours >= 48 ? 'commit_gap_48' : hours > 24 ? 'commit_gap_24' : '';
}

function issuesKey(openIssues: number): string {
	return openIssues > 10 ? 'issues_high' : openIssues > 0 ? 'issues_triage' : '';
}

function prsKey(prsOpen: number, prsMerged7d: number): string {
	return prsOpen > 0 && prsMerged7d === 0 ? 'prs_stale' : '';
}

function contributorsKey(contributors14d: number): string {
	return contributors14d >= 3 ? 'contributors_growth' : '';
}

function scoreDropKey(previousScore?: number, currentScore?: number): string {
	if (previousScore === undefined || currentScore === undefined) return '';
	const drop = previousScore - currentScore;
	if (drop >= 15) return `score_drop_15`;
	if (drop >= 10) return `score_drop_10`;
	return '';
}

function anomalyKey(kind: string, severity: string): string {
	return `anomaly_${kind}_${severity}`;
}

function dependencyKey(type: 'vuln' | 'deprecated' | 'major_outdated'): string {
	return `dep_${type}`;
}

function readmeKey(score: number): string {
	return score < 60 ? `readme_low_${Math.floor(score / 10) * 10}` : '';
}

// ── Anomaly task generation ──────────────────────────────────────────

function anomalyTasks(anomalies: ActiveAnomaly[], previousScore?: number): GeneratedTask[] {
	return anomalies.map((anomaly) => {
		if (anomaly.kind === 'star_spike') {
			return {
				taskText: `Star spike active. ${anomaly.recommendedAction}`,
				taskType: 'anomaly' as const,
				priority: 2,
				taskSource: 'anomaly',
				expectedImpact:
					'Helps you turn short-term attention into sustained distribution while momentum is high.',
				impactScore: 5,
				staleKey: anomalyKey(anomaly.kind, anomaly.severity)
			};
		}

		if (anomaly.kind === 'contributor_spike') {
			return {
				taskText: `Contributor interest is up. ${anomaly.recommendedAction}`,
				taskType: 'anomaly' as const,
				priority: 2,
				taskSource: 'anomaly',
				expectedImpact:
					'Improves contributor activation and increases the chance that first-time contributors return.',
				impactScore: 10,
				staleKey: anomalyKey(anomaly.kind, anomaly.severity)
			};
		}

		// momentum_drop or any other anomaly
		return {
			taskText: `Momentum slipped. ${anomaly.recommendedAction}`,
			taskType: 'anomaly' as const,
			priority: anomaly.severity === 'high' ? 2 : 3,
			taskSource: 'anomaly',
			expectedImpact:
				'Stops the current slowdown before it turns into a longer-term drop in repo health.',
			impactScore: Math.round(Math.min(previousScore ? previousScore * 0.1 : 8, 15)),
			staleKey: anomalyKey(anomaly.kind, anomaly.severity)
		};
	});
}

// ── Main task determination engine ───────────────────────────────────

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
	currentScore?: number,
	dependencySummary?: {
		vulnerable: number;
		deprecated: number;
		majorOutdated: number;
	},
	readmeScore?: number | null,
	readmeSuggestions?: string[]
): GeneratedTask[] {
	const tasks: GeneratedTask[] = [...anomalyTasks(anomalies)];

	// ── Score drop tasks (priority 0-1 — always top of queue) ────────
	// Score drop ALWAYS outranks commit gap because a regression in
	// overall health is more urgent than a single missed day of commits.
	// We generate these even if a momentum_drop anomaly exists, because
	// the score-drop framing ("dropped X points") is more specific and
	// actionable than the generic "momentum slipped" anomaly message.
	if (previousScore !== undefined && currentScore !== undefined) {
		const scoreDrop = previousScore - currentScore;
		if (scoreDrop >= 15) {
			tasks.push({
				taskText: `Health score dropped ${scoreDrop} points. Check what's changed.`,
				taskType: 'anomaly',
				priority: 0,
				taskSource: 'anomaly',
				expectedImpact: 'Helps you identify the largest regression quickly before it compounds.',
				impactScore: scoreDrop,
				staleKey: scoreDropKey(previousScore, currentScore)
			});
		} else if (scoreDrop >= 10) {
			tasks.push({
				taskText: `Health score dropped ${scoreDrop} points. Review your metrics.`,
				taskType: 'anomaly',
				priority: 1,
				taskSource: 'anomaly',
				expectedImpact: 'Keeps a short-term decline from becoming a longer-term momentum problem.',
				impactScore: scoreDrop,
				staleKey: scoreDropKey(previousScore, currentScore)
			});
		}
	}

	// ── Commit gap task ──────────────────────────────────────────────
	if (commitGapHours > 24) {
		if (commitGapHours >= 48) {
			tasks.push({
				taskText: 'No commits in 2+ days. Push something today to keep your streak alive!',
				taskType: 'commit',
				priority: 2,
				taskSource: 'hygiene',
				expectedImpact:
					'Keeps your shipping streak alive and signals active maintenance to visitors and contributors.',
				impactScore: 4,
				staleKey: commitGapKey(commitGapHours)
			});
		} else {
			tasks.push({
				taskText: 'Push a commit today to keep your streak alive.',
				taskType: 'commit',
				priority: 3,
				taskSource: 'hygiene',
				expectedImpact: 'Maintains visible repo activity so momentum does not stall between syncs.',
				impactScore: 2,
				staleKey: commitGapKey(commitGapHours)
			});
		}
	}

	// ── Open issues task ─────────────────────────────────────────────
	if (!isPrivate && snapshot.issuesOpen > 10) {
		tasks.push({
			taskText: `${snapshot.issuesOpen} open issues. Consider triaging or closing some.`,
			taskType: 'issue',
			priority: 4,
			taskSource: 'trend',
			expectedImpact:
				'Improves responsiveness and makes the project feel easier to join and trust.',
			impactScore: Math.min(Math.round(snapshot.issuesOpen / 5), 8),
			staleKey: issuesKey(snapshot.issuesOpen)
		});
	} else if (!isPrivate && snapshot.issuesOpen > 0) {
		tasks.push({
			taskText: 'Check for new issues that need triaging.',
			taskType: 'issue',
			priority: 6,
			taskSource: 'trend',
			expectedImpact:
				'Prevents support debt from building up and keeps community questions from going cold.',
			impactScore: 1,
			staleKey: issuesKey(snapshot.issuesOpen)
		});
	}

	// ── Stale PRs task ───────────────────────────────────────────────
	if (snapshot.prsOpen > 0 && snapshot.prsMerged7d === 0) {
		tasks.push({
			taskText: `${snapshot.prsOpen} open PRs with no merges this week. Follow up on reviews.`,
			taskType: 'pr',
			priority: 5,
			taskSource: 'trend',
			expectedImpact: 'Unlocks contribution flow so outside momentum does not stall in review.',
			impactScore: Math.min(snapshot.prsOpen * 2, 10),
			staleKey: prsKey(snapshot.prsOpen, snapshot.prsMerged7d)
		});
	}

	// ── Dependency tasks ─────────────────────────────────────────────
	if (dependencySummary) {
		if (dependencySummary.vulnerable > 0) {
			const count = dependencySummary.vulnerable;
			const noun = count === 1 ? 'vulnerable dependency needs' : 'vulnerable dependencies need';
			tasks.push({
				taskText: `${count} ${noun} attention. Update or replace affected packages.`,
				taskType: 'dependency',
				priority: count >= 3 ? 1 : 2,
				taskSource: 'dependency',
				expectedImpact:
					'Reduces security risk and keeps the project safe from known CVEs in the supply chain.',
				impactScore: Math.min(count * 5, 15),
				staleKey: dependencyKey('vuln')
			});
		}

		if (dependencySummary.deprecated > 0) {
			const count = dependencySummary.deprecated;
			const noun = count === 1 ? 'deprecated dependency in use' : 'deprecated dependencies in use';
			const verb = count === 1 ? 'Migrate' : 'Migrate';
			tasks.push({
				taskText: `${count} ${noun}. ${verb} to supported alternatives.`,
				taskType: 'dependency',
				priority: 4,
				taskSource: 'dependency',
				expectedImpact:
					'Prevents future breakages and security gaps since deprecated packages no longer receive fixes.',
				impactScore: count * 3,
				staleKey: dependencyKey('deprecated')
			});
		}

		if (dependencySummary.majorOutdated > 0) {
			const count = dependencySummary.majorOutdated;
			const verb = count === 1 ? 'is' : 'are';
			const noun = count === 1 ? 'dependency' : 'dependencies';
			tasks.push({
				taskText: `${count} ${noun} ${verb} major versions behind. Plan an update.`,
				taskType: 'dependency',
				priority: 7,
				taskSource: 'dependency',
				expectedImpact:
					'Brings in performance improvements, bug fixes, and security patches from newer versions.',
				impactScore: Math.min(count * 2, 8),
				staleKey: dependencyKey('major_outdated')
			});
		}
	}

	// ── README quality tasks ─────────────────────────────────────────
	if (readmeScore !== undefined && readmeScore !== null && readmeScore < 60) {
		const topSuggestion = readmeSuggestions?.[0] ?? 'Improve the README quality';
		tasks.push({
			taskText: `README needs work (score: ${readmeScore}/100). ${topSuggestion}`,
			taskType: 'readme',
			priority: 8,
			taskSource: 'readme',
			expectedImpact:
				'Better documentation converts visitors into users and contributors, improving overall repo health.',
			impactScore: Math.max(1, Math.round((60 - readmeScore) / 10)),
			staleKey: readmeKey(readmeScore)
		});
	}

	// ── Growth task — if gaining contributors ────────────────────────
	if (snapshot.contributors14d >= 3) {
		tasks.push({
			taskText: `${snapshot.contributors14d} new contributors this month. Welcome them!`,
			taskType: 'general',
			priority: 9,
			taskSource: 'trend',
			expectedImpact:
				'Increases the odds that new contributors become repeat contributors instead of one-time visitors.',
			impactScore: 5,
			staleKey: contributorsKey(snapshot.contributors14d)
		});
	}

	// Sort by priority
	return tasks.sort((a, b) => a.priority - b.priority);
}

// ── Stale task reconciliation ────────────────────────────────────────
// Instead of auto-completing ALL tasks on every sync, we only complete
// tasks whose underlying condition no longer exists (stale).

export function reconcileTasks(
	existingTasks: ExistingTask[],
	currentStaleKeys: Set<string>
): { tasksToComplete: ExistingTask[]; tasksToKeep: ExistingTask[] } {
	const tasksToComplete: ExistingTask[] = [];
	const tasksToKeep: ExistingTask[] = [];

	for (const task of existingTasks) {
		if (task.isCompleted) continue;

		const taskKey = (task as any).staleKey ?? legacyStaleKey(task);
		if (taskKey && !currentStaleKeys.has(taskKey)) {
			// Condition no longer exists — auto-complete
			tasksToComplete.push(task);
		} else {
			// Condition still valid — keep it
			tasksToKeep.push(task);
		}
	}

	return { tasksToComplete, tasksToKeep };
}

/**
 * Fallback for tasks created before staleKey was added.
 * Maps task type/conditions to a legacy stale-key.
 */
function legacyStaleKey(task: ExistingTask): string {
	if (task.taskType === 'commit') {
		// Can't determine exact threshold from old data — keep them
		return 'commit_gap_24';
	}
	if (task.taskType === 'issue') {
		return task.taskText.includes('open issues') ? 'issues_high' : 'issues_triage';
	}
	if (task.taskType === 'pr') {
		return 'prs_stale';
	}
	if (task.taskType === 'anomaly' && task.taskText.includes('Health score dropped')) {
		return task.taskText.includes('15') ? 'score_drop_15' : 'score_drop_10';
	}
	// For anything else, keep the task (empty key = never stale)
	return '';
}

// ── Action: generate tasks ───────────────────────────────────────────

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

		// Fetch dependency and README data for task generation
		const depSummary = await ctx.runQuery(
			internal.dependencies.getRepoDependencySummary,
			{ repoId }
		);

		// Determine what tasks should exist given CURRENT conditions
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
			latestScore?.healthScore,
			depSummary,
			latestSnapshot.readmeScore,
			latestSnapshot.readmeSuggestions
		);

		// Build the set of current stale-keys
		const currentStaleKeys = new Set(generatedTasks.map((t) => t.staleKey).filter(Boolean));

		// Reconcile: auto-complete tasks whose conditions no longer exist
		const existingTasks = await ctx.runQuery(internal.taskGenerator.getOpenTasks, { repoId });
		const { tasksToComplete } = reconcileTasks(existingTasks, currentStaleKeys);

		for (const task of tasksToComplete) {
			await ctx.runMutation(internal.taskGenerator.completeTaskInternal, { taskId: task._id });
		}

		// Only create tasks that don't already exist (by staleKey)
		const existingStaleKeys = new Set(
			existingTasks
				.filter((t) => !t.isCompleted)
				.map((t) => ((t as any).staleKey ?? legacyStaleKey(t)))
				.filter(Boolean)
		);

		for (const task of generatedTasks) {
			if (!existingStaleKeys.has(task.staleKey)) {
				await ctx.runMutation(internal.taskGenerator.createTask, {
					repoId,
					userId: repo.userId,
					taskText: task.taskText,
					taskType: task.taskType,
					priority: task.priority,
					taskSource: task.taskSource,
					expectedImpact: task.expectedImpact,
					impactScore: task.impactScore,
					staleKey: task.staleKey
				});
			}
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
			v.literal('anomaly'),
			v.literal('dependency'),
			v.literal('readme')
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
		impactScore: v.optional(v.number()),
		staleKey: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		// Avoid creating duplicate unresolved tasks of same staleKey
		const existing = await ctx.db
			.query('repoTasks')
			.withIndex('by_repoId_isCompleted', (q) =>
				q.eq('repoId', args.repoId).eq('isCompleted', false)
			)
			.filter((q) => q.eq(q.field('staleKey'), args.staleKey ?? ''))
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
