import { describe, expect, it } from 'vitest';
import { analyzeReadme } from './readmeAnalysis';

describe('analyzeReadme', () => {
	it('uses full header text when matching sections', () => {
		const readme = `# Demo

## Local Development

Run this locally.

\`\`\`sh
npm install
npm run dev
\`\`\`

## Known Gaps

Needs polish.
`;

		const analysis = analyzeReadme(readme);

		expect(analysis.details.headers).toContain('local development');
		expect(analysis.details.headers).toContain('known gaps');
		expect(analysis.details.matchedSections).toContain('Installation');
		expect(analysis.details.matchedSections).toContain('FAQ');
	});

	it('scores a substantial README with code blocks without flagging it as short', () => {
		const readme = `# ShipSense

ShipSense helps founders track repository health and momentum across their projects. It turns GitHub activity into a simple score, guidance, and a lightweight operating rhythm for solo builders.

## Current Product Scope

Features include score tracking, streaks, tasks, and AI insights.

## Local Development

\`\`\`sh
npm install
npm run dev
\`\`\`

## Usage

Connect a repository and sync it.

## License

MIT
`;

		const analysis = analyzeReadme(readme);

		expect(analysis.score).toBeGreaterThan(0);
		expect(analysis.suggestions).not.toContain(
			'README is too short. Add more details about your project.'
		);
		expect(analysis.details.results.find((result) => result.key === 'codeBlocks')?.earnedPoints).toBe(
			10
		);
	});

	it('returns a zero score for missing content', () => {
		const analysis = analyzeReadme(null);

		expect(analysis.score).toBe(0);
		expect(analysis.suggestions).toEqual(['README is empty or missing. Add a basic description.']);
	});
});
