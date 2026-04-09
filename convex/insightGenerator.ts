import { internalAction, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getPlanConfig, type PlanType } from './plan';

// ── Gemini response JSON schema (strict) ──────────────────────────────
const INSIGHT_RESPONSE_SCHEMA = {
	type: 'object' as const,
	properties: {
		summary: {
			type: 'string' as const,
			description: '2-3 sentence assessment of repo health, max 200 characters'
		},
		risk: {
			type: 'string' as const,
			enum: ['low', 'medium', 'high'],
			description: 'Overall risk level based on repo metrics and trends'
		},
		actions: {
			type: 'array' as const,
			items: { type: 'string' as const },
			minItems: 1,
			maxItems: 4,
			description: '1-4 specific, prioritized actions tied to observed metrics'
		}
	},
	required: ['summary', 'risk', 'actions']
};

// ── Metric glossary embedded in every prompt ──────────────────────────
const METRIC_GLOSSARY = `
<metric_glossary>
- stars: total GitHub stars on the repository
- forks: total number of forks
- openIssues: currently open issues count
- prsOpen: open pull requests count
- prsMerged7d: pull requests merged in the last 7 days
- contributors14d: unique contributors active in the last 14 days
- commitGapHours: hours since the most recent commit
- healthScore: overall repo health score (0-100)
- scoreTrend: direction of health score — 'up' (improving), 'down' (declining), or 'stable'
- previousScore: health score from the prior sync (null if first sync)
- hasRecentCommits: true if a commit occurred within the last 48 hours
- anomalyFlags: list of detected anomalies, e.g. ["momentum_drop", "star_spike"]
</metric_glossary>`;

// ── Risk evaluation criteria ──────────────────────────────────────────
const RISK_CRITERIA = `
<risk_criteria>
- high: healthScore dropped 15+ points, no commits in 14+ days, or open issues > 100
- medium: healthScore dropped 5-14 points, commit gap 48-336 hours, or open issues 20-100
- low: healthScore stable or improving, commits within 48 hours, open issues < 20
</risk_criteria>`;

// ── Action quality guidance ───────────────────────────────────────────
const ACTION_GUIDANCE = `
<action_guidance>
Each action must be:
1. Specific — reference a concrete metric or observation (e.g. "Merge 3 stale PRs to improve PR flow", not "Be more active")
2. Prioritized — most impactful item first
3. Tied to observed metrics — do not give generic advice unrelated to the data
4. Actionable within a day or two — no long-term strategic planning items
</action_guidance>`;

/**
 * Build a structured prompt for Gemini with XML-tagged sections,
 * metric glossary, risk criteria, and action guidance.
 */
export function buildInsightPrompt(
	repoName: string,
	repoDescription: string,
	metrics: Record<string, unknown>
): string {
	return `<role>You are a growth advisor for open-source maintainers and indie hackers. You analyze repository health metrics and provide specific, actionable guidance.</role>

<task>Analyze the repository below and return a structured JSON response with a short summary, risk level, and 1-4 prioritized actions.</task>

<repository>
  <name>${repoName}</name>
  <description>${repoDescription}</description>
</repository>

<metrics>
${Object.entries(metrics)
	.filter(([k]) => k !== 'scoreExplanation')
	.map(([k, v]) => `  ${k}: ${v === null ? 'N/A (first sync)' : JSON.stringify(v)}`)
	.join('\n')}
</metrics>
${METRIC_GLOSSARY}
${RISK_CRITERIA}
${ACTION_GUIDANCE}
<output_format>
Return ONLY valid JSON matching this schema:
{
  "summary": "2-3 sentence assessment, max 200 characters",
  "risk": "low" | "medium" | "high",
  "actions": ["specific action 1", "specific action 2"]
}
Do NOT include any text outside the JSON object.
</output_format>`;
}

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Maximum number of retry attempts for transient API errors */
const MAX_RETRIES = 2;
/** Base delay in ms for exponential backoff */
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an HTTP error is retryable (rate limit or server error)
 */
function isRetryableError(status: number): boolean {
	return status === 429 || (status >= 500 && status < 600);
}

/**
 * Validate the parsed Gemini response against the expected schema.
 * Returns { valid, error } tuple.
 */
