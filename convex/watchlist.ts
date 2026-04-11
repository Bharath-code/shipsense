/**
 * Watchlist — competitive intelligence for any public GitHub repo.
 *
 * Users can watch repos they don't own (competitors, inspirations, etc.)
 * and get side-by-side growth comparisons in their weekly digest.
 *
 * Uses GitHub REST API for public repo data (no auth needed for rate-limited public access).
 * For owned repos, we reuse the existing collector pipeline.
 */

import { v } from 'convex/values';
import { query, mutation, internalMutation, action } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { getAuthUserId } from '@convex-dev/auth/server';

// ─── Public Queries ───────────────────────────────────────────────

/** Get my watchlist */
export const getMyWatchlist = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const watchlist = await ctx.db
			.query('watchlistRepos')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.order('desc')
			.collect();

		return watchlist;
	}
});

/** Get watch limit for current plan */
export const getWatchlistLimit = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return { limit: 0, used: 0 };

		const userProfile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		if (!userProfile) return { limit: 0, used: 0 };

		const limits: Record<string, number> = { free: 1, indie: 3, builder: 3 };
		const limit = limits[userProfile.plan] ?? 0;

		const used = await ctx.db
			.query('watchlistRepos')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.collect()
			.then((rows) => rows.length);

		return { limit, used };
	}
});

// ─── Mutations ────────────────────────────────────────────────────

/** Add a repo to watchlist */
export const addToWatchlist = mutation({
	args: {
		owner: v.string(),
		name: v.string()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const userProfile = await ctx.db
			.query('userProfiles')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		if (!userProfile) throw new Error('User profile not found');

		const limits: Record<string, number> = { free: 1, indie: 3, builder: 3 };
		const limit = limits[userProfile.plan] ?? 0;

		if (limit === 0) {
			throw new Error('Watchlist not available on your plan. Upgrade to add competitor tracking.');
		}

		const used = await ctx.db
			.query('watchlistRepos')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.collect()
			.then((rows) => rows.length);

		if (used >= limit) {
			throw new Error(`Watchlist limit reached (${limit}/${limit}). Upgrade to watch more repos.`);
		}

		const fullName = `${args.owner}/${args.name}`;

		// Check if already watching
		const existing = await ctx.db
			.query('watchlistRepos')
			.withIndex('by_userId_fullName', (q) =>
				q.eq('userId', userId).eq('fullName', fullName)
			)
			.first();

		if (existing) {
			return existing._id;
		}

		// Don't allow watching your own repos
		const ownRepo = await ctx.db
			.query('repos')
			.withIndex('by_userId_isActive', (q) => q.eq('userId', userId).eq('isActive', true))
			.filter((q) => q.eq(q.field('fullName'), fullName))
			.first();

		if (ownRepo) {
			throw new Error('You already track this repo. Use your connected repos for own repos.');
		}

		const id = await ctx.db.insert('watchlistRepos', {
			userId,
			owner: args.owner,
			name: args.name,
			fullName,
			watchedAt: Date.now()
		});

		// Schedule initial sync for this watched repo
		await ctx.scheduler.runAfter(0, internal.watchlist.syncWatchedRepo, {
			watchlistId: id as Id<'watchlistRepos'>
		});

		return id;
	}
});

/** Remove a repo from watchlist */
export const removeFromWatchlist = mutation({
	args: { watchlistId: v.id('watchlistRepos') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const entry = await ctx.db.get(args.watchlistId);
		if (!entry) throw new Error('Watchlist entry not found');
		if (entry.userId !== userId) throw new Error('Not your watchlist entry');

		await ctx.db.delete(args.watchlistId);
	}
});

// ─── Internal: Sync watched repo metrics ──────────────────────────

/**
 * Fetch public metrics for a watched repo from GitHub REST API.
 * No auth required for public repos (rate-limited to 60 req/hr without token,
 * 5000 req/hr with token — we use the user's token if available).
 */
export const syncWatchedRepo = internalMutation({
	args: { watchlistId: v.id('watchlistRepos') },
	handler: async (ctx, args) => {
		const entry = await ctx.db.get(args.watchlistId);
		if (!entry) return;

		try {
			// Get a user token for GitHub API access
			const userProfile = await ctx.db
				.query('userProfiles')
				.withIndex('by_userId', (q) => q.eq('userId', entry.userId))
				.first();
			if (!userProfile) return;

			// Fetch repo data from GitHub
			const githubToken = userProfile.githubAccessToken;
			const url = `https://api.github.com/repos/${entry.fullName}`;

			const response = await fetch(url, {
				headers: {
					Accept: 'application/vnd.github.v3+json',
					Authorization: `Bearer ${githubToken}`,
					'User-Agent': 'ShipSense-Watchlist'
				}
			});

			if (!response.ok) {
				console.warn(`GitHub API error for ${entry.fullName}: ${response.status}`);
				return;
			}

			const data = await response.json();

			await ctx.db.patch(args.watchlistId, {
				starsCount: data.stargazers_count,
				lastSyncedAt: Date.now()
			});
		} catch (err) {
			console.error(`Failed to sync watched repo ${entry.fullName}:`, err);
		}
	}
});

/**
 * Sync ALL watched repos for a user (called from cron).
 */
export const syncAllWatchlistRepos = internalMutation({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const watchlist = await ctx.db
			.query('watchlistRepos')
			.withIndex('by_userId', (q) => q.eq('userId', args.userId))
			.collect();

		for (const entry of watchlist) {
			await ctx.scheduler.runAfter(0, internal.watchlist.syncWatchedRepo, {
				watchlistId: entry._id
			});
		}
	}
});

/**
 * Cron entry: sync all watched repos for all active users.
 * Iterates all userProfiles and schedules syncs for each user with watchlist entries.
 */
export const syncAllActiveUsers = internalMutation({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query('userProfiles').collect();
		for (const user of users) {
			// Check if this user has any watchlist entries
			const count = await ctx.db
				.query('watchlistRepos')
				.withIndex('by_userId', (q) => q.eq('userId', user.userId))
				.collect()
				.then((rows) => rows.length);

			if (count > 0) {
				await ctx.scheduler.runAfter(0, internal.watchlist.syncAllWatchlistRepos, {
					userId: user.userId
				});
			}
		}
	}
});
