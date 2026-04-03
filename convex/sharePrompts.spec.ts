import { describe, expect, it } from 'vitest';
import { buildSharePrompt } from './sharePrompts';

describe('share prompt logic', () => {
	it('prefers active star spike anomalies for share prompts', () => {
		const prompt = buildSharePrompt({
			repoName: 'shipsense',
			repoSlug: 'bharath-shipsense',
			currentScore: 72,
			previousScore: 64,
			bestPreviousScore: 70,
			starsLast7d: 18,
			streak: 6,
			activeAnomaly: {
				kind: 'star_spike',
				title: 'Star spike detected',
				description: 'Stars jumped to +18 this week.'
			},
			growthMoments: []
		});

		expect(prompt).toMatchObject({
			kind: 'star_spike',
			title: 'Share the star spike',
			fingerprint: 'star_spike:18',
			shareUrl: 'https://shipsense.dev/p/bharath-shipsense'
		});
		expect(prompt?.shareText).toContain('shipsense is having a star spike');
	});

	it('creates a score milestone when the repo hits a new personal best', () => {
		const prompt = buildSharePrompt({
			repoName: 'shipsense',
			repoSlug: 'bharath-shipsense',
			currentScore: 81,
			previousScore: 74,
			bestPreviousScore: 79,
			starsLast7d: 2,
			streak: 4,
			growthMoments: []
		});

		expect(prompt).toMatchObject({
			kind: 'score_milestone',
			title: 'Share the new score milestone',
			fingerprint: 'score_milestone:81'
		});
		expect(prompt?.message).toContain('new personal-best health score of 81/100');
	});

	it('returns null when nothing notable happened', () => {
		const prompt = buildSharePrompt({
			repoName: 'shipsense',
			currentScore: 54,
			previousScore: 53,
			bestPreviousScore: 60,
			starsLast7d: 0,
			streak: 2,
			growthMoments: []
		});

		expect(prompt).toBeNull();
	});
});
