import { describe, it, expect } from 'vitest';
import { buildInsightPrompt } from './insightGenerator';

describe('buildInsightPrompt', () => {
	it('builds a correct prompt containing the repository name, description, and metrics', () => {
		const repoName = 'AwesomeRepo';
		const repoDescription = 'An awesome test repository';
		const metrics = { stars: 100, openIssues: 12, prsOpen: 4 };

		const prompt = buildInsightPrompt(repoName, repoDescription, metrics);

		expect(prompt).toContain(repoName);
		expect(prompt).toContain(repoDescription);
		expect(prompt).toContain(JSON.stringify(metrics));
		expect(prompt).toContain('JSON response');
		expect(prompt).toContain('"summary"');
	});
});
