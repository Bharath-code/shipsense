export interface ReadmeScoreRule {
	key:
		| 'wordCount'
		| 'title'
		| 'sections'
		| 'codeBlocks'
		| 'badges'
		| 'links'
		| 'images'
		| 'toc';
	label: string;
	maxPoints: number;
	description: string;
}

export interface ReadmeRuleResult extends ReadmeScoreRule {
	earnedPoints: number;
	detail: string;
}

export interface ReadmeAnalysisDetails {
	wordCount: number;
	headers: string[];
	matchedSections: string[];
	results: ReadmeRuleResult[];
}

export interface ReadmeAnalysis {
	score: number;
	suggestions: string[];
	details: ReadmeAnalysisDetails;
}

export const README_SCORE_RULES: ReadmeScoreRule[] = [
	{
		key: 'wordCount',
		label: 'Length',
		maxPoints: 25,
		description: 'Rewards README files with enough substance to explain the project.'
	},
	{
		key: 'title',
		label: 'Title',
		maxPoints: 10,
		description: 'Checks for a clear title at the top of the document.'
	},
	{
		key: 'sections',
		label: 'Key sections',
		maxPoints: 25,
		description: 'Looks for common README sections like install, usage, features, and license.'
	},
	{
		key: 'codeBlocks',
		label: 'Code examples',
		maxPoints: 10,
		description: 'Rewards fenced code blocks that help readers get started quickly.'
	},
	{
		key: 'badges',
		label: 'Badges',
		maxPoints: 10,
		description: 'Looks for linked badge images such as build, version, or coverage badges.'
	},
	{
		key: 'links',
		label: 'External links',
		maxPoints: 5,
		description: 'Rewards useful external documentation or reference links.'
	},
	{
		key: 'images',
		label: 'Images',
		maxPoints: 5,
		description: 'Rewards screenshots or diagrams that improve scannability.'
	},
	{
		key: 'toc',
		label: 'Table of contents',
		maxPoints: 5,
		description: 'Checks for a table of contents section or marker.'
	}
];

