import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

export const syncRepoNow = internalAction({
	args: { repoId: v.id('repos') },
	handler: async (ctx, { repoId }) => {
		console.log('[Orchestrator] Starting sync for repo:', repoId);

		try {
			const snapshotId = await ctx.runAction(internal.collector.fetchRepoData, { repoId });
			if (!snapshotId) {
				console.log('[Orchestrator] No snapshot created, stopping');
				return;
			}
			console.log('[Orchestrator] Snapshot created:', snapshotId);

			const previousScore = await ctx.runQuery(internal.scorer.getLatestScore, { repoId });

			await ctx.runMutation(internal.scorer.calculateScore, { repoId, snapshotId });
			console.log('[Orchestrator] Score calculated');

			const newScore = await ctx.runQuery(internal.scorer.getLatestScore, { repoId });
			const repo = await ctx.runQuery(internal.repos.getRepoById, { repoId });

			if (repo) {
				const tokens = await ctx.runQuery(internal.users.getGithubToken, {
					userId: repo.userId
				});

				if (tokens?.accessToken) {
					await ctx.runAction(internal.readmeAnalyzer.fetchAndAnalyzeReadme, {
						repoId,
						accessToken: tokens.accessToken,
						owner: repo.owner,
						name: repo.name
					});
					console.log('[Orchestrator] README analyzed');

					await ctx.runAction(internal.dependencies.fetchAndMonitorDependencies, {
						repoId,
						accessToken: tokens.accessToken,
						owner: repo.owner,
						name: repo.name,
						repoDisplayName: repo.name,
						userId: repo.userId
					});
					console.log('[Orchestrator] Dependencies analyzed');
				}
			}

			if (repo && newScore) {
				await ctx.runAction(internal.anomalies.analyzeRepoAnomalies, {
					repoId,
					userId: repo.userId,
					repoName: repo.name,
					previousScore: previousScore?.healthScore,
					currentScore: newScore.healthScore
				});

				await ctx.runAction(internal.sharePrompts.generateSharePrompt, {
					repoId,
					userId: repo.userId,
					repoName: repo.name,
					repoSlug: repo.slug,
					previousScore: previousScore?.healthScore,
					currentScore: newScore.healthScore
				});

				if (previousScore && newScore.healthScore < previousScore.healthScore - 5) {
					await ctx.runMutation(internal.notifications.createNotification, {
						userId: repo.userId,
						type: 'score_drop',
						title: 'Health score dropped',
						message: `${repo.name}'s health score dropped from ${previousScore.healthScore} to ${newScore.healthScore}. Check your tasks to improve it.`,
						repoId,
						repoName: repo.name
					});
				}

				if (!previousScore) {
					await ctx.runMutation(internal.notifications.createNotification, {
						userId: repo.userId,
						type: 'sync_complete',
						title: 'First sync complete!',
						message: `${repo.name} has been synced successfully. Your health score is ${newScore.healthScore}.`,
						repoId,
						repoName: repo.name
					});
				}

				const streak = await ctx.runQuery(internal.dashboard.getRepoStreakInternal, { repoId });
				if (streak) {
					if (streak.currentStreak === 0 && streak.streakBrokenAt) {
						const brokenRecently = Date.now() - streak.streakBrokenAt < 24 * 60 * 60 * 1000;
						if (brokenRecently) {
							await ctx.runMutation(internal.notifications.createNotification, {
								userId: repo.userId,
								type: 'streak_break',
								title: 'Streak broken',
								message: `${repo.name}'s ${streak.longestStreak}-day streak has been broken. Push a commit to start a new one!`,
								repoId,
								repoName: repo.name
							});
						}
					}

					const milestones = [3, 7, 14, 30, 50, 100];
					if (milestones.includes(streak.currentStreak) && streak.currentStreak > 0) {
						await ctx.runMutation(internal.notifications.createNotification, {
							userId: repo.userId,
							type: 'streak_milestone',
							title: `${streak.currentStreak}-day streak!`,
							message: `${repo.name} has hit a ${streak.currentStreak}-day shipping streak. Keep it up!`,
							repoId,
							repoName: repo.name
						});
					}
				}
			}

			await ctx.runAction(internal.taskGenerator.generateTasks, { repoId });
			console.log('[Orchestrator] Tasks generated');

			const tasks = await ctx.runQuery(internal.taskGenerator.getOpenTasks, { repoId });
			if (repo && tasks && tasks.length > 0) {
				const recentTasks = tasks.filter((t: any) => Date.now() - t.createdAt < 60 * 60 * 1000);
				if (recentTasks.length > 0) {
					await ctx.runMutation(internal.notifications.createNotification, {
						userId: repo.userId,
						type: 'new_task',
						title: 'New tasks available',
						message: `${recentTasks.length} new task${recentTasks.length > 1 ? 's' : ''} for ${repo.name}. Check your dashboard to see what needs attention.`,
						repoId,
						repoName: repo.name
					});
				}
			}

			await ctx.runAction(internal.insightGenerator.generateInsights, { repoId });
			console.log('[Orchestrator] Insights generated');

			await ctx.runAction(internal.dailyDigests.generateRepoDailyDigest, { repoId });
			console.log('[Orchestrator] Daily digest generated');

			console.log('[Orchestrator] Sync complete for repo:', repoId);
		} catch (error) {
			console.error('[Orchestrator] Sync failed for repo:', repoId, error);
		}
	}
});

export const runDataCollection = internalAction({
	args: {},
	handler: async (ctx) => {
		const repos = await ctx.runQuery(internal.repos.listAllActiveRepos);

		await Promise.all(
			repos.map((repo) => ctx.runAction(internal.orchestrator.syncRepoNow, { repoId: repo._id }))
		);
	}
});

export const runInsightGeneration = internalAction({
	args: {},
	handler: async (ctx) => {
		const repos = await ctx.runQuery(internal.repos.listAllActiveRepos);

		await Promise.all(
			repos.map(async (repo) => {
				await ctx.runAction(internal.insightGenerator.generateInsights, { repoId: repo._id });
				await ctx.runAction(internal.dailyDigests.generateRepoDailyDigest, { repoId: repo._id });
			})
		);
	}
});

export const sendWeeklyReports = internalAction({
	args: {},
	handler: async (ctx) => {
		const profiles = await ctx.runQuery(internal.users.listAllUserProfiles);

		for (const profile of profiles) {
			if (!profile.email || !profile.emailReportsEnabled) continue;

			await ctx.runAction(internal.email.sendWeeklyReport, {
				userId: profile.userId,
				email: profile.email
			});
		}
	}
});
