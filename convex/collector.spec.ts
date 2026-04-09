import { describe, it, expect } from 'vitest';
import { processMergedPRs, processCommitGap, extractLatestCommitDate, countUniqueAuthors14d } from './collector';

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
			const commits = [{
				committedDate: new Date(tenHoursAgo).toISOString(),
				author: {
					name: 'Test User',
					email: 'test@example.com',
					user: { login: 'testuser' }
				}
			}];

			expect(processCommitGap(commits, now)).toBe(10);
		});
	});

	describe('extractLatestCommitDate', () => {
		it('returns null when no commits exist', () => {
			expect(extractLatestCommitDate([])).toBeNull();
		});

		it('returns a normalized YYYY-MM-DD string for the latest commit', () => {
			const commit = {
				committedDate: '2026-03-31T15:42:10.000Z',
				author: {
					name: 'Test User',
					email: 'test@example.com',
					user: { login: 'testuser' }
				}
			};
			expect(extractLatestCommitDate([commit])).toBe('2026-03-31');
		});
	});

	describe('countUniqueAuthors14d', () => {
		it('returns 0 when no commits exist', () => {
			expect(countUniqueAuthors14d([], now)).toBe(0);
		});

		it('counts unique authors from commits in last 14 days', () => {
			const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
			const commits = [
				{
					committedDate: new Date(tenDaysAgo).toISOString(),
					author: {
						name: 'Alice',
						email: 'alice@example.com',
						user: { login: 'alice' }
					}
				},
				{
					committedDate: new Date(tenDaysAgo).toISOString(),
					author: {
						name: 'Bob',
						email: 'bob@example.com',
						user: { login: 'bob' }
					}
				},
				{
					committedDate: new Date(tenDaysAgo).toISOString(),
					author: {
						name: 'Alice',
						email: 'alice@example.com',
						user: { login: 'alice' }
					}
				}
			];

			expect(countUniqueAuthors14d(commits, now)).toBe(2); // Alice and Bob
		});

		it('ignores commits older than 14 days', () => {
			const twentyDaysAgo = now - 20 * 24 * 60 * 60 * 1000;
			const commits = [
				{
					committedDate: new Date(twentyDaysAgo).toISOString(),
					author: {
						name: 'Old Contributor',
						email: 'old@example.com',
						user: { login: 'oldcontributor' }
					}
				}
			];

			expect(countUniqueAuthors14d(commits, now)).toBe(0);
		});

		it('uses email as fallback when user.login is null', () => {
			const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
			const commits = [
				{
					committedDate: new Date(tenDaysAgo).toISOString(),
					author: {
						name: 'No GitHub User',
						email: 'nouser@example.com',
						user: null
					}
				}
			];

			expect(countUniqueAuthors14d(commits, now)).toBe(1);
		});

		it('handles mixed commits with and without GitHub users', () => {
			const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
			const commits = [
				{
					committedDate: new Date(tenDaysAgo).toISOString(),
					author: {
						name: 'User With Login',
						email: 'withlogin@example.com',
						user: { login: 'haslogin' }
					}
				},
				{
					committedDate: new Date(tenDaysAgo).toISOString(),
					author: {
						name: 'User Without Login',
						email: 'nouser@example.com',
						user: null
					}
				}
			];

			expect(countUniqueAuthors14d(commits, now)).toBe(2);
		});

		it('deduplicates by GitHub login when available', () => {
			const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
			const commits = [
				{
					committedDate: new Date(tenDaysAgo).toISOString(),
					author: {
						name: 'Same User Different Email',
						email: 'email1@example.com',
						user: { login: 'sameuser' }
					}
				},
				{
					committedDate: new Date(tenDaysAgo).toISOString(),
					author: {
						name: 'Same User Different Email',
						email: 'email2@example.com',
						user: { login: 'sameuser' }
					}
				}
			];

			expect(countUniqueAuthors14d(commits, now)).toBe(1);
		});
	});
});
