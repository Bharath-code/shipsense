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

// Housekeeping: delete expired notifications (30-day TTL)
crons.daily(
	'cleanup-expired-notifications',
	{ hourUTC: 3, minuteUTC: 0 },
	internal.notifications.cleanupExpiredNotifications
);

export default crons;
