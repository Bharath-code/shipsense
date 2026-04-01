import { internalAction, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getPlanConfig, type PlanType } from './plan';

export function buildInsightPrompt(repoName: string, repoDescription: string, metrics: any) {
	return `You are a growth advisor for indie hackers. 
    Analyze this repository: ${repoName} (${repoDescription})
    Metrics: ${JSON.stringify(metrics)}
    Provide a JSON response with:
    { "summary": "short text", "risk": "low/medium/high", "actions": ["action1", "action2"] }`;
}

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const generateInsights = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		console.log('[InsightGenerator] Starting for repo:', repoId);

		const repo = await ctx.runQuery(internal.repos.getRepoById, { repoId });
		if (!repo) {
			console.log('[InsightGenerator] Repo not found');
			return;
		}

		const plan = (await ctx.runQuery(internal.billing.getMyPlan, {
			userId: repo.userId
		})) as PlanType;
		const planConfig = getPlanConfig(plan);

		const latestSnapshot = await ctx.runQuery(internal.collector.getLatestSnapshot, { repoId });
		const latestScore = await ctx.runQuery(internal.scorer.getLatestScore, { repoId });

		if (!latestSnapshot) {
			console.log('[InsightGenerator] No snapshot found, skipping');
			return;
		}

		const metrics = {
			stars: latestSnapshot.stars,
			forks: latestSnapshot.forks,
			openIssues: latestSnapshot.issuesOpen,
			prsOpen: latestSnapshot.prsOpen,
			prsMerged7d: latestSnapshot.prsMerged7d,
			contributors14d: latestSnapshot.contributors14d,
			commitGapHours: latestSnapshot.commitGapHours,
			healthScore: latestScore?.healthScore ?? null,
			scoreExplanation: latestScore?.scoreExplanation ?? null
		};

		console.log('[InsightGenerator] Metrics:', JSON.stringify(metrics));

		const prompt = buildInsightPrompt(repo.name, repo.description || 'No description', metrics);

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			console.warn('[InsightGenerator] GEMINI_API_KEY not set, saving fallback insight');
			await ctx.runMutation(internal.insightGenerator.saveInsight, {
				repoId,
				summary:
					'Your repository data has been collected. AI insights will be generated once the sync pipeline is fully configured.',
				risk: 'medium',
				actions: [
					'Check that GEMINI_API_KEY is set in your environment variables',
					'Trigger a manual sync to retry insight generation'
				],
				modelUsed: 'none'
			});
			return;
		}

		const model = planConfig.aiModel;
		console.log('[InsightGenerator] Using model:', model);

		try {
			const response = await fetch(
				`${GEMINI_API_BASE_URL}/${model}:generateContent?key=${apiKey}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [{ role: 'user', parts: [{ text: prompt }] }],
						generationConfig: { responseMimeType: 'application/json' }
					})
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[InsightGenerator] Gemini API error', response.status, errorText);
				await ctx.runMutation(internal.insightGenerator.saveInsight, {
					repoId,
					summary: `Repository synced successfully. Stars: ${latestSnapshot.stars}, Forks: ${latestSnapshot.forks}, Open Issues: ${latestSnapshot.issuesOpen}. AI insights temporarily unavailable (API error ${response.status}).`,
					risk: 'low',
					actions: [
						'Review your GitHub repository metrics in the dashboard',
						'Trigger sync again to retry AI insights generation'
					],
					modelUsed: model
				});
				return;
			}

			const json = await response.json();
			const output = JSON.parse(json.candidates[0].content.parts[0].text);
			await ctx.runMutation(internal.insightGenerator.saveInsight, {
				repoId,
				summary: output.summary,
				risk: output.risk,
				actions: output.actions,
				modelUsed: model
			});
			console.log('[InsightGenerator] Insight saved successfully');
		} catch (e) {
			console.error('[InsightGenerator] Failed to generate insights:', e);
			await ctx.runMutation(internal.insightGenerator.saveInsight, {
				repoId,
				summary: `Repository data synced. Stars: ${latestSnapshot.stars}, Issues: ${latestSnapshot.issuesOpen}. AI insights generation encountered an error.`,
				risk: 'medium',
				actions: [
					'Review your repository metrics in the dashboard',
					'Trigger a manual sync to retry'
				],
				modelUsed: model
			});
		}
	}
});

export const saveInsight = internalMutation({
	args: {
		repoId: v.id('repos'),
		summary: v.string(),
		risk: v.string(),
		actions: v.array(v.string()),
		modelUsed: v.string()
	},
	handler: async (ctx, { repoId, summary, risk, actions, modelUsed }) => {
		await ctx.db.insert('repoInsights', {
			repoId,
			summary,
			risk,
			actions,
			generatedAt: Date.now(),
			modelUsed
		});
	}
});
