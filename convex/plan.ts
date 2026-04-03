import { v } from 'convex/values';

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
		maxRepos: 10,
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
	return PLAN_CONFIG[plan] || PLAN_CONFIG.free;
}
