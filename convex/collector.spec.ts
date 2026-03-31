import { describe, it, expect } from 'vitest';
import { processMergedPRs, processCommitGap, extractLatestCommitDate } from './collector';

describe('collector parsing logic', () => {
	const now = 1700000000000; // Mock reference time

	describe('processMergedPRs', () => {
		it('returns 0 if no nodes exist', () => {
			expect(processMergedPRs([], now)).toBe(0);
		});

		it('counts only PRs merged within the last 7 days', () => {
			const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;
			const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

			const prs = [
				{ updatedAt: new Date(sixDaysAgo).toISOString() },
				{ updatedAt: new Date(eightDaysAgo).toISOString() }
			];

			expect(processMergedPRs(prs, now)).toBe(1);
		});
	});

	describe('processCommitGap', () => {
		it('returns 30 days in hours if no commits exist', () => {
			expect(processCommitGap([], now)).toBe(24 * 30);
		});

		it('calculates the hours difference from reference time correctly', () => {
			const tenHoursAgo = now - 10 * 60 * 60 * 1000;
			const commits = [{ committedDate: new Date(tenHoursAgo).toISOString() }];

			expect(processCommitGap(commits, now)).toBe(10);
		});
	});

	describe('extractLatestCommitDate', () => {
		it('returns null when no commits exist', () => {
			expect(extractLatestCommitDate([])).toBeNull();
		});

		it('returns a normalized YYYY-MM-DD string for the latest commit', () => {
			expect(
				extractLatestCommitDate([{ committedDate: '2026-03-31T15:42:10.000Z' }])
			).toBe('2026-03-31');
		});
	});
});