export function validateInsightOutput(
	output: unknown,
	repoId: string
): { valid: boolean; error: string | null } {
	if (typeof output !== 'object' || output === null) {
		return { valid: false, error: `[InsightGenerator] Output is not an object for repo ${repoId}` };
	}

	const obj = output as Record<string, unknown>;

	// Validate summary
	if (typeof obj.summary !== 'string' || obj.summary.trim().length === 0) {
		return { valid: false, error: `[InsightGenerator] Missing or empty 'summary' for repo ${repoId}` };
	}
	if (obj.summary.length > 200) {
		return { valid: false, error: `[InsightGenerator] 'summary' exceeds 200 chars (${obj.summary.length}) for repo ${repoId}` };
	}

	// Validate risk
	const validRisks = ['low', 'medium', 'high'];
	if (typeof obj.risk !== 'string' || !validRisks.includes(obj.risk)) {
		return { valid: false, error: `[InsightGenerator] Invalid 'risk' value '${obj.risk}' for repo ${repoId}. Must be one of: ${validRisks.join(', ')}` };
	}

	// Validate actions
	if (!Array.isArray(obj.actions) || obj.actions.length === 0) {
		return { valid: false, error: `[InsightGenerator] 'actions' must be a non-empty array for repo ${repoId}` };
	}
	if (obj.actions.length > 4) {
		return { valid: false, error: `[InsightGenerator] 'actions' has ${obj.actions.length} items (max 4) for repo ${repoId}` };
	}
	for (let i = 0; i < obj.actions.length; i++) {
		if (typeof obj.actions[i] !== 'string' || obj.actions[i].trim().length === 0) {
			return { valid: false, error: `[InsightGenerator] 'actions[${i}]' is not a valid string for repo ${repoId}` };
		}
	}

	return { valid: true, error: null };
}

/**
 * Generate a fallback insight when Gemini fails. Uses real metrics
 * instead of generic text so the fallback is still useful.
 */
