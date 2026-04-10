<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { goto } from '$app/navigation';
	import {
		Bell,
		CheckCheck,
		TrendingDown,
		Flame,
		Trophy,
		Mail,
		ClipboardList,
		PackageSearch,
		Siren,
		X,
		RefreshCw,
		PartyPopper,
		Zap
	} from 'lucide-svelte';

	const client = useConvexClient();

	const notificationsQuery = useQuery(api.notifications.getMyNotifications, { limit: 20 });
	const unreadCountQuery = useQuery(api.notifications.getUnreadCount, {});

	let notifications = $derived(notificationsQuery.data || []);
	let unreadCount = $derived(unreadCountQuery.data ?? 0);
	let isOpen = $state(false);
	let dropdownRef = $state<HTMLDivElement | null>(null);

	const typeIcons: Record<string, any> = {
		score_drop: TrendingDown,
		streak_break: Flame,
		streak_milestone: Trophy,
		sync_complete: RefreshCw,
		weekly_report: Mail,
		new_task: ClipboardList,
		dependency_alert: PackageSearch,
		anomaly_alert: Siren,
		traffic_alert: Siren,
		stagnation_nudge: Zap,
		win: PartyPopper
	};

	const typeColors: Record<string, string> = {
		score_drop: 'text-destructive',
		streak_break: 'text-orange-500',
		streak_milestone: 'text-warning',
		sync_complete: 'text-success',
		weekly_report: 'text-primary',
		new_task: 'text-primary',
		dependency_alert: 'text-warning',
		anomaly_alert: 'text-destructive',
		traffic_alert: 'text-orange-500',
		stagnation_nudge: 'text-amber-400',
		win: 'text-success'
	};

	function formatTimeAgo(timestamp: number): string {
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 60) return 'Just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	async function handleNotificationClick(notification: any) {
		if (!notification.read) {
			await client.mutation(api.notifications.markAsRead, {
				notificationId: notification._id
			});
		}
		isOpen = false;
		if (notification.repoId) {
			goto(`/dashboard/${notification.repoId}`);
		}
	}

	async function dismissNotification(e: Event, notificationId: any) {
		e.stopPropagation();
		await client.mutation(api.notifications.dismissNotification, { notificationId });
	}

	async function markAllAsRead() {
		await client.mutation(api.notifications.markAllAsRead, {});
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	// Close on outside click
	function handleClickOutside(e: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	// Focus trap for dropdown
	function handleDropdownKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
			return;
		}
		if (e.key !== 'Tab' || !dropdownRef) return;

		const focusable = dropdownRef.querySelectorAll<HTMLElement>(
			'button, [href], [tabindex]:not([tabindex="-1"])'
		);
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}
</script>

<div
	bind:this={dropdownRef}
	class="relative"
	role="region"
	aria-label="Notification center"
	onkeydown={handleDropdownKeydown}
>
	<button
		type="button"
		onclick={toggleDropdown}
		class="relative flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		aria-label="Notifications"
		aria-haspopup="dialog"
		aria-expanded={isOpen}
	>
		<Bell class="h-5 w-5" aria-hidden="true" />
		{#if unreadCount > 0}
			<span
				class="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white"
			>
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
			role="dialog"
			aria-label="Notifications"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<h3 class="text-sm font-semibold text-foreground">Notifications</h3>
				{#if unreadCount > 0}
					<button
						type="button"
						onclick={markAllAsRead}
						class="flex cursor-pointer items-center gap-1 text-xs text-primary hover:text-primary/80"
					>
						<CheckCheck class="h-3 w-3" />
						Mark all read
					</button>
				{/if}
			</div>

			<!-- List -->
			<ul class="max-h-80 overflow-y-auto" role="list">
				{#if notifications.length === 0}
					<li class="flex flex-col items-center py-8 text-center">
						<Bell class="h-8 w-8 text-muted-foreground/40" />
						<p class="mt-2 text-sm text-muted-foreground">No notifications yet</p>
					</li>
				{:else}
					{#each notifications as notification}
						{@const Icon = typeIcons[notification.type]}
						<li
							class="relative flex items-start gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-muted/50 {notification.read
								? 'opacity-60'
								: ''}"
						>
							<button
								type="button"
								onclick={() => handleNotificationClick(notification)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notification);
								}}
								class="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
								aria-label="{notification.title}: {notification.message}"
							>
								<div
									class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
								>
									<Icon class="h-4 w-4 {typeColors[notification.type]}" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-start justify-between gap-2">
										<p class="text-sm font-medium text-foreground">
											{notification.title}
										</p>
									</div>
									<p class="mt-0.5 text-xs text-muted-foreground">
										{notification.message}
									</p>
									<div class="mt-1 flex items-center gap-2">
										<span class="text-[10px] text-muted-foreground/60">
											{formatTimeAgo(notification.createdAt)}
										</span>
										{#if notification.repoName}
											<span class="text-[10px] text-primary/60">
												{notification.repoName}
											</span>
										{/if}
									</div>
								</div>
							</button>
							<button
								type="button"
								onclick={(e) => dismissNotification(e, notification._id)}
								class="absolute top-3 right-3 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
								aria-label="Dismiss notification"
							>
								<X class="h-3.5 w-3.5" />
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	{/if}
</div>
