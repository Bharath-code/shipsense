import { internalMutation, query } from './_generated/server';
import { v } from 'convex/values';

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
export const getMyPlan = query({
	args: { userId: v.id('users') },
	handler: async (ctx, { userId }) => {
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.unique();
		return profile?.plan ?? 'free';
	}
});
