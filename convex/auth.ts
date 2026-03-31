import GitHub from '@auth/core/providers/github';
import { convexAuth } from '@convex-dev/auth/server';
import { type MutationCtx } from './_generated/server';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		GitHub({
			clientId: process.env.AUTH_GITHUB_ID,
			clientSecret: process.env.AUTH_GITHUB_SECRET,
			profile(profile, tokens) {
				return {
					id: profile.id.toString(),
					name: (profile.name ?? profile.login) as string,
					email: profile.email as string,
					image: profile.avatar_url as string,
					login: profile.login as string,
					githubAccessToken: tokens.access_token as string
				};
			},
			authorization: {
				params: {
					scope: 'read:user user:email repo'
				}
			}
		})
	],
	callbacks: {
		async createOrUpdateUser(ctx: MutationCtx, args) {
			const { existingUserId, profile } = args;
			const ghProfile = profile as {
				login?: string;
				githubAccessToken?: string;
				name?: string;
				email?: string;
				image?: string;
			};

			if (existingUserId) {
				const existingProfile = await ctx.db
					.query('userProfiles')
					.withIndex('by_userId', (q) => q.eq('userId', existingUserId))
					.unique();

				if (existingProfile && ghProfile.githubAccessToken) {
					await ctx.db.patch(existingProfile._id, {
						githubAccessToken: ghProfile.githubAccessToken,
						avatarUrl: ghProfile.image ?? existingProfile.avatarUrl
					});
				}
				return existingUserId;
			}

			const userId = await ctx.db.insert('users', {
				name: ghProfile.name ?? 'User',
				email: ghProfile.email ?? '',
				emailVerificationTime: Date.now(),
				image: ghProfile.image ?? ''
			});

			await ctx.db.insert('userProfiles', {
				userId,
				email: ghProfile.email ?? '',
				githubUsername: ghProfile.login ?? '',
				githubAccessToken: ghProfile.githubAccessToken ?? '',
				avatarUrl: ghProfile.image ?? '',
				plan: 'free',
				emailReportsEnabled: true,
				createdAt: Date.now()
			});

			return userId;
		}
	}
});
