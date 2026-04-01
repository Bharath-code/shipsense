export const TOOLTIPS = {
	HEALTH_SCORE:
		'Composite score (0-100) based on stars, forks, recent commits, issue response time, and community engagement.',
	STARS: 'Total stars on GitHub. Indicates project popularity and community interest.',
	FORKS: 'Total forks. Shows how many developers have copied your project.',
	WATCHERS: 'Users watching this repository for notifications.',
	STREAK: 'Consecutive days with at least one commit. Measures consistent shipping.',
	MOMENTUM: 'Change in health score compared to 7 days ago. Positive means improving.',
	CONTRIBUTORS_14D: 'Unique contributors in the last 14 days. Shows active collaboration.',
	ISSUE_RESPONSE: 'Median hours until first response to new issues. Lower is better.',
	LAST_SYNC: 'Last time ShipSense fetched fresh data from GitHub.',
	SYNC_STATUS: 'Whether the latest sync completed successfully or has errors.',
	AI_SUMMARY: 'AI-generated analysis of your repository health and growth patterns.',
	RECOMMENDED_ACTIONS: 'AI-suggested next steps to improve your repository health.'
} as const;

export const LABELS = {
	// Navigation
	DASHBOARD: 'Dashboard',
	SETTINGS: 'Settings',
	CONNECT_REPO: 'Connect Repository',
	DISCONNECT: 'Disconnect',
	SYNC_NOW: 'Sync Now',
	SYNCING: 'Syncing...',
	DISCONNECTING: 'Disconnecting...',

	// Repo details
	SHARE_GROWTH_CARD: 'Share Growth Card',
	DOWNLOAD_IMAGE: 'Download Image',
	SHARE_TO_TWITTER: 'Share to Twitter',
	DOWNLOADED: 'Downloaded!',
	SHARED: 'Shared!',

	// Cards
	AI_INSIGHTS: 'AI Insights',
	INTELLIGENCE_LAYER: 'Intelligence Layer',
	PRIORITY_DELTA: 'Priority Delta',
	DETERMININISTIC_STEPS: 'Deterministic actionable steps',
	SHIP_STREAK: 'Ship Streak',
	MOMENTUM_GRAPH: 'Momentum Graph',

	// Status
	NO_DATA_YET: 'No data yet',
	PUSH_CODE_IGNITE: 'Push code to ignite your streak.',
	ALL_CLEAR: 'All clear! No pending tasks.',
	LIVE_SYNC: 'Live Sync',
	SYNC_ERROR: 'Sync Error',

	// Metrics
	STARS: 'Stars',
	FORKS: 'Forks',
	WATCHERS: 'Watchers',

	// Actions
	CLOSE: 'Close',
	RETRY: 'Retry',
	VIEW_ON_GITHUB: 'View on GitHub',
	REFRESH_LIST: 'Refresh list',

	// Empty states
	NO_REPOS: 'Ready to launch your growth?',
	NO_REPOS_DESC:
		'Connect any public or private GitHub repo to unlock AI-powered health scores, automated insights, and streak tracking — all in one dashboard.',
	NO_INSIGHTS: 'No insights available yet',
	NO_INSIGHTS_DESC: 'Keep shipping to unlock AI-powered recommendations.',

	// Settings
	EMAIL_NOTIFICATIONS: 'Email Notifications',
	WEEKLY_DIGEST: 'Weekly Digest',
	WEEKLY_DIGEST_DESC: 'Get a summary of your repo health and growth metrics every Monday.',
	LAST_REPORT: 'Last report sent',

	// Errors
	ERROR_LOADING: 'Error loading data',
	ERROR_SYNC: 'Sync failed',
	ERROR_CONNECT: 'Failed to connect repository',

	// Toast notifications
	TOAST_FIRST_SYNC_TITLE: '🎉 Your first health snapshot!',
	TOAST_FIRST_SYNC_MESSAGE: 'Share your starter card and show your OSS journey.',
	TOAST_SHARE_NOW: 'Share Starter Card',
	TOAST_LATER: 'Later'
} as const;

export const MESSAGES = {
	DISCONNECT_CONFIRM: (name: string) =>
		`Disconnect ${name}? ShipSense will stop tracking this repository.`
} as const;