function normalizeHeading(heading: string): string {
	return heading
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[`*_~]/g, '')
		.trim()
		.toLowerCase();
}

function extractHeaders(content: string): string[] {
	const headers: string[] = [];
	const headerPattern = /^#{1,6}\s+(.+?)\s*#*\s*$/gm;
	let match: RegExpExecArray | null;

	while ((match = headerPattern.exec(content)) !== null) {
		headers.push(normalizeHeading(match[1]));
	}

	return headers;
}

function detectTitle(content: string): boolean {
	const firstNonEmptyLine = content
		.split('\n')
		.map((line) => line.trim())
		.find(Boolean);

	if (!firstNonEmptyLine) return false;
	if (firstNonEmptyLine.startsWith('# ')) return true;

	return /^(=+|-+)$/.test(firstNonEmptyLine);
}

export function analyzeReadme(content: string | null): ReadmeAnalysis {
	const emptyResult: ReadmeAnalysis = {
		score: 0,
		suggestions: ['README is empty or missing. Add a basic description.'],
		details: {
			wordCount: 0,
			headers: [],
			matchedSections: [],
			results: README_SCORE_RULES.map((rule) => ({
				...rule,
				earnedPoints: 0,
				detail: 'README content was not available.'
			}))
		}
	};

	if (!content || content.trim().length === 0) {
		return emptyResult;
	}

	const suggestions: string[] = [];
	const wordCount = content.split(/\s+/).filter(Boolean).length;
	const headers = extractHeaders(content);
	const results: ReadmeRuleResult[] = [];
	let score = 0;

	let wordCountPoints = 0;
	if (wordCount < 50) {
		suggestions.push('README is too short. Add more details about your project.');
	} else if (wordCount < 150) {
		wordCountPoints = 10;
	} else if (wordCount < 500) {
		wordCountPoints = 20;
	} else {
		wordCountPoints = 25;
	}
	score += wordCountPoints;
	results.push({
		...README_SCORE_RULES.find((rule) => rule.key === 'wordCount')!,
		earnedPoints: wordCountPoints,
		detail: `${wordCount} words`
	});

	const hasTitle = detectTitle(content);
	score += hasTitle ? 10 : 0;
	if (!hasTitle) {
		suggestions.push('Add a clear title at the top (e.g., # Project Name)');
	}
	results.push({
		...README_SCORE_RULES.find((rule) => rule.key === 'title')!,
		earnedPoints: hasTitle ? 10 : 0,
		detail: hasTitle ? 'Title detected' : 'No top-level title detected'
	});

	const sectionChecks = {
		Installation: headers.some((h) =>
			/install|setup|getting.?started|quick.?start|local development|development/.test(h)
		),
		Usage: headers.some((h) =>
			/usage|using|commands|run|example|examples|how to|local development|getting started/.test(
				h
			)
		),
		Features: headers.some((h) => /feature|highlight|capabilities|scope/.test(h)),
		Contributing: headers.some((h) => /contrib|authors|collaboration|development workflow/.test(h)),
		License: headers.some((h) => /license/.test(h)),
		FAQ: headers.some((h) => /faq|troubleshoot|known.?issues|known gaps/.test(h)),
		Changelog: headers.some((h) => /changelog|history|release notes|version/.test(h)),
		API: headers.some((h) => /api|reference|endpoint/.test(h))
	};

	const matchedSections = Object.entries(sectionChecks)
		.filter(([, found]) => found)
		.map(([label]) => label);

	let sectionPoints = 0;
	if (matchedSections.length >= 6) sectionPoints = 25;
	else if (matchedSections.length >= 4) sectionPoints = 15;
	else if (matchedSections.length >= 2) sectionPoints = 10;

	score += sectionPoints;
	results.push({
		...README_SCORE_RULES.find((rule) => rule.key === 'sections')!,
		earnedPoints: sectionPoints,
		detail:
			matchedSections.length > 0
				? `${matchedSections.length} matched: ${matchedSections.join(', ')}`
				: 'No key sections matched'
	});

	const criticalMissing = ['Installation', 'Usage', 'Contributing', 'License'].filter(
		(section) => !sectionChecks[section as keyof typeof sectionChecks]
	);
	if (criticalMissing.length > 0) {
		suggestions.push(`Missing sections: ${criticalMissing.join(', ')}`);
	}

	const hasCodeBlocks = content.includes('```');
	score += hasCodeBlocks ? 10 : 0;
	results.push({
		...README_SCORE_RULES.find((rule) => rule.key === 'codeBlocks')!,
		earnedPoints: hasCodeBlocks ? 10 : 0,
		detail: hasCodeBlocks ? 'Found fenced code block examples' : 'No fenced code blocks found'
	});

	const hasBadges = /\[\s*!\[[^\]]*\]\([^)]+\)\s*\]\([^)]+\)/.test(content);
	score += hasBadges ? 10 : 0;
	if (!hasBadges) {
		suggestions.push('Add badges for CI, coverage, version, etc.');
	}
	results.push({
		...README_SCORE_RULES.find((rule) => rule.key === 'badges')!,
		earnedPoints: hasBadges ? 10 : 0,
		detail: hasBadges ? 'Badge links detected' : 'No linked badge images found'
	});

	const hasLinks = /\]\(https?:\/\//.test(content);
	score += hasLinks ? 5 : 0;
	results.push({
		...README_SCORE_RULES.find((rule) => rule.key === 'links')!,
		earnedPoints: hasLinks ? 5 : 0,
		detail: hasLinks ? 'External links detected' : 'No external links detected'
	});

	const hasImages = /!\[[^\]]*\]\([^)]+\)/.test(content);
	score += hasImages ? 5 : 0;
	if (!hasImages) {
		suggestions.push('Consider adding screenshots');
	}
	results.push({
		...README_SCORE_RULES.find((rule) => rule.key === 'images')!,
		earnedPoints: hasImages ? 5 : 0,
		detail: hasImages ? 'Image or screenshot detected' : 'No images or screenshots detected'
	});

	const hasTOC =
		/\[toc\]/i.test(content) ||
		headers.some((h) => /table.?of.?contents/.test(h));
	score += hasTOC ? 5 : 0;
	results.push({
		...README_SCORE_RULES.find((rule) => rule.key === 'toc')!,
		earnedPoints: hasTOC ? 5 : 0,
		detail: hasTOC ? 'Table of contents detected' : 'No table of contents detected'
	});

	score = Math.min(score, 100);

	if (suggestions.length === 0) {
		suggestions.push('README looks great!');
	}

	return {
		score,
		suggestions,
		details: {
			wordCount,
			headers,
			matchedSections,
			results
		}
	};
}
