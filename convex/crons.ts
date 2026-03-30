import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Collector Agent: runs every 6 hours
crons.hourly('collect-repo-data', { minuteUTC: 0 }, internal.orchestrator.runDataCollection);

// Insight & Task Agents: run daily
crons.daily(
	'generate-insights',
	{ hourUTC: 8, minuteUTC: 0 },
	internal.orchestrator.runInsightGeneration
);

export default crons;