export function generateFallbackInsight(
	metrics: Record<string, unknown>,
	modelUsed: string
): { summary: string; risk: 'low' | 'medium' | 'high'; actions: string[]; modelUsed: string } {
	const stars = typeof metrics.stars === 'number' ? metrics.stars : 0;
	const openIssues = typeof metrics.openIssues === 'number' ? metrics.openIssues : 0;
	const commitGap = typeof metrics.commitGapHours === 'number' ? metrics.commitGapHours : 999;
	const scoreTrend = metrics.scoreTrend as string | undefined;

	let risk: 'low' | 'medium' | 'high' = 'medium';
	const actions: string[] = [];

	if (commitGap > 336) {
		risk = 'high';
		actions.push('Resume commits — no activity in over 2 weeks. Even a small maintenance update helps.');
	} else if (commitGap > 48) {
		actions.push('Ship a small update to maintain momentum — aim for a commit within 48 hours.');
	}

	if (openIssues > 50) {
		risk = 'high';
		actions.push('Triage open issues — close stale ones and label the rest to reduce the backlog.');
	} else if (openIssues > 20) {
		actions.push('Review and triage open issues to keep the backlog manageable.');
	}

	if (scoreTrend === 'down') {
		actions.push('Health score is declining — review recent changes and address the biggest contributor to the drop.');
	}

	if (actions.length === 0) {
		actions.push('Review repository metrics and identify one improvement area for this week.');
		risk = 'low';
	}

	return {
		summary: `Repo synced. ${stars} stars, ${openIssues} open issues, last commit ${commitGap.toFixed(1)}h ago.`,
		risk,
		actions: actions.slice(0, 4),
		modelUsed
	};
}

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
		const anomalies = await ctx.runQuery(internal.anomalies.listActiveRepoAnomalies, { repoId });

		if (!latestSnapshot) {
			console.log('[InsightGenerator] No snapshot found, skipping');
			return;
		}

		// ── Enriched metrics payload ──────────────────────────────────
		const metrics = {
			stars: latestSnapshot.stars,
			forks: latestSnapshot.forks,
			openIssues: latestSnapshot.issuesOpen,
			prsOpen: latestSnapshot.prsOpen,
			prsMerged7d: latestSnapshot.prsMerged7d,
			contributors14d: latestSnapshot.contributors14d,
			commitGapHours: latestSnapshot.commitGapHours,
			healthScore: latestScore?.healthScore ?? null,
			scoreTrend: (latestScore?.trend as 'up' | 'down' | 'stable' | undefined) ?? 'stable',
			previousScore: latestScore?.previousScore ?? null,
			hasRecentCommits: (latestSnapshot.commitGapHours ?? 999) <= 48,
			anomalyFlags: anomalies?.map((a) => a.kind) ?? []
		};

		console.log('[InsightGenerator] Metrics:', JSON.stringify(metrics));

		const prompt = buildInsightPrompt(repo.name, repo.description || 'No description', metrics);

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			console.warn('[InsightGenerator] GEMINI_API_KEY not set, saving fallback insight');
			const fallback = generateFallbackInsight(metrics, 'none');
			await ctx.runMutation(internal.insightGenerator.saveInsight, {
				repoId,
				summary: fallback.summary,
				risk: fallback.risk,
				actions: fallback.actions,
				modelUsed: fallback.modelUsed
			});
			return;
		}

		const model = planConfig.aiModel;
		console.log('[InsightGenerator] Using model:', model);

		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			if (attempt > 0) {
				const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
				console.log(`[InsightGenerator] Retry ${attempt}/${MAX_RETRIES} after ${delay}ms`);
				await sleep(delay);
			}

			try {
				const response = await fetch(
					`${GEMINI_API_BASE_URL}/${model}:generateContent?key=${apiKey}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contents: [{ role: 'user', parts: [{ text: prompt }] }],
							generationConfig: {
								responseMimeType: 'application/json',
								responseSchema: INSIGHT_RESPONSE_SCHEMA,
								temperature: 0.1,
								maxOutputTokens: 1024,
								topP: 0.9,
								candidateCount: 1
							}
						})
					}
				);

				if (!response.ok) {
					const errorText = await response.text();
					console.error('[InsightGenerator] Gemini API error', response.status, errorText);

					if (isRetryableError(response.status) && attempt < MAX_RETRIES) {
						lastError = new Error(`Gemini API ${response.status}: ${errorText}`);
						continue;
					}

					// Non-retryable or exhausted retries — save fallback
					console.error('[InsightGenerator] Gemini API failed after retries, saving fallback');
					const fallback = generateFallbackInsight(metrics, model);
					await ctx.runMutation(internal.insightGenerator.saveInsight, {
						repoId,
						summary: fallback.summary,
						risk: fallback.risk,
						actions: fallback.actions,
						modelUsed: fallback.modelUsed
					});
					return;
				}

				const json = await response.json();

				// Defensive path traversal into Gemini response structure
				const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
				if (!rawText) {
					console.error('[InsightGenerator] Unexpected Gemini response structure:', JSON.stringify(json).slice(0, 200));
					lastError = new Error('Missing response text in Gemini output');
					continue;
				}

				let output: unknown;
				try {
					output = JSON.parse(rawText);
				} catch (parseError) {
					console.error('[InsightGenerator] Failed to parse Gemini response as JSON:', rawText.slice(0, 300));
					lastError = parseError instanceof Error ? parseError : new Error(String(parseError));
					continue;
				}

				// Validate output against schema
				const validation = validateInsightOutput(output, repoId);
				if (!validation.valid) {
					const errMsg = validation.error ?? 'Unknown validation error';
					console.error('[InsightGenerator] Validation failed:', errMsg);
					lastError = new Error(errMsg);
					continue;
				}

				const validated = output as { summary: string; risk: string; actions: string[] };

				await ctx.runMutation(internal.insightGenerator.saveInsight, {
					repoId,
					summary: validated.summary,
					risk: validated.risk,
					actions: validated.actions,
					modelUsed: model
				});
				console.log('[InsightGenerator] Insight saved successfully');
				return; // success — exit retry loop
			} catch (e) {
				console.error(`[InsightGenerator] Attempt ${attempt + 1} failed:`, e);
				lastError = e instanceof Error ? e : new Error(String(e));

				if (attempt < MAX_RETRIES) {
					continue;
				}
			}
		}

		// All retries exhausted — save fallback insight
		console.error('[InsightGenerator] All retries exhausted. Last error:', lastError?.message);
		const fallback = generateFallbackInsight(metrics, model);
		await ctx.runMutation(internal.insightGenerator.saveInsight, {
			repoId,
			summary: fallback.summary,
			risk: fallback.risk,
			actions: fallback.actions,
			modelUsed: model
		});
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
		// Delete old insights to avoid stale data
		const oldInsights = await ctx.db
			.query('repoInsights')
			.withIndex('by_repoId_generatedAt', (q) => q.eq('repoId', repoId))
			.collect();

		for (const insight of oldInsights) {
			await ctx.db.delete(insight._id);
		}

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
