import { internalQuery, query } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

// Internal query — looks up token via userId (already resolved)
export const getGithubToken = internalQuery({
	args: { userId: v.id('users') },
	handler: async (ctx, { userId }) => {
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();

		if (!profile) return null;
		return { accessToken: profile.githubAccessToken };
	}
});

export const getUserProfile = internalQuery({
	args: { userId: v.id('users') },
	handler: async (ctx, { userId }) => {
		return await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();
	}
});

// Public query — resolves the currently authenticated user's profile
export const getMyProfile = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		return await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();
	}
});

export const listAllUserProfiles = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('userProfiles').collect();
	}
});
