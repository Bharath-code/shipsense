import { internalMutation, query, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { internal } from './_generated/api';

// Map product ID → plan name (set DODO_*_PRODUCT_ID in Convex env vars)
function productIdToPlan(productId: string): 'indie' | 'builder' | 'free' {
	if (productId === process.env.DODO_BUILDER_PRODUCT_ID) return 'builder';
	if (productId === process.env.DODO_INDIE_PRODUCT_ID) return 'indie';
	return 'free';
}

export const activateSubscription = internalMutation({
	args: {
		customerId: v.string(),
		subscriptionId: v.string(),
		productId: v.string()
	},
	handler: async (ctx, { customerId, subscriptionId, productId }) => {
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_dodoCustomerId', (q) => q.eq('dodoCustomerId', customerId))
			.unique();

		if (!profile) return;

		const plan = productIdToPlan(productId);
		await ctx.db.patch(profile._id, {
			plan,
			dodoSubscriptionId: subscriptionId
		});

		// Auto-claim founding member spot for Indie subscribers
		if (plan === 'indie') {
			await ctx.runMutation(internal.foundingMembers.claimFoundingMemberSpot, {
				userId: profile.userId,
				subscriptionId
			});
		}
	}
});

export const cancelSubscription = internalMutation({
	args: { customerId: v.string() },
	handler: async (ctx, { customerId }) => {
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_dodoCustomerId', (q) => q.eq('dodoCustomerId', customerId))
			.unique();

		if (!profile) return;

		await ctx.db.patch(profile._id, {
			plan: 'free',
			dodoSubscriptionId: undefined
		});
	}
});

export const changePlan = internalMutation({
	args: { customerId: v.string(), productId: v.string() },
	handler: async (ctx, { customerId, productId }) => {
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_dodoCustomerId', (q) => q.eq('dodoCustomerId', customerId))
			.unique();

		if (!profile) return;

		const plan = productIdToPlan(productId);
		await ctx.db.patch(profile._id, { plan });
	}
});

// Query for current user plan (used in feature gates)
export const getMyPlan = internalQuery({
	args: { userId: v.id('users') },
	handler: async (ctx, { userId }) => {
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();
		return profile?.plan ?? 'free';
	}
});

// Public query — safe for frontend to call
export const getUserPlan = query({
	args: {},
	handler: async (ctx): Promise<'free' | 'indie' | 'builder'> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return 'free';
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();
		return (profile?.plan as 'free' | 'indie' | 'builder') ?? 'free';
	}
});
