import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Collector Agent: runs every 6 hours (was hourly - reduced to avoid rate limits)
crons.interval('collect-repo-data', { hours: 6 }, internal.orchestrator.runDataCollection);

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

export default crons;
