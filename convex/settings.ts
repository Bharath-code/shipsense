import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

/**
 * Returns the current user's full profile including plan + billing info.
 * Admin users always get Builder access during development.
 */
export const getMyProfile = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;
		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		if (!profile) return null;

		// Admin override — always return Builder during development
		const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()).filter(Boolean) ?? [];
		const isAdmin = adminIds.includes(userId);
		const plan = isAdmin ? 'builder' : profile.plan;

		// Count active repos
		const repoCount = await ctx.db
			.query('repos')
			.withIndex('by_userId_isActive', (q) => q.eq('userId', userId).eq('isActive', true))
			.collect();

		return {
			plan,
			dodoCustomerId: profile.dodoCustomerId ?? null,
			dodoSubscriptionId: profile.dodoSubscriptionId ?? null,
			emailReportsEnabled: profile.emailReportsEnabled,
			showFullDashboard: profile.showFullDashboard ?? false,
			benchmarkOptOut: profile.benchmarkOptOut ?? false,
			githubUsername: profile.githubUsername,
			activeRepoCount: repoCount.length
		};
	}
});

/**
 * Returns the Dodo Payments checkout URL for a given product (plan upgrade).
 * In production, this calls the Dodo API to generate a checkout session.
 * For now, returns a configured URL from env vars or falls back to a placeholder.
 */
export const getCheckoutUrl = mutation({
	args: {
		productId: v.string()
	},
	handler: async (ctx, { productId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const profile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		if (!profile) throw new Error('Profile not found');

		// Dodo Payments checkout URL format:
		// https://payments.dodo.io/checkout/{checkout_id}?customer_email=...&metadata[userId]=...
		// Replace with your actual Dodo checkout link / API call
		const baseUrl = process.env.DODO_CHECKOUT_BASE_URL;
		if (baseUrl) {
			const url = new URL(baseUrl);
			url.searchParams.set('product_id', productId);
			url.searchParams.set('customer_id', profile.dodoCustomerId ?? '');
			url.searchParams.set('metadata[userId]', userId);
			return url.toString();
		}

		// Fallback: construct a URL from env vars
		const domain = process.env.DODO_CHECKOUT_DOMAIN ?? 'https://payments.dodo.io';
		const checkoutId = productId; // Use product ID as checkout identifier
		return `${domain}/checkout/${checkoutId}?customer_id=${profile.dodoCustomerId ?? ''}&metadata[userId]=${encodeURIComponent(userId)}`;
	}
});
