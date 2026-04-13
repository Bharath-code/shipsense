/**
 * Health Grade — maps numeric health scores (0-100) to letter grades (A-F)
 * with percentile benchmarks and shareable grade strings.
 *
 * Used in: email reports, thank-you pages, social sharing.
 */

export type LetterGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';

export interface GradeInfo {
	grade: LetterGrade;
	emoji: string;
	color: string;
	label: string; // e.g. "Excellent"
	description: string; // 1-sentence assessment
}

/**
 * Convert a health score (0-100) to a letter grade.
 */
export function getLetterGrade(score: number): LetterGrade {
	if (score >= 95) return 'A+';
	if (score >= 85) return 'A';
	if (score >= 75) return 'B+';
	if (score >= 65) return 'B';
	if (score >= 50) return 'C';
	if (score >= 35) return 'D';
	return 'F';
}

/**
 * Get full grade info including emoji, color, label, and description.
 */
export function getGradeInfo(score: number): GradeInfo {
	const grade = getLetterGrade(score);

	const gradeMap: Record<LetterGrade, Omit<GradeInfo, 'grade'>> = {
		'A+': {
			emoji: '🏆',
			color: '#10b981',
			label: 'Outstanding',
			description:
				'Your repo is in elite territory — strong community engagement, active development, and excellent hygiene.'
		},
		A: {
			emoji: '🌟',
			color: '#10b981',
			label: 'Excellent',
			description:
				'Your repo is very healthy — consistent activity, good community signals, and solid maintenance practices.'
		},
		'B+': {
			emoji: '✅',
			color: '#22c55e',
			label: 'Very Good',
			description:
				'Your repo is in great shape with room to grow. A few quick wins could push it to excellent.'
		},
		B: {
			emoji: '👍',
			color: '#22c55e',
			label: 'Good',
			description:
				'Your repo is healthy overall. Focus on the flagged areas to boost your score significantly.'
		},
		C: {
			emoji: '⚠️',
			color: '#f59e0b',
			label: 'Fair',
			description:
				'Your repo has some gaps that could hurt growth. Addressing the top risks will make a big difference.'
		},
		D: {
			emoji: '🟠',
			color: '#f97316',
			label: 'Needs Work',
			description:
				'Your repo shows signs of stagnation. Prioritize the recommended actions to regain momentum.'
		},
		F: {
			emoji: '🔴',
			color: '#ef4444',
			label: 'Critical',
			description:
				'Your repo needs immediate attention. Low activity and unresolved issues are hurting its health.'
		}
	};

	const info = gradeMap[grade];
	return { grade, ...info };
}

/**
 * Estimate what percentile a repo is in based on its star count and score.
 * Uses a simple heuristic model (no real cohort data yet — placeholder until benchmarking is built).
 */
export function estimatePercentile(stars: number, score: number): number {
	// Heuristic: repos with more stars + higher score = higher percentile
	// This is a rough estimate until we have real cohort data
	const starPercentile = Math.min(Math.log10(Math.max(stars, 1)) / 4 * 100, 100);
	const scorePercentile = score;
	return Math.round((starPercentile * 0.3 + scorePercentile * 0.7));
}

/**
 * Generate 3 specific quick wins based on repo metrics.
 * Returns actionable items with exact steps, not generic advice.
 */
export function generateQuickWins(metrics: {
	stars: number;
	forks: number;
	hasLicense: boolean;
	hasReadme: boolean;
	hasContributing: boolean;
	issuesOpen: number;
	commitGapHours: number;
	prsOpen: number;
}): { title: string; steps: string; impact: string }[] {
	const wins: { title: string; steps: string; impact: string }[] = [];

	// License missing
	if (!metrics.hasLicense) {
		wins.push({
			title: 'Add a LICENSE file',
			steps: 'Create a LICENSE file in your repo root. Use https://choosealicense.com/ to pick the right one. MIT for permissive, GPL for copyleft.',
			impact: '+10 points — repos with a license are 3x more likely to get contributions.'
		});
	}

	// README missing
	if (!metrics.hasReadme) {
		wins.push({
			title: 'Create a README.md',
			steps: 'Add a README.md with: project description, installation instructions, usage examples, and a license badge. Use https://github.com/othneildrew/Best-README-Template as a starter.',
			impact: '+25 points — no README is the single biggest health penalty.'
		});
	}

	// High open issues
	if (metrics.issuesOpen > 10) {
		wins.push({
			title: 'Triage open issues',
			steps: `You have ${metrics.issuesOpen} open issues. Label them (bug/enhancement/question), close duplicates, and add a "needs triage" label for future ones. Reply to the oldest 3 with a status update.`,
			impact: '+5-15 points — faster issue response boosts community trust.'
		});
	}

	// Stale PRs
	if (metrics.prsOpen > 0 && metrics.commitGapHours > 168) {
		wins.push({
			title: 'Review open PRs',
			steps: `You have ${metrics.prsOpen} open PRs with no recent commits. Add a "review needed" comment or merge/close them to show the repo is active.`,
			impact: '+5 points — active PR review signals a healthy mainter workflow.'
		});
	}

	// Low stars
	if (metrics.stars < 10) {
		wins.push({
			title: 'Share your repo',
			steps: 'Post on Twitter/X with a screenshot + one-liner. Submit to Hacker News "Show HN" or relevant Reddit communities. Add a "Star this repo" badge to your README.',
			impact: '+5-15 stars in the first week from social exposure.'
		});
	}

	// Low forks
	if (metrics.forks < 5 && metrics.stars > 20) {
		wins.push({
			title: 'Add a CONTRIBUTING.md',
			steps: 'Create a CONTRIBUTING.md with setup instructions, coding standards, and a "good first issue" label template. This encourages collaborators to fork and contribute.',
			impact: '+5 points — contribution guidelines double the fork rate.'
		});
	}

	// Commit gap too long
	if (metrics.commitGapHours > 720) {
		wins.push({
			title: 'Ship a quick commit',
			steps: 'Update your README, fix a typo, or bump the version. Even a small commit resets the "active" signal and improves your streak.',
			impact: '+10-15 points — recent activity is the fastest score booster.'
		});
	}

	// Already solid — give growth advice
	if (wins.length === 0) {
		wins.push({
			title: 'Set up GitHub Actions CI',
			steps: 'Add a .github/workflows/ci.yml with lint + test on every PR. Add a status badge to your README. This attracts contributors who want a smooth experience.',
			impact: '+5 points — CI signals professionalism to potential contributors.'
		});
		wins.push({
			title: 'Add a changelog',
			steps: 'Create a CHANGELOG.md following https://keepachangelog.com/. Tag releases with semantic versioning. This makes your project feel more polished and trustworthy.',
			impact: '+5 points — release discipline boosts long-term credibility.'
		});
		wins.push({
			title: 'Set up a discussion board',
			steps: 'Enable GitHub Discussions in your repo settings. Pin a "Welcome" post with links to docs, roadmap, and contribution guidelines.',
			impact: '+3 points — discussions reduce issue noise and build community.'
		});
	}

	return wins.slice(0, 3);
}
