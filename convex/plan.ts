import { v } from 'convex/values';
import { query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export type PlanType = 'free' | 'indie' | 'builder';

export interface PlanConfig {
	maxRepos: number;
	aiModel: 'gemini-3-flash-preview' | 'gemini-2.0-pro';
	emailReports: boolean;
	priorityTasks: boolean;
	teamSupport: boolean;
}

export const PLAN_CONFIG: Record<PlanType, PlanConfig> = {
	free: {
		maxRepos: 1,
		aiModel: 'gemini-3-flash-preview',
		emailReports: false,
		priorityTasks: false,
		teamSupport: false
	},
	indie: {
		maxRepos: 5,
		aiModel: 'gemini-3-flash-preview',
		emailReports: true,
		priorityTasks: true,
		teamSupport: false
	},
	builder: {
		maxRepos: 50,
		aiModel: 'gemini-3-flash-preview',
		emailReports: true,
		priorityTasks: true,
		teamSupport: true
	}
};

export function getPlanConfig(plan: PlanType): PlanConfig {
	return PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
}

/**
 * Returns the plan config for the current user's plan.
 * Admin users always get Builder access during development.
 */
export const getMyPlanConfig = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return getPlanConfig('free');

		// Admin override
		const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()).filter(Boolean) ?? [];
		if (adminIds.includes(userId)) return getPlanConfig('builder');

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		return getPlanConfig(profile?.plan as PlanType ?? 'free');
	}
});
