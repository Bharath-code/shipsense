import { describe, it, expect } from 'vitest';
import { determineTasks } from './taskGenerator';

describe('determineTasks', () => {
	it('generates a commit task if commit gap is greater than 24', () => {
		const tasks = determineTasks(true, 48, {
			issuesOpen: 0,
			prsOpen: 0,
			prsMerged7d: 0,
			contributors14d: 0
		});
		expect(tasks).toHaveLength(1);
		expect(tasks[0].taskType).toBe('commit');
		expect(tasks[0].priority).toBe(1);
	});

	it('generates an issue task if repo is public', () => {
		const tasks = determineTasks(false, 12, {
			issuesOpen: 0,
			prsOpen: 0,
			prsMerged7d: 0,
			contributors14d: 0
		});
		expect(tasks).toHaveLength(1);
		expect(tasks[0].taskType).toBe('issue');
		expect(tasks[0].priority).toBe(2);
	});

	it('generates both tasks if public and commit gap > 24', () => {
		const tasks = determineTasks(false, 48, {
			issuesOpen: 0,
			prsOpen: 0,
			prsMerged7d: 0,
			contributors14d: 0
		});
		expect(tasks).toHaveLength(2);
		expect(tasks.some((t) => t.taskType === 'commit')).toBe(true);
		expect(tasks.some((t) => t.taskType === 'issue')).toBe(true);
	});

	it('generates no tasks if private and commit gap <= 24', () => {
		const tasks = determineTasks(true, 12, {
			issuesOpen: 0,
			prsOpen: 0,
			prsMerged7d: 0,
			contributors14d: 0
		});
		expect(tasks).toHaveLength(0);
	});
});
