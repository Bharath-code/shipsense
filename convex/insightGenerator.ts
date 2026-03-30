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
		// 1. Fetch repo data
		const repo = await ctx.runQuery(internal.repos.getRepoById, { repoId });
		if (!repo) return;

		// 2. Fetch latest snapshot and score
		const plan = (await ctx.runQuery(internal.billing.getMyPlan, {
			userId: repo.userId
		})) as PlanType;
		const planConfig = getPlanConfig(plan);

		const metrics = { stars: 100, openIssues: 12, prsOpen: 4 }; // Metrics fetching placeholder

		// 3. Setup Gemini prompt
		const prompt = buildInsightPrompt(repo.name, repo.description || 'No description', metrics);

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			console.warn('GEMINI_API_KEY not set');
			return;
		}

		const model = planConfig.aiModel;
		const response = await fetch(`${GEMINI_API_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ role: 'user', parts: [{ text: prompt }] }],
				generationConfig: { responseMimeType: 'application/json' }
			})
		});

		if (!response.ok) {
			console.error('Gemini API error');
			return;
		}

		const json = await response.json();
		try {
			const output = JSON.parse(json.candidates[0].content.parts[0].text);
			await ctx.runMutation(internal.insightGenerator.saveInsight, {
				repoId,
				summary: output.summary,
				risk: output.risk,
				actions: output.actions,
				modelUsed: model
			});
		} catch (e) {
			console.error('Failed to parse Gemini output', e);
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
