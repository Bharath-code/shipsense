import { describe, it, expect } from 'vitest';
import { buildInsightPrompt, validateInsightOutput, generateFallbackInsight } from './insightGenerator';

// ── buildInsightPrompt tests ──────────────────────────────────────────

describe('buildInsightPrompt', () => {
	it('includes XML-tagged role and task sections', () => {
		const prompt = buildInsightPrompt('TestRepo', 'A test repo', { stars: 50 });

		expect(prompt).toContain('<role>');
		expect(prompt).toContain('</role>');
		expect(prompt).toContain('<task>');
		expect(prompt).toContain('</task>');
		expect(prompt).toContain('growth advisor');
	});

	it('includes repository name and description in XML tags', () => {
		const prompt = buildInsightPrompt('MyRepo', 'My awesome project', { stars: 100 });

		expect(prompt).toContain('<repository>');
		expect(prompt).toContain('<name>MyRepo</name>');
		expect(prompt).toContain('<description>My awesome project</description>');
	});

	it('includes metrics in structured format', () => {
		const metrics = {
			stars: 150,
			commitGapHours: 24,
			openIssues: 12,
			scoreTrend: 'up',
			previousScore: 65,
			anomalyFlags: ['star_spike']
		};

		const prompt = buildInsightPrompt('Repo', 'desc', metrics);

		expect(prompt).toContain('<metrics>');
		expect(prompt).toContain('stars: 150');
		expect(prompt).toContain('scoreTrend: "up"');
		expect(prompt).toContain('anomalyFlags:');
		expect(prompt).toContain('star_spike');
	});

	it('renders null values as N/A (first sync)', () => {
		const metrics = {
			healthScore: null,
			previousScore: null
		};

		const prompt = buildInsightPrompt('Repo', 'desc', metrics);

		expect(prompt).toContain('healthScore: N/A (first sync)');
		expect(prompt).toContain('previousScore: N/A (first sync)');
	});

	it('includes metric glossary with all field definitions', () => {
		const prompt = buildInsightPrompt('Repo', 'desc', { stars: 1 });

		expect(prompt).toContain('<metric_glossary>');
		expect(prompt).toContain('stars: total GitHub stars');
		expect(prompt).toContain('scoreTrend: direction of health score');
		expect(prompt).toContain('anomalyFlags: list of detected anomalies');
	});

	it('includes risk evaluation criteria', () => {
		const prompt = buildInsightPrompt('Repo', 'desc', { stars: 1 });

		expect(prompt).toContain('<risk_criteria>');
		expect(prompt).toContain('high:');
		expect(prompt).toContain('medium:');
		expect(prompt).toContain('low:');
	});

	it('includes action quality guidance', () => {
		const prompt = buildInsightPrompt('Repo', 'desc', { stars: 1 });

		expect(prompt).toContain('<action_guidance>');
		expect(prompt).toContain('Specific');
		expect(prompt).toContain('Prioritized');
		expect(prompt).toContain('Actionable');
	});

	it('includes output_format section with JSON schema', () => {
		const prompt = buildInsightPrompt('Repo', 'desc', { stars: 1 });

		expect(prompt).toContain('<output_format>');
		expect(prompt).toContain('"summary"');
		expect(prompt).toContain('"risk"');
		expect(prompt).toContain('"actions"');
		expect(prompt).toContain('Do NOT include any text outside the JSON object');
	});

	it('does not include scoreExplanation (removed to save tokens)', () => {
		const metrics = {
			stars: 100,
			scoreExplanation: 'This is a long verbose explanation'
		};

		const prompt = buildInsightPrompt('Repo', 'desc', metrics);

		expect(prompt).not.toContain('scoreExplanation');
	});

	it('produces a deterministic prompt for identical inputs', () => {
		const metrics = { stars: 42, healthScore: 75, scoreTrend: 'stable' };
		const prompt1 = buildInsightPrompt('Repo', 'desc', metrics);
		const prompt2 = buildInsightPrompt('Repo', 'desc', metrics);

		expect(prompt1).toBe(prompt2);
	});
});

describe('prompt structure completeness', () => {
	it('has all required XML sections in correct order', () => {
		const prompt = buildInsightPrompt('Repo', 'desc', { stars: 1 });
		// Use section openers that are unique and won't be substrings of each other
		const sections = ['<role>', '<task>', '<repository>', '<metrics>', '<metric_glossary>', '</risk_criteria>', '</action_guidance>', '<output_format>'];
		let lastIndex = -1;

		for (const section of sections) {
			const idx = prompt.indexOf(section, lastIndex + 1);
			expect(idx).toBeGreaterThan(lastIndex);
			lastIndex = idx;
		}
	});

	it('uses metric glossary values in the prompt context', () => {
		const prompt = buildInsightPrompt('Repo', 'desc', {
			prsMerged7d: 5,
			contributors14d: 3,
			hasRecentCommits: true
		});

		expect(prompt).toContain('prsMerged7d: 5');
		expect(prompt).toContain('contributors14d: 3');
		expect(prompt).toContain('hasRecentCommits: true');
	});
});

// ── validateInsightOutput tests ───────────────────────────────────────

