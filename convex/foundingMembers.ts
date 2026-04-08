import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

export const FOUNDING_MEMBER_SPOTS = 50;

/**
 * Public query — returns how many founding member spots have been claimed.
 * Used by the landing page to show the urgency counter.
 */
export const getFoundingMemberCount = query({
	args: {},
	handler: async (ctx) => {
		const members = await ctx.db.query('foundingMembers').collect();
		return members.length;
	}
});

/**
 * Public query — checks if the current user has already claimed a founding member spot.
 */
export const isFoundingMember = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return false;
		const member = await ctx.db
			.query('foundingMembers')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		return member !== null;
	}
});

/**
 * Internal mutation — called by the DodoPayments webhook when an Indie subscription
 * is activated. Claims a founding member spot if spots are still available and the
 * user hasn't already claimed one.
 *
 * Returns true if a spot was claimed, false if spots are full or user already claimed.
 */
export const claimFoundingMemberSpot = internalMutation({
	args: {
		userId: v.id('users'),
		subscriptionId: v.optional(v.string())
	},
	handler: async (ctx, { userId, subscriptionId }) => {
		// Check if user already claimed
		const existing = await ctx.db
			.query('foundingMembers')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		if (existing) return false;

		// Check if spots are still available
		const count = await ctx.db.query('foundingMembers').collect();
		if (count.length >= FOUNDING_MEMBER_SPOTS) return false;

		// Claim the spot
		await ctx.db.insert('foundingMembers', {
			userId,
			claimedAt: Date.now(),
			subscriptionId
		});
		return true;
	}
});

/**
 * Public mutation — allows the current authenticated user to manually claim a
 * founding member spot (e.g. when they purchase Indie at the founding member rate).
 * This is the user-facing entry point; the webhook mutation handles the backend confirmation.
 */
export const claimMyFoundingMemberSpot = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		// Check if user already claimed
		const existing = await ctx.db
			.query('foundingMembers')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		if (existing) return { claimed: false, reason: 'already_claimed' as const };

		// Check if spots are still available
		const count = await ctx.db.query('foundingMembers').collect();
		if (count.length >= FOUNDING_MEMBER_SPOTS) {
			return { claimed: false, reason: 'spots_full' as const };
		}

		// Claim the spot
		await ctx.db.insert('foundingMembers', {
			userId,
			claimedAt: Date.now()
		});
		return { claimed: true, reason: null };
	}
});
