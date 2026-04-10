import { describe, it, expect } from 'vitest';
import { determineTasks, reconcileTasks } from './taskGenerator';

// ── determineTasks tests ─────────────────────────────────────────────

describe('determineTasks', () => {
	it('generates a commit task if commit gap is greater than 24h', () => {
		const tasks = determineTasks(true, 48, {
			issuesOpen: 0,
			prsOpen: 0,
			prsMerged7d: 0,
			contributors14d: 0
		});
		expect(tasks).toHaveLength(1);
		expect(tasks[0].taskType).toBe('commit');
		expect(tasks[0].priority).toBe(2);
		expect(tasks[0].taskSource).toBe('hygiene');
		expect(tasks[0].expectedImpact).toContain('shipping streak');
		expect(tasks[0].staleKey).toBe('commit_gap_48');
	});

	it('generates an issue task if repo is public with many open issues', () => {
		const tasks = determineTasks(false, 12, {
			issuesOpen: 11,
			prsOpen: 0,
			prsMerged7d: 0,
			contributors14d: 0
		});
		expect(tasks).toHaveLength(1);
		expect(tasks[0].taskType).toBe('issue');
		expect(tasks[0].priority).toBe(4);
		expect(tasks[0].taskSource).toBe('trend');
		expect(tasks[0].staleKey).toBe('issues_high');
	});

	it('generates both tasks if public and commit gap > 24h', () => {
		const tasks = determineTasks(false, 48, {
			issuesOpen: 11,
			prsOpen: 0,
			prsMerged7d: 0,
			contributors14d: 0
		});
		expect(tasks).toHaveLength(2);
		expect(tasks.some((t) => t.taskType === 'commit')).toBe(true);
		expect(tasks.some((t) => t.taskType === 'issue')).toBe(true);
	});

	it('generates no tasks if private and commit gap <= 24h', () => {
		const tasks = determineTasks(true, 12, {
			issuesOpen: 0,
			prsOpen: 0,
			prsMerged7d: 0,
			contributors14d: 0
		});
		expect(tasks).toHaveLength(0);
	});

	it('turns active anomalies into tasks', () => {
		const tasks = determineTasks(
			true,
			12,
			{
				issuesOpen: 0,
				prsOpen: 0,
				prsMerged7d: 0,
				contributors14d: 0
			},
			[
				{
					kind: 'star_spike',
					severity: 'high',
					title: 'Star spike detected',
					description: 'Stars jumped quickly.',
					recommendedAction: 'Share the momentum publicly.'
				}
			]
		);

		expect(tasks[0].taskType).toBe('anomaly');
		expect(tasks[0].taskText).toContain('Share the momentum publicly.');
		expect(tasks[0].expectedImpact).toContain('distribution');
		expect(tasks[0].staleKey).toBe('anomaly_star_spike_high');
	});

	it('score drop always outranks commit gap', () => {
		const tasks = determineTasks(
			true,
			48, // commit gap would be priority 2
			{
				issuesOpen: 0,
				prsOpen: 0,
				prsMerged7d: 0,
				contributors14d: 0
			},
			[],
			85, // previousScore
			68 // currentScore (17 point drop)
		);

		expect(tasks[0].taskType).toBe('anomaly');
		expect(tasks[0].taskText).toContain('Health score dropped 17');
		expect(tasks[0].priority).toBe(0); // score drop is always top
		expect(tasks[1].taskType).toBe('commit');
	});

	it('generates dependency tasks for vulnerabilities', () => {
		const tasks = determineTasks(
			true,
			12,
			{
				issuesOpen: 0,
				prsOpen: 0,
				prsMerged7d: 0,
				contributors14d: 0
			},
			[],
			undefined,
			undefined,
			{ vulnerable: 3, deprecated: 1, majorOutdated: 0 }
		);

		const vulnTask = tasks.find((t) => t.taskType === 'dependency' && t.taskSource === 'dependency');
		expect(vulnTask).toBeDefined();
		expect(vulnTask!.taskText).toContain('3 vulnerable dependencies');
		expect(vulnTask!.staleKey).toBe('dep_vuln');

		const depTask = tasks.filter((t) => t.taskSource === 'dependency');
		expect(depTask).toHaveLength(2); // vuln + deprecated
	});

	it('generates README task when score is low', () => {
		const tasks = determineTasks(
			true,
			12,
			{
				issuesOpen: 0,
				prsOpen: 0,
				prsMerged7d: 0,
				contributors14d: 0
			},
			[],
			undefined,
			undefined,
			undefined,
			45,
			['Add a Contributing section', 'Add installation instructions']
		);

		const readmeTask = tasks.find((t) => t.taskType === 'readme');
		expect(readmeTask).toBeDefined();
		expect(readmeTask!.taskText).toContain('README needs work');
		expect(readmeTask!.taskText).toContain('45');
		expect(readmeTask!.taskText).toContain('Contributing section');
		expect(readmeTask!.staleKey).toBe('readme_low_40');
	});

	it('does not generate README task when score is >= 60', () => {
		const tasks = determineTasks(
			true,
			12,
			{
				issuesOpen: 0,
				prsOpen: 0,
				prsMerged7d: 0,
				contributors14d: 0
			},
			[],
			undefined,
			undefined,
			undefined,
			72,
			[]
		);

		expect(tasks.find((t) => t.taskType === 'readme')).toBeUndefined();
	});

	it('generates a PR task when open PRs have no recent merges', () => {
		const tasks = determineTasks(true, 6, {
			issuesOpen: 0,
			prsOpen: 5,
			prsMerged7d: 0,
			contributors14d: 0
		});
		expect(tasks).toHaveLength(1);
		expect(tasks[0].taskType).toBe('pr');
		expect(tasks[0].taskText).toContain('5 open PRs');
		expect(tasks[0].staleKey).toBe('prs_stale');
	});

	it('does not generate a PR task when there are recent merges', () => {
		const tasks = determineTasks(true, 6, {
			issuesOpen: 0,
			prsOpen: 5,
			prsMerged7d: 2,
			contributors14d: 0
		});
		expect(tasks.find((t) => t.taskType === 'pr')).toBeUndefined();
	});

	it('generates a contributor growth task when active contributors >= 3', () => {
		const tasks = determineTasks(true, 6, {
			issuesOpen: 0,
			prsOpen: 0,
			prsMerged7d: 0,
			contributors14d: 5
		});
		expect(tasks).toHaveLength(1);
		expect(tasks[0].taskType).toBe('general');
		expect(tasks[0].taskText).toContain('5 new contributors');
		expect(tasks[0].staleKey).toBe('contributors_growth');
	});

	it('score drop task fires even when momentum_drop anomaly exists', () => {
		// The anomaly generates its own task, but score drop is more specific
		// and should ALSO appear since it has a distinct staleKey
		const tasks = determineTasks(
			true,
			12,
			{
				issuesOpen: 0,
				prsOpen: 0,
				prsMerged7d: 0,
				contributors14d: 0
			},
			[
				{
					kind: 'momentum_drop',
					severity: 'high',
					title: 'Momentum drop warning',
					description: 'Health score fell.',
					recommendedAction: 'Review commits.'
				}
			],
			90,
			72 // 18 point drop
		);

		const scoreDropTask = tasks.find((t) => t.taskText.includes('Health score dropped'));
		expect(scoreDropTask).toBeDefined();
		expect(scoreDropTask!.priority).toBe(0);
	});

	it('tasks are sorted by priority ascending', () => {
		const tasks = determineTasks(
			false,
			48,
			{
				issuesOpen: 25,
				prsOpen: 3,
				prsMerged7d: 0,
				contributors14d: 4
			},
			[],
			80,
			60 // 20 point drop
		);

		for (let i = 1; i < tasks.length; i++) {
			expect(tasks[i].priority).toBeGreaterThanOrEqual(tasks[i - 1].priority);
		}
	});
});

