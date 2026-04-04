import {
	internalAction,
	internalMutation,
	internalQuery,
	type ActionCtx
} from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { deriveGrowthMoments, type GrowthMoment } from './dashboard';
import type { Doc, Id } from './_generated/dataModel';
import type { TaskSource } from './taskGenerator';

type DependencySummary = {
	total: number;
	outdated: number;
	majorOutdated: number;
	deprecated: number;
	vulnerable: number;
};

type DailyDigestRecord = {
	summary: string;
	changeSummary: string;
	topRisk: string;
	topWin: string;
	recommendedAction: string;
	recommendedActionSource: TaskSource;
	recommendedActionImpact: string;
	isQuietDay: boolean;
};

type DailyDigestInput = {
	repoName: string;
	latestSnapshot: Pick<
		Doc<'repoSnapshots'>,
		| 'starsLast7d'
		| 'contributors14d'
		| 'commitGapHours'
		| 'readmeSuggestions'
		| 'readmeScore'
		| 'prsMerged7d'
	>;
	previousSnapshot: Pick<
		Doc<'repoSnapshots'>,
		'starsLast7d' | 'contributors14d' | 'commitGapHours' | 'prsMerged7d'
	> | null;
	latestScore: Pick<Doc<'repoScores'>, 'healthScore'> | null;
	previousScore?: number;
	insight: Pick<Doc<'repoInsights'>, 'summary' | 'risk' | 'actions'> | null;
	topTask: Pick<Doc<'repoTasks'>, 'taskText' | 'taskSource' | 'expectedImpact'> | null;
	topAnomaly: Pick<
		Doc<'repoAnomalies'>,
		'title' | 'description' | 'recommendedAction' | 'severity'
	> | null;
	growthMoments: GrowthMoment[];
	dependencySummary: DependencySummary;
};

function describeChange(input: DailyDigestInput): string {
	if (!input.previousSnapshot) {
		return `This is one of the first snapshots for ${input.repoName}, so today's digest is establishing a baseline for future daily comparisons.`;
	}

	const changes: string[] = [];
	const currentScore = input.latestScore?.healthScore;
	if (currentScore !== undefined && currentScore !== null && input.previousScore !== undefined) {
		const scoreDelta = currentScore - input.previousScore;
		if (scoreDelta >= 3) changes.push(`Health score rose ${scoreDelta} points.`);
		else if (scoreDelta <= -3) changes.push(`Health score fell ${Math.abs(scoreDelta)} points.`);
	}

	const starDelta = input.latestSnapshot.starsLast7d - input.previousSnapshot.starsLast7d;
	if (starDelta > 0) changes.push(`Weekly star velocity improved by ${starDelta}.`);
	else if (starDelta < 0) changes.push(`Weekly star velocity cooled by ${Math.abs(starDelta)}.`);

	const contributorDelta =
		input.latestSnapshot.contributors14d - input.previousSnapshot.contributors14d;
	if (contributorDelta > 0) changes.push(`Contributor activity increased by ${contributorDelta}.`);
	else if (contributorDelta < 0)
		changes.push(`Contributor activity is down by ${Math.abs(contributorDelta)}.`);

	const mergeDelta = input.latestSnapshot.prsMerged7d - input.previousSnapshot.prsMerged7d;
	if (mergeDelta > 0) changes.push(`More pull requests were merged this week.`);
	else if (mergeDelta < 0) changes.push(`Merged pull request throughput slowed.`);

	const commitGapDelta =
		input.latestSnapshot.commitGapHours - input.previousSnapshot.commitGapHours;
	if (commitGapDelta <= -12) changes.push('Commit freshness improved noticeably.');
	else if (commitGapDelta >= 12) changes.push('Recent commit activity slowed.');

	if (changes.length === 0) {
		return 'No major movement since the last snapshot. This looks like a steady maintenance day.';
	}

	return changes.slice(0, 3).join(' ');
}

function inferFallbackAction(input: DailyDigestInput): {
	action: string;
	source: TaskSource;
	impact: string;
} {
	if (input.dependencySummary.vulnerable > 0) {
		return {
			action: `Review the ${input.dependencySummary.vulnerable} vulnerable dependenc${input.dependencySummary.vulnerable === 1 ? 'y' : 'ies'} and upgrade the highest-risk package first.`,
			source: 'dependency',
			impact: 'Reduces avoidable risk and keeps production trust high while the repo grows.'
		};
	}

	if ((input.latestSnapshot.readmeSuggestions?.length ?? 0) > 0) {
		return {
			action:
				input.latestSnapshot.readmeSuggestions?.[0] ??
				'Improve your README guidance for new visitors.',
			source: 'readme',
			impact:
				'Improves onboarding clarity so interested visitors are more likely to try or contribute.'
		};
	}

	if (input.topAnomaly) {
		return {
			action: input.topAnomaly.recommendedAction,
			source: 'anomaly',
			impact: 'Helps you respond quickly to the strongest live signal in the repo.'
		};
	}

	if (input.insight?.actions?.[0]) {
		return {
			action: input.insight.actions[0],
			source: 'trend',
			impact: "Keeps your next move aligned with the repo's current momentum signals."
		};
	}

	return {
		action: 'Ship one small improvement today and sync again to keep the feedback loop active.',
		source: 'hygiene',
		impact: 'Creates fresh signals for ShipSense to analyze and helps maintain visible momentum.'
	};
}

