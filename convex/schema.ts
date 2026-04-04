import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
	...authTables,

	// Extended user profile (linked to Convex auth user)
	userProfiles: defineTable({
		userId: v.id('users'),
		email: v.optional(v.string()),
		githubUsername: v.string(),
		githubAccessToken: v.string(),
		avatarUrl: v.optional(v.string()),
		plan: v.union(v.literal('free'), v.literal('indie'), v.literal('builder')),
		dodoCustomerId: v.optional(v.string()),
		dodoSubscriptionId: v.optional(v.string()),
		emailReportsEnabled: v.boolean(),
		lastReportSentAt: v.optional(v.number()),
		lastDailyDigestSentAt: v.optional(v.number()),
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
		isActive: v.boolean(),
		slug: v.optional(v.string()) // e.g. "bharath-code-shipsense" for public URLs
	})
		.index('by_userId', ['userId'])
		.index('by_userId_isActive', ['userId', 'isActive'])
		.index('by_githubRepoId', ['githubRepoId'])
		.index('by_slug', ['slug']),

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
		forks: v.number(),
		readmeScore: v.optional(v.number()),
		readmeSuggestions: v.optional(v.array(v.string()))
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

	// Persisted daily digest summaries for habit-forming check-ins
	repoDailyDigests: defineTable({
		repoId: v.id('repos'),
		generatedAt: v.number(),
		summary: v.string(),
		changeSummary: v.string(),
		topRisk: v.string(),
		topWin: v.string(),
		recommendedAction: v.string(),
		recommendedActionSource: v.union(
			v.literal('anomaly'),
			v.literal('trend'),
			v.literal('dependency'),
			v.literal('readme'),
			v.literal('hygiene')
		),
		recommendedActionImpact: v.string(),
		isQuietDay: v.boolean()
	})
		.index('by_repoId', ['repoId'])
		.index('by_repoId_generatedAt', ['repoId', 'generatedAt']),

	// Dependency monitoring results from repository manifests
	repoDependencies: defineTable({
		repoId: v.id('repos'),
		name: v.string(),
		ecosystem: v.union(v.literal('npm'), v.literal('pypi')),
		manifestPath: v.string(),
		currentRequirement: v.string(),
		currentVersion: v.string(),
		latestVersion: v.optional(v.string()),
		isOutdated: v.boolean(),
		outdatedType: v.union(
			v.literal('none'),
			v.literal('patch'),
			v.literal('minor'),
			v.literal('major'),
			v.literal('unknown')
		),
		isDeprecated: v.boolean(),
		deprecationMessage: v.optional(v.string()),
		hasVulnerability: v.boolean(),
		vulnerabilitySeverity: v.union(
			v.literal('none'),
			v.literal('low'),
			v.literal('moderate'),
			v.literal('high'),
			v.literal('critical'),
			v.literal('unknown')
		),
		vulnerabilitySummary: v.optional(v.string()),
		lastCheckedAt: v.number()
	})
		.index('by_repoId', ['repoId'])
		.index('by_repoId_ecosystem', ['repoId', 'ecosystem'])
		.index('by_repoId_vulnerabilitySeverity', ['repoId', 'vulnerabilitySeverity']),

	// Detected repository anomalies and momentum signals
	repoAnomalies: defineTable({
		repoId: v.id('repos'),
		kind: v.union(
			v.literal('star_spike'),
			v.literal('contributor_spike'),
			v.literal('momentum_drop')
		),
		severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
		title: v.string(),
		description: v.string(),
		recommendedAction: v.string(),
		metricValue: v.number(),
		baselineValue: v.number(),
		detectedAt: v.number(),
		isActive: v.boolean()
	})
		.index('by_repoId', ['repoId'])
		.index('by_repoId_isActive', ['repoId', 'isActive'])
		.index('by_repoId_detectedAt', ['repoId', 'detectedAt']),

	// Dedupeable share nudges for notable wins after sync
	repoSharePrompts: defineTable({
		repoId: v.id('repos'),
		userId: v.id('users'),
		kind: v.union(
			v.literal('star_spike'),
			v.literal('best_week'),
			v.literal('momentum_recovered'),
			v.literal('streak_milestone'),
			v.literal('score_milestone'),
			v.literal('contributor_milestone'),
			v.literal('longest_streak'),
			v.literal('best_month')
		),
		title: v.string(),
		message: v.string(),
		shareText: v.string(),
		shareUrl: v.string(),
		fingerprint: v.string(),
		isActive: v.boolean(),
		dismissedAt: v.optional(v.number()),
		createdAt: v.number()
	})
		.index('by_repoId_isActive', ['repoId', 'isActive'])
		.index('by_userId_createdAt', ['userId', 'createdAt'])
		.index('by_repoId_fingerprint', ['repoId', 'fingerprint']),

	// Actionable tasks (deterministic rules engine)
	repoTasks: defineTable({
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
	}).index('by_repoId', ['repoId']),

	// In-app notifications
	notifications: defineTable({
		userId: v.id('users'),
		type: v.union(
			v.literal('score_drop'),
			v.literal('streak_break'),
			v.literal('streak_milestone'),
			v.literal('sync_complete'),
			v.literal('weekly_report'),
			v.literal('new_task'),
			v.literal('dependency_alert'),
			v.literal('anomaly_alert'),
			v.literal('win')
		),
		title: v.string(),
		message: v.string(),
		repoId: v.optional(v.id('repos')),
		repoName: v.optional(v.string()),
		read: v.boolean(),
		createdAt: v.number()
	})
		.index('by_userId_read', ['userId', 'read'])
		.index('by_userId_createdAt', ['userId', 'createdAt'])
});
