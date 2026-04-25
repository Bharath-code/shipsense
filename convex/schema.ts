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
		showFullDashboard: v.optional(v.boolean()),
		lastReportSentAt: v.optional(v.number()),
		lastDailyDigestSentAt: v.optional(v.number()),
		investorReportsUsedThisMonth: v.optional(v.number()),
		lastInvestorReportResetAt: v.optional(v.number()),
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
		slug: v.optional(v.string()), // e.g. "bharath-code-shipsense" for public URLs
		// Cumulative traffic tracking (starts from first sync, grows over time)
		cumulativeViews: v.optional(v.number()),
		cumulativeClones: v.optional(v.number())
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
		totalContributors: v.optional(v.number()), // All-time contributors (for cumulative funnel)
		commitGapHours: v.float64(),
		medianIssueResponseHours: v.float64(),
		forks: v.number(),
		readmeScore: v.optional(v.number()),
		readmeSuggestions: v.optional(v.array(v.string())),
		// Traffic data (collected daily)
		views: v.optional(v.number()),
		uniqueVisitors: v.optional(v.number()),
		clones: v.optional(v.number()),
		uniqueCloners: v.optional(v.number())
	})
		.index('by_repoId', ['repoId'])
		.index('by_repoId_capturedAt', ['repoId', 'capturedAt']),

	// Rolling referrer data (30 days, collected daily)
	repoReferrers: defineTable({
		repoId: v.id('repos'),
		capturedAt: v.number(),
		referrers: v.array(
			v.object({
				referrer: v.string(),
				count: v.number(),
				uniques: v.number()
			})
		),
		paths: v.array(
			v.object({
				path: v.string(),
				title: v.string(),
				count: v.number(),
				uniques: v.number()
			})
		),
		totalViews: v.number(),
		totalUniques: v.number(),
		totalClones: v.number(),
		totalCloners: v.number()
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
		isQuietDay: v.boolean(),
		trafficInsight: v.optional(v.string()),
		trafficVelocity: v.optional(v.string()),
		trafficConversion: v.optional(v.string()),
		topReferrer: v.optional(v.string())
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
			v.literal('momentum_drop'),
			v.literal('traffic_spike'),
			v.literal('referrer_spike'),
			v.literal('conversion_leak'),
			v.literal('stagnation')
		),
		severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
		title: v.string(),
		description: v.string(),
		recommendedAction: v.string(),
		metricValue: v.number(),
		baselineValue: v.number(),
		detectedAt: v.number(),
		isActive: v.boolean(),
		// For traffic anomalies - extra context
		metadata: v.optional(
			v.object({
				referrer: v.optional(v.string()),
				source: v.optional(v.string())
			})
		)
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
		issueNumber: v.optional(v.number()), // For issue tasks that support AI reply drafts
		urgency: v.optional(v.union(v.literal('critical'), v.literal('high'), v.literal('medium'), v.literal('low'))),
		staleKey: v.optional(v.string()),
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
			v.literal('traffic_alert'),
			v.literal('stagnation_nudge'),
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
		.index('by_userId_createdAt', ['userId', 'createdAt']),

	// Founding member claims (first 50 Indie subscribers get 50% off forever)
	foundingMembers: defineTable({
		userId: v.id('users'),
		claimedAt: v.number(),
		subscriptionId: v.optional(v.string())
	})
		.index('by_userId', ['userId']),

	// Watched repos for competitive intelligence (any public repo, not just owned)
	watchlistRepos: defineTable({
		userId: v.id('users'),
		owner: v.string(),
		name: v.string(),
		fullName: v.string(), // "owner/name"
		watchedAt: v.number(),
		// Cached metrics (updated daily)
		starsCount: v.optional(v.number()),
		starsLast7d: v.optional(v.number()),
		prsMerged7d: v.optional(v.number()),
		contributors14d: v.optional(v.number()),
		lastSyncedAt: v.optional(v.number())
	})
		.index('by_userId', ['userId'])
		.index('by_userId_fullName', ['userId', 'fullName'])
		.index('by_fullName', ['fullName']),

	// Email leads from landing page (pre-auth, for nurture sequence)
	emailLeads: defineTable({
		email: v.string(),
		repoUrl: v.string(), // Full GitHub URL they submitted
		reportGenerated: v.boolean(), // Whether we've generated + sent their free report
		reportUrl: v.optional(v.string()), // URL to their one-time health report
		source: v.optional(v.union(v.literal('scorecard'), v.literal('checklist'))), // Which lead magnet they came from
		nurtureDay2Sent: v.optional(v.boolean()), // Whether Day 2 nurture email was sent
		nurtureDay5Sent: v.optional(v.boolean()), // Whether Day 5 nurture email was sent
		createdAt: v.number(),
		convertedToUser: v.optional(v.boolean()) // Whether they later signed up via OAuth
	})
		.index('by_email', ['email'])
		.index('by_repoUrl', ['repoUrl'])
		.index('by_createdAt', ['createdAt'])
});
