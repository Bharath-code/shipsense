import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { analyzeReadme } from '../src/lib/utils/readmeAnalysis';

export const fetchAndAnalyzeReadme = internalAction({
	args: { repoId: v.id('repos'), accessToken: v.string(), owner: v.string(), name: v.string() },
	handler: async (ctx, { repoId, accessToken, owner, name }) => {
		let readmeContent: string | null = null;

		try {
			const response = await fetch(`https://api.github.com/repos/${owner}/${name}/readme`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/vnd.github.raw+json'
				}
			});

			if (response.ok) {
				readmeContent = await response.text();
			}
		} catch (error) {
			console.error('[ReadmeAnalyzer] Error:', error);
		}

		const analysis = analyzeReadme(readmeContent);
		console.log('[ReadmeAnalyzer] Result:', analysis);

		await ctx.runMutation(internal.collector.updateReadmeAnalysis, {
			repoId,
			readmeScore: analysis.score,
			readmeSuggestions: analysis.suggestions
		});

		return analysis;
	}
});