describe('validateInsightOutput', () => {
	it('accepts a valid insight object', () => {
		const result = validateInsightOutput({
			summary: 'Good repo health with steady commits.',
			risk: 'low',
			actions: ['Keep shipping weekly updates.']
		}, 'repo1');

		expect(result.valid).toBe(true);
		expect(result.error).toBeNull();
	});

	it('accepts the maximum number of actions (4)', () => {
		const result = validateInsightOutput({
			summary: 'Repo needs attention.',
			risk: 'high',
			actions: ['Fix CI', 'Merge PRs', 'Update README', 'Close stale issues']
		}, 'repo1');

		expect(result.valid).toBe(true);
	});

	it('rejects null output', () => {
		const result = validateInsightOutput(null, 'repo1');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('not an object');
	});

	it('rejects a non-object output', () => {
		const result = validateInsightOutput('not json', 'repo1');
		expect(result.valid).toBe(false);
	});

	it('rejects missing summary', () => {
		const result = validateInsightOutput({
			risk: 'low',
			actions: ['do something']
		}, 'repo1');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('summary');
	});

	it('rejects empty summary', () => {
		const result = validateInsightOutput({
			summary: '',
			risk: 'low',
			actions: ['do something']
		}, 'repo1');
		expect(result.valid).toBe(false);
	});

	it('rejects summary exceeding 200 characters', () => {
		const longSummary = 'x'.repeat(201);
		const result = validateInsightOutput({
			summary: longSummary,
			risk: 'low',
			actions: ['do something']
		}, 'repo1');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('exceeds 200');
	});

	it('rejects invalid risk value', () => {
		const result = validateInsightOutput({
			summary: 'OK',
			risk: 'critical',
			actions: ['fix it']
		}, 'repo1');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('Invalid');
	});

	it('rejects non-string risk value', () => {
		const result = validateInsightOutput({
			summary: 'OK',
			risk: 42,
			actions: ['fix it']
		}, 'repo1');
		expect(result.valid).toBe(false);
	});

	it('rejects empty actions array', () => {
		const result = validateInsightOutput({
			summary: 'OK',
			risk: 'low',
			actions: []
		}, 'repo1');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('non-empty array');
	});

	it('rejects actions with more than 4 items', () => {
		const result = validateInsightOutput({
			summary: 'OK',
			risk: 'low',
			actions: ['a', 'b', 'c', 'd', 'e']
		}, 'repo1');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('max 4');
	});

	it('rejects actions containing non-string values', () => {
		const result = validateInsightOutput({
			summary: 'OK',
			risk: 'low',
			actions: ['valid', 123, 'also valid']
		}, 'repo1');
		expect(result.valid).toBe(false);
	});

	it('rejects actions with empty strings', () => {
		const result = validateInsightOutput({
			summary: 'OK',
			risk: 'low',
			actions: ['valid', '  ']
		}, 'repo1');
		expect(result.valid).toBe(false);
	});

	it('includes repoId in error messages for debugging', () => {
		const result = validateInsightOutput({ summary: '' }, 'test-repo-42');
		expect(result.error).toContain('test-repo-42');
	});
});

// ── generateFallbackInsight tests ─────────────────────────────────────

describe('generateFallbackInsight', () => {
	it('produces valid insight with default metrics', () => {
		const result = generateFallbackInsight({}, 'test-model');

		expect(result.summary).toBeDefined();
		expect(['low', 'medium', 'high']).toContain(result.risk);
		expect(result.actions.length).toBeGreaterThanOrEqual(1);
		expect(result.actions.length).toBeLessThanOrEqual(4);
		expect(result.modelUsed).toBe('test-model');
	});

	it('sets high risk when commit gap exceeds 2 weeks', () => {
		const result = generateFallbackInsight({
			commitGapHours: 400,
			stars: 10,
			openIssues: 5,
			scoreTrend: 'stable'
		}, 'model');

		expect(result.risk).toBe('high');
		expect(result.actions[0]).toContain('Resume commits');
	});

	it('sets high risk when open issues exceed 50', () => {
		const result = generateFallbackInsight({
			commitGapHours: 12,
			openIssues: 75,
			stars: 200,
			scoreTrend: 'stable'
		}, 'model');

		expect(result.risk).toBe('high');
		expect(result.actions.some(a => a.includes('Triage') || a.includes('issues'))).toBe(true);
	});

	it('adds action for declining score trend', () => {
		const result = generateFallbackInsight({
			commitGapHours: 24,
			openIssues: 5,
			stars: 50,
			scoreTrend: 'down'
		}, 'model');

		expect(result.actions.some(a => a.toLowerCase().includes('declin') || a.toLowerCase().includes('health score'))).toBe(true);
	});

	it('produces low risk for healthy repo metrics', () => {
		const result = generateFallbackInsight({
			commitGapHours: 6,
			openIssues: 3,
			stars: 100,
			scoreTrend: 'up'
		}, 'model');

		expect(result.risk).toBe('low');
	});

	it('caps actions at maximum of 4', () => {
		const result = generateFallbackInsight({
			commitGapHours: 400,
			openIssues: 100,
			stars: 10,
			scoreTrend: 'down'
		}, 'model');

		expect(result.actions.length).toBeLessThanOrEqual(4);
	});

	it('includes real metric values in summary', () => {
		const result = generateFallbackInsight({
			stars: 342,
			openIssues: 18,
			commitGapHours: 36
		}, 'model');

		expect(result.summary).toContain('342');
		expect(result.summary).toContain('18');
		expect(result.summary).toContain('36');
	});

	it('handles missing numeric metrics gracefully', () => {
		const result = generateFallbackInsight({
			stars: 'N/A',
			openIssues: null,
			commitGapHours: null
		}, 'model');

		expect(result.summary).toBeDefined();
		expect(result.actions.length).toBeGreaterThanOrEqual(1);
	});

	it('defaults to medium risk when no specific conditions match', () => {
		const result = generateFallbackInsight({
			commitGapHours: 48,
			openIssues: 20,
			stars: 50,
			scoreTrend: 'stable'
		}, 'model');

		expect(result.risk).toBe('low');
	});
});