// ── reconcileTasks tests ─────────────────────────────────────────────

describe('reconcileTasks', () => {
	it('completes tasks whose stale-key is no longer present', () => {
		const existing = [
			{ _id: 't1' as any, isCompleted: false, staleKey: 'commit_gap_48', taskType: 'commit' as const, taskText: '' },
			{ _id: 't2' as any, isCompleted: false, staleKey: 'issues_high', taskType: 'issue' as const, taskText: '' }
		];
		const currentStaleKeys = new Set(['commit_gap_48']); // issues condition is gone

		const result = reconcileTasks(existing as any, currentStaleKeys);
		expect(result.tasksToComplete).toHaveLength(1);
		expect(result.tasksToComplete[0]._id).toBe('t2');
		expect(result.tasksToKeep).toHaveLength(1);
		expect(result.tasksToKeep[0]._id).toBe('t1');
	});

	it('keeps tasks whose stale-key is still present', () => {
		const existing = [
			{ _id: 't1' as any, isCompleted: false, staleKey: 'commit_gap_48', taskType: 'commit' as const, taskText: '' }
		];
		const currentStaleKeys = new Set(['commit_gap_48']);

		const result = reconcileTasks(existing as any, currentStaleKeys);
		expect(result.tasksToComplete).toHaveLength(0);
		expect(result.tasksToKeep).toHaveLength(1);
	});

	it('does not complete already-completed tasks', () => {
		const existing = [
			{ _id: 't1' as any, isCompleted: true, staleKey: 'commit_gap_48', taskType: 'commit' as const, taskText: '' }
		];
		const currentStaleKeys = new Set<string>();

		const result = reconcileTasks(existing as any, currentStaleKeys);
		expect(result.tasksToComplete).toHaveLength(0);
		expect(result.tasksToKeep).toHaveLength(0);
	});

	it('handles legacy tasks without staleKey using fallback key mapping', () => {
		const existing = [
			// Legacy commit task — legacyStaleKey maps it to 'commit_gap_24'
			{ _id: 't1' as any, isCompleted: false, taskType: 'commit' as const, taskText: 'Push a commit' }
		];
		// Current condition is also commit gap (48h), but key is 'commit_gap_48'
		// Legacy task gets 'commit_gap_24' from fallback, which doesn't match
		const currentStaleKeys = new Set(['commit_gap_48']);

		const result = reconcileTasks(existing as any, currentStaleKeys);
		// Legacy task without staleKey gets completed since its fallback key doesn't match
		// This is expected — after one sync cycle, all tasks will have proper staleKeys
		expect(result.tasksToComplete).toHaveLength(1);
	});

	it('keeps legacy tasks when current condition matches their fallback key', () => {
		const existing = [
			{ _id: 't1' as any, isCompleted: false, taskType: 'commit' as const, taskText: 'Push a commit' }
		];
		// Legacy fallback key for commit tasks is 'commit_gap_24'
		const currentStaleKeys = new Set(['commit_gap_24']);

		const result = reconcileTasks(existing as any, currentStaleKeys);
		expect(result.tasksToKeep).toHaveLength(1);
	});
});
