import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
	...authTables,

	// Extended user profile (linked to Convex auth user)
	userProfiles: defineTable({
		userId: v.id('users'),
		githubUsername: v.string(),
		githubAccessToken: v.string(),
		avatarUrl: v.optional(v.string()),
		plan: v.union(v.literal('free'), v.literal('indie'), v.literal('builder')),
		dodoCustomerId: v.optional(v.string()),
		dodoSubscriptionId: v.optional(v.string()),
		emailReportsEnabled: v.boolean(),
		createdAt: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_dodoCustomerId', ['dodoCustomerId']),

	// Connected repositories
	repos: defineTable({
		userId: v.id('users'),
		githubRepoId: v.number(),
		owner: v.string(),
		name: v.string(),
		fullName: v.string(),
		description: v.optional(v.string()),
		language: v.optional(v.string()),
		starsCount: v.number(),
		forksCount: v.number(),
		isPrivate: v.boolean(),
		lastCommitAt: v.optional(v.number()),
		connectedAt: v.number(),
		lastSyncedAt: v.optional(v.number()),
		lastError: v.optional(v.string()),
		isActive: v.boolean()
	})
		.index('by_userId', ['userId'])
		.index('by_userId_isActive', ['userId', 'isActive'])
		.index('by_githubRepoId', ['githubRepoId']),

	// Historical metric snapshots (collected every 6 hours)
	repoSnapshots: defineTable({
		repoId: v.id('repos'),
		capturedAt: v.number(),
		stars: v.number(),
		starsLast7d: v.number(),
		issuesOpen: v.number(),
		prsOpen: v.number(),
		prsMerged7d: v.number(),
		contributors14d: v.number(),
		commitGapHours: v.float64(),
		medianIssueResponseHours: v.float64(),
		forks: v.number()
	})
		.index('by_repoId', ['repoId'])
		.index('by_repoId_capturedAt', ['repoId', 'capturedAt']),

	// Computed health scores (calculated after each snapshot)
	repoScores: defineTable({
		repoId: v.id('repos'),
		calculatedAt: v.number(),
		healthScore: v.number(),
		starScore: v.number(),
		commitScore: v.number(),
		issueScore: v.number(),
		prScore: v.number(),
		contributorScore: v.number(),
		scoreExplanation: v.string(),
		trend: v.union(v.literal('up'), v.literal('down'), v.literal('stable')),
		previousScore: v.optional(v.number())
	})
		.index('by_repoId', ['repoId'])
		.index('by_repoId_calculatedAt', ['repoId', 'calculatedAt']),

	// Cached LLM-generated insights (from Gemini)
	repoInsights: defineTable({
		repoId: v.id('repos'),
		generatedAt: v.number(),
		summary: v.string(),
		risk: v.string(),
		actions: v.array(v.string()),
		modelUsed: v.string()
	})
		.index('by_repoId', ['repoId'])
		.index('by_repoId_generatedAt', ['repoId', 'generatedAt']),

	// Actionable tasks (deterministic rules engine)
	repoTasks: defineTable({
		repoId: v.id('repos'),
		userId: v.id('users'),
		taskText: v.string(),
		taskType: v.union(
			v.literal('commit'),
			v.literal('issue'),
			v.literal('pr'),
			v.literal('general')
		),
		priority: v.number(),
		isCompleted: v.boolean(),
		createdAt: v.number(),
		completedAt: v.optional(v.number())
	})
		.index('by_repoId', ['repoId'])
		.index('by_userId', ['userId'])
		.index('by_repoId_isCompleted', ['repoId', 'isCompleted']),

	// Shipping streaks (gamification)
	shipStreaks: defineTable({
		repoId: v.id('repos'),
		currentStreak: v.number(),
		longestStreak: v.number(),
		lastCommitDate: v.string(), // "YYYY-MM-DD"
		streakBrokenAt: v.optional(v.number())
	}).index('by_repoId', ['repoId'])
});
