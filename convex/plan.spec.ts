import { describe, it, expect } from 'vitest';
import { PLAN_CONFIG, getPlanConfig } from './plan';
import type { PlanType } from './plan';

describe('plan config', () => {
	describe('PLAN_CONFIG', () => {
		it('free plan has 1 repo limit', () => {
			expect(PLAN_CONFIG.free.maxRepos).toBe(1);
		});

		it('indie plan has 5 repo limit', () => {
			expect(PLAN_CONFIG.indie.maxRepos).toBe(5);
		});

		it('builder plan has 50 repo limit', () => {
			expect(PLAN_CONFIG.builder.maxRepos).toBe(50);
		});

		it('repo limits are strictly increasing', () => {
			expect(PLAN_CONFIG.free.maxRepos)
				.toBeLessThan(PLAN_CONFIG.indie.maxRepos);
			expect(PLAN_CONFIG.indie.maxRepos)
				.toBeLessThan(PLAN_CONFIG.builder.maxRepos);
		});

		it('free plan has no email reports', () => {
			expect(PLAN_CONFIG.free.emailReports).toBe(false);
		});

		it('indie and builder plans have email reports', () => {
			expect(PLAN_CONFIG.indie.emailReports).toBe(true);
			expect(PLAN_CONFIG.builder.emailReports).toBe(true);
		});

		it('only builder plan has team support', () => {
			expect(PLAN_CONFIG.free.teamSupport).toBe(false);
			expect(PLAN_CONFIG.indie.teamSupport).toBe(false);
			expect(PLAN_CONFIG.builder.teamSupport).toBe(true);
		});

		it('all plans have priority tasks except free', () => {
			expect(PLAN_CONFIG.free.priorityTasks).toBe(false);
			expect(PLAN_CONFIG.indie.priorityTasks).toBe(true);
			expect(PLAN_CONFIG.builder.priorityTasks).toBe(true);
		});
	});

	describe('getPlanConfig', () => {
		it('returns the correct config for each plan', () => {
			const plans: PlanType[] = ['free', 'indie', 'builder'];
			for (const plan of plans) {
				const config = getPlanConfig(plan);
				expect(config).toEqual(PLAN_CONFIG[plan]);
			}
		});

		it('falls back to free config for unknown plan', () => {
			const config = getPlanConfig('unknown' as PlanType);
			expect(config).toEqual(PLAN_CONFIG.free);
		});

		it('falls back to free config for null/undefined', () => {
			expect(getPlanConfig(null as unknown as PlanType)).toEqual(PLAN_CONFIG.free);
			expect(getPlanConfig(undefined as unknown as PlanType)).toEqual(PLAN_CONFIG.free);
		});
	});

	describe('admin override parsing logic', () => {
		it('parses comma-separated admin IDs correctly', () => {
			const env = 'user1,user2,user3';
			const adminIds = env.split(',').map(id => id.trim()).filter(Boolean);
			expect(adminIds).toEqual(['user1', 'user2', 'user3']);
		});

		it('handles spaces around commas', () => {
			const env = 'user1, user2 , user3';
			const adminIds = env.split(',').map(id => id.trim()).filter(Boolean);
			expect(adminIds).toEqual(['user1', 'user2', 'user3']);
		});

		it('filters out empty entries from trailing commas', () => {
			const env = 'user1,user2,';
			const adminIds = env.split(',').map(id => id.trim()).filter(Boolean);
			expect(adminIds).toEqual(['user1', 'user2']);
		});

		it('returns empty array for empty string', () => {
			const env = '';
			const adminIds = env.split(',').map(id => id.trim()).filter(Boolean);
			expect(adminIds).toEqual([]);
		});

		it('returns empty array for undefined', () => {
			const env = undefined;
			const adminIds = (env as string | undefined)?.split(',').map(id => id.trim()).filter(Boolean) ?? [];
			expect(adminIds).toEqual([]);
		});

		it('correctly identifies admin user', () => {
			const adminIds = ['admin123', 'dev456'];
			const isAdmin = (userId: string) => adminIds.includes(userId);
			expect(isAdmin('admin123')).toBe(true);
			expect(isAdmin('dev456')).toBe(true);
			expect(isAdmin('regular789')).toBe(false);
		});

		it('returns false when admin list is empty', () => {
			const adminIds: string[] = [];
			const isAdmin = (userId: string) => adminIds.includes(userId);
			expect(isAdmin('anyone')).toBe(false);
		});
	});
});
