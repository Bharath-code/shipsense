import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Collector Agent: runs every 6 hours (was hourly - reduced to avoid rate limits)
crons.interval('collect-repo-data', { hours: 6 }, internal.orchestrator.runDataCollection);

// Traffic Agent: runs daily (GitHub traffic data updates daily)
crons.daily(
	'collect-traffic-data',
	{ hourUTC: 9, minuteUTC: 0 },
	internal.orchestrator.runTrafficCollection
);

// Insight & Task Agents: run daily
crons.daily(
	'generate-insights',
	{ hourUTC: 8, minuteUTC: 0 },
	internal.orchestrator.runInsightGeneration
);

// Retention: send weekly reports every Sunday at 10am UTC
crons.weekly(
	'send-weekly-reports',
	{ dayOfWeek: 'sunday' as const, hourUTC: 10, minuteUTC: 0 },
	internal.orchestrator.sendWeeklyReports
);

// Delivery: send daily digests every weekday at 7am UTC
crons.daily(
	'send-daily-digests',
	{ hourUTC: 7, minuteUTC: 0 },
	internal.orchestrator.sendDailyDigests
);

// Slack: send daily briefs to Slack-connected users at 7:15am UTC
crons.daily(
	'send-slack-briefs',
	{ hourUTC: 7, minuteUTC: 15 },
	internal.slack.sendAllSlackBriefs
);

// Housekeeping: delete expired notifications (30-day TTL)
crons.daily(
	'cleanup-expired-notifications',
	{ hourUTC: 3, minuteUTC: 0 },
	internal.notifications.cleanupExpiredNotifications
);

// Watchlist: sync watched repos daily at 11am UTC
crons.daily(
	'sync-watchlist-repos',
	{ hourUTC: 11, minuteUTC: 0 },
	internal.watchlist.syncAllActiveUsers
);

// Nurture: send Day 2 quick wins email daily at 9am UTC
crons.daily(
	'nurture-day2',
	{ hourUTC: 9, minuteUTC: 0 },
	internal.emailNurture.runDay2Nurture
);

// Nurture: send Day 5 social proof email daily at 9am UTC
crons.daily(
	'nurture-day5',
	{ hourUTC: 9, minuteUTC: 30 },
	internal.emailNurture.runDay5Nurture
);

// Benchmarks: compute cohort percentiles daily at 6am UTC
// Runs before digest generation so benchmarks are fresh for daily briefs
crons.daily(
	'compute-cohort-benchmarks',
	{ hourUTC: 6, minuteUTC: 0 },
	internal.benchmarks.computeCohortBenchmarks
);

export default crons;