export function buildDailyDigest(input: DailyDigestInput): DailyDigestRecord {
	const changeSummary = describeChange(input);
	const quietByChanges = changeSummary.startsWith('No major movement');

	const topRisk = input.topAnomaly
		? input.topAnomaly.description
		: input.dependencySummary.vulnerable > 0
			? `${input.dependencySummary.vulnerable} vulnerable dependenc${input.dependencySummary.vulnerable === 1 ? 'y needs' : 'ies need'} review.`
			: input.dependencySummary.majorOutdated > 0
				? `${input.dependencySummary.majorOutdated} major dependency update${input.dependencySummary.majorOutdated === 1 ? ' is' : 's are'} waiting and could create upgrade debt.`
				: (input.latestSnapshot.readmeSuggestions?.length ?? 0) > 0
					? `README quality still needs work: ${input.latestSnapshot.readmeSuggestions?.[0]}`
					: input.insight?.risk && input.insight.risk !== 'low'
						? input.insight.summary
						: 'No urgent risk is standing out right now.';

	const topWin =
		input.growthMoments[0]?.description ??
		(input.latestSnapshot.starsLast7d > 0
			? `${input.repoName} picked up +${input.latestSnapshot.starsLast7d} stars this week.`
			: input.latestSnapshot.contributors14d >= 2
				? `${input.repoName} has ${input.latestSnapshot.contributors14d} active contributors in the last 14 days.`
				: input.latestSnapshot.commitGapHours <= 24
					? 'Recent commits are keeping the repo visibly active.'
					: 'Quiet day, but the repo is stable and ready for the next push.');

	const fallbackAction = inferFallbackAction(input);
	const recommendedAction = input.topTask?.taskText ?? fallbackAction.action;
	const recommendedActionSource = input.topTask?.taskSource ?? fallbackAction.source;
	const recommendedActionImpact = input.topTask?.expectedImpact ?? fallbackAction.impact;

	const isQuietDay =
		quietByChanges &&
		!input.topAnomaly &&
		input.growthMoments.length === 0 &&
		input.dependencySummary.vulnerable === 0 &&
		input.dependencySummary.majorOutdated === 0;

	const summary = isQuietDay
		? 'Quiet day: no major shifts, but the repo is stable and ready for one deliberate improvement.'
		: input.topAnomaly
			? `${input.topAnomaly.title}. ${topWin}`
			: `${topWin} ${topRisk}`;

	return {
		summary,
		changeSummary,
		topRisk,
		topWin,
		recommendedAction,
		recommendedActionSource,
		recommendedActionImpact,
		isQuietDay
	};
}

export const getLatestDigest = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoDailyDigests')
			.withIndex('by_repoId_generatedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.first();
	}
});

export const getRecentScoresForDigest = internalQuery({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await ctx.db
			.query('repoScores')
			.withIndex('by_repoId_calculatedAt', (q) => q.eq('repoId', repoId))
			.order('desc')
			.take(5);
	}
});

export const saveDailyDigest = internalMutation({
	args: {
		repoId: v.id('repos'),
		digest: v.object({
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
	},
	handler: async (ctx, { repoId, digest }) => {
		await ctx.db.insert('repoDailyDigests', {
			repoId,
			generatedAt: Date.now(),
			...digest
		});
	}
});

async function generateDigestForRepo(ctx: ActionCtx, repoId: Id<'repos'>) {
	const repo = await ctx.runQuery(internal.repos.getRepoById, { repoId });
	if (!repo) return null;

	const [
		latestSnapshot,
		previousSnapshot,
		latestScore,
		recentScores,
		recentSnapshots,
		insight,
		anomalies,
		tasks,
		dependencySummary
	] = await Promise.all([
		ctx.runQuery(internal.collector.getLatestSnapshot, { repoId }),
		ctx.runQuery(internal.collector.getSnapshotBeforeLatest, { repoId }),
		ctx.runQuery(internal.scorer.getLatestScore, { repoId }),
		ctx.runQuery(internal.dailyDigests.getRecentScoresForDigest, { repoId }),
		ctx.runQuery(internal.collector.getRecentSnapshots, { repoId }),
		ctx.runQuery(internal.dashboard.getRepoInsightsForReport, { repoId }),
		ctx.runQuery(internal.anomalies.listActiveRepoAnomalies, { repoId }),
		ctx.runQuery(internal.taskGenerator.getOpenTasks, { repoId }),
		ctx.runQuery(internal.dependencies.getRepoDependencySummary, { repoId })
	]);

	if (!latestSnapshot) return null;

	const growthMoments = deriveGrowthMoments({
		starsLast7d: latestSnapshot.starsLast7d,
		scoreHistory: recentScores
			.slice()
			.reverse()
			.map((score) => ({ healthScore: score.healthScore })),
		recentSnapshots: recentSnapshots.map((snapshot) => ({ starsLast7d: snapshot.starsLast7d }))
	});

	const sortedTasks = tasks.slice().sort((a, b) => a.priority - b.priority);
	const digest = buildDailyDigest({
		repoName: repo.name,
		latestSnapshot,
		previousSnapshot,
		latestScore,
		previousScore: latestScore?.previousScore,
		insight,
		topTask: sortedTasks[0] ?? null,
		topAnomaly: anomalies[0] ?? null,
		growthMoments,
		dependencySummary
	});

	await ctx.runMutation(internal.dailyDigests.saveDailyDigest, { repoId, digest });
	return digest;
}

export const generateRepoDailyDigest = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		return await generateDigestForRepo(ctx, repoId);
	}
});

export const generateAllDailyDigests = internalAction({
	args: {},
	handler: async (ctx) => {
		const repos = await ctx.runQuery(internal.repos.listAllActiveRepos);
		for (const repo of repos) {
			await generateDigestForRepo(ctx, repo._id);
		}
	}
});
