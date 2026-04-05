import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

const NOTIFICATION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const createNotification = internalMutation({
	args: {
		userId: v.id('users'),
		type: v.union(
			v.literal('score_drop'),
			v.literal('streak_break'),
			v.literal('streak_milestone'),
			v.literal('sync_complete'),
			v.literal('weekly_report'),
			v.literal('new_task'),
			v.literal('dependency_alert'),
			v.literal('anomaly_alert'),
			v.literal('traffic_alert'),
			v.literal('win')
		),
		title: v.string(),
		message: v.string(),
		repoId: v.optional(v.id('repos')),
		repoName: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		// Prevent duplicate notifications within 5 minutes
		const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
		const now = Date.now();

		const existing = await ctx.db
			.query('notifications')
			.withIndex('by_userId_createdAt', (q) => q.eq('userId', args.userId))
			.order('desc')
			.filter((q) => q.eq(q.field('type'), args.type))
			.filter((q) =>
				args.repoId ? q.eq(q.field('repoId'), args.repoId) : q.eq(q.field('repoId'), null)
			)
			.first();

		if (existing && now - existing.createdAt < DEDUPE_WINDOW_MS) {
			return; // Skip duplicate
		}

		await ctx.db.insert('notifications', {
			userId: args.userId,
			type: args.type,
			title: args.title,
			message: args.message,
			repoId: args.repoId,
			repoName: args.repoName,
			read: false,
			createdAt: now
		});
	}
});

export const getMyNotifications = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const limit = args.limit ?? 50;
		const notifications = await ctx.db
			.query('notifications')
			.withIndex('by_userId_createdAt', (q) => q.eq('userId', userId))
			.order('desc')
			.take(limit);

		// Filter out expired notifications (auto-dismiss after 30 days)
		const now = Date.now();
		return notifications.filter((n) => now - n.createdAt < NOTIFICATION_TTL_MS);
	}
});

export const getUnreadCount = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return 0;

		const notifications = await ctx.db
			.query('notifications')
			.withIndex('by_userId_read', (q) => q.eq('userId', userId).eq('read', false))
			.collect();

		const now = Date.now();
		return notifications.filter((n) => now - n.createdAt < NOTIFICATION_TTL_MS).length;
	}
});

export const markAsRead = mutation({
	args: { notificationId: v.id('notifications') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return;

		const notification = await ctx.db.get(args.notificationId);
		if (!notification || notification.userId !== userId) return;

		await ctx.db.patch(args.notificationId, { read: true });
	}
});

export const markAllAsRead = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return;

		const unread = await ctx.db
			.query('notifications')
			.withIndex('by_userId_read', (q) => q.eq('userId', userId).eq('read', false))
			.collect();

		for (const n of unread) {
			await ctx.db.patch(n._id, { read: true });
		}
	}
});

export const dismissNotification = mutation({
	args: { notificationId: v.id('notifications') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return;

		const notification = await ctx.db.get(args.notificationId);
		if (!notification || notification.userId !== userId) return;

		await ctx.db.delete(args.notificationId);
	}
});

export const cleanupExpiredNotifications = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const allNotifications = await ctx.db.query('notifications').collect();

		for (const n of allNotifications) {
			if (now - n.createdAt > NOTIFICATION_TTL_MS) {
				await ctx.db.delete(n._id);
			}
		}
	}
});
