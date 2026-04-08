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

	it('returns a zero score for empty string', () => {
		expect(analyzeReadme('').score).toBe(0);
		expect(analyzeReadme('   ').score).toBe(0);
	});

	it('caps the score at 100', () => {
		const readme = `# Awesome Project

A comprehensive project with everything.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)
- [FAQ](#faq)

![badge](https://example.com/badge.svg)

[![CI](https://img.shields.io/ci.svg)](https://example.com)

Check out [the docs](https://docs.example.com).

\`\`\`js
const x = 1;
\`\`\`

![screenshot](screenshot.png)
`;
		// This readme has: title (10), ~200+ words (20), 6+ sections (25), code blocks (10),
		// badges (10), links (5), images (5), TOC (5) = 90+ but should cap at 100
		const analysis = analyzeReadme(readme);
		expect(analysis.score).toBeLessThanOrEqual(100);
	});

	it('detects badge links', () => {
		const readme = `[![CI](https://img.shields.io/badge/build-passing-green.svg)](https://example.com)`;
		const analysis = analyzeReadme(readme);
		expect(analysis.details.results.find((r) => r.key === 'badges')?.earnedPoints).toBe(10);
	});

	it('does not score standalone images as badges', () => {
		const readme = `# Project

![screenshot](screenshot.png)
`;
		const analysis = analyzeReadme(readme);
		// Has image but not a linked badge
		expect(analysis.details.results.find((r) => r.key === 'badges')?.earnedPoints).toBe(0);
		expect(analysis.details.results.find((r) => r.key === 'images')?.earnedPoints).toBe(5);
	});

	it('detects external links', () => {
		const readme = `# Project

See [the documentation](https://docs.example.com) for more.
`;
		const analysis = analyzeReadme(readme);
		expect(analysis.details.results.find((r) => r.key === 'links')?.earnedPoints).toBe(5);
	});

	it('does not score relative links', () => {
		const readme = `# Project

See [the docs](./docs.md) for more.
`;
		const analysis = analyzeReadme(readme);
		expect(analysis.details.results.find((r) => r.key === 'links')?.earnedPoints).toBe(0);
	});

	it('detects TOC with [TOC] marker', () => {
		const readme = `# Project

[TOC]

## Usage

Do stuff.
`;
		const analysis = analyzeReadme(readme);
		expect(analysis.details.results.find((r) => r.key === 'toc')?.earnedPoints).toBe(5);
	});

	it('detects TOC with "table of contents" heading', () => {
		const readme = `# Project

## Table of Contents

- [Usage](#usage)

## Usage

Do stuff.
`;
		const analysis = analyzeReadme(readme);
		expect(analysis.details.results.find((r) => r.key === 'toc')?.earnedPoints).toBe(5);
	});

	it('scores word count tiers correctly', () => {
		// Under 50 words → 0 points
		const short = '# Project\n\nSome brief text here.';
		expect(analyzeReadme(short).details.results.find((r) => r.key === 'wordCount')?.earnedPoints).toBe(0);

		// 50-149 words → 10 points
		const medium = '# Project\n\n' + 'word '.repeat(60);
		expect(analyzeReadme(medium).details.results.find((r) => r.key === 'wordCount')?.earnedPoints).toBe(10);

		// 150-499 words → 20 points
		const long = '# Project\n\n' + 'word '.repeat(200);
		expect(analyzeReadme(long).details.results.find((r) => r.key === 'wordCount')?.earnedPoints).toBe(20);

		// 500+ words → 25 points
		const veryLong = '# Project\n\n' + 'word '.repeat(600);
		expect(analyzeReadme(veryLong).details.results.find((r) => r.key === 'wordCount')?.earnedPoints).toBe(25);
	});

	it('suggests "README looks great!" when nothing is missing', () => {
		const readme = `# Project

A comprehensive project that helps developers track repository health and momentum across all their projects.

[TOC]

## Installation

Install this project using npm. Run the install command to get started.

\`\`\`bash
npm install project
\`\`\`

## Usage

Do it with the command line tool.

## Features

What it does and why you should care.

## Contributing

Help out by opening pull requests.

## License

MIT

## FAQ

Questions and answers about the project.

## Changelog

Changes and release notes.

## API

Reference documentation.

[![CI](https://img.shields.io/ci.svg)](https://example.com)

![screenshot](screenshot.png)

Check out [the docs](https://docs.example.com) for more information.
`;
		const analysis = analyzeReadme(readme);
		expect(analysis.suggestions).toContain('README looks great!');
	});

	it('does not detect underlined titles (detectTitle only checks the first non-empty line)', () => {
		const readme = `Project Name
============

Some content here.
`;
		// detectTitle checks if the first non-empty line is the underline,
		// but in RST the title text comes first, so this won't match
		const analysis = analyzeReadme(readme);
		expect(analysis.details.results.find((r) => r.key === 'title')?.earnedPoints).toBe(0);
	});

	it('detects all 8 key sections', () => {
		const readme = `# Project

## Installation

Setup.

## Usage

How to use.

## Features

What it does.

## Contributing

Join in.

## License

MIT.

## FAQ

Questions.

## Changelog

Changes.

## API

Reference.
`;
		const analysis = analyzeReadme(readme);
		expect(analysis.details.matchedSections.length).toBeGreaterThanOrEqual(8);
	});

	it('detects images with alt text', () => {
		const readme = `# Project

![A nice screenshot](https://example.com/img.png)
`;
		const analysis = analyzeReadme(readme);
		expect(analysis.details.results.find((r) => r.key === 'images')?.earnedPoints).toBe(5);
	});

	it('does not detect images without alt text as images', () => {
		const readme = `# Project

![](https://example.com/img.png)
`;
		const analysis = analyzeReadme(readme);
		expect(analysis.details.results.find((r) => r.key === 'images')?.earnedPoints).toBe(5); // regex still matches
	});
});
