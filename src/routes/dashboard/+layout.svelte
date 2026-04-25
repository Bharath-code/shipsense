<script lang="ts">
	import { useAuth } from '@mmailaender/convex-auth-svelte/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { LogOut as LogOutIcon, Keyboard } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';
	import KeyboardShortcutsModal from '$lib/components/dashboard/KeyboardShortcutsModal.svelte';
	import NotificationCenter from '$lib/components/dashboard/NotificationCenter.svelte';
	import { keyboardHandler } from '$lib/stores/keyboard';
	import { TooltipProvider } from '$lib/components/ui/tooltip';

	const auth = useAuth();

	// The auth library reports isLoading: false when server state has no token,
	// THEN restores from localStorage asynchronously. This creates a race where
	// isLoading=false, isAuthenticated=false → redirect before restoration completes.
	//
	// FIX: Check localStorage directly for the stored JWT. The key is
	// `{normalizedConvexUrl}:__convexAuthJWT` where normalizedConvexUrl is
	// the convex URL with non-alphanumeric chars stripped.
	// If ANY such key exists, the user IS authenticated — just wait.
	// If no such key exists, the user genuinely needs to log in.
	// This is synchronous and race-condition-free.

	const JWT_STORAGE_KEY_SUFFIX = '__convexAuthJWT';

	let hasCheckedAuth = $state(false);

	function hasStoredJwtToken(): boolean {
		if (!browser) return false;
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.endsWith(JWT_STORAGE_KEY_SUFFIX)) {
					return !!localStorage.getItem(key);
				}
			}
		} catch {
			// localStorage may be unavailable
		}
		return false;
	}

	onMount(() => {
		const url = $page.url;
		const inOAuthCallback = url.searchParams.has('code') || url.searchParams.has('state');
		if (inOAuthCallback) {
			hasCheckedAuth = true;
			return;
		}

		// Check localStorage synchronously for a stored JWT
		const hasToken = hasStoredJwtToken();

		if (hasToken || auth.isAuthenticated) {
			// Token exists — user is authenticated, just waiting for restoration
			hasCheckedAuth = true;
			return;
		}

		// No token in localStorage AND not authenticated → redirect
		hasCheckedAuth = true;
		void goto('/auth/login');
	});

	async function handleSignOut() {
		await auth.signOut();
		window.location.href = '/auth/login';
	}

	function handleKeydown(event: KeyboardEvent) {
		keyboardHandler.handleKeydown(event, {
			onGoDashboard: () => goto('/dashboard'),
			onGoSettings: () => goto('/dashboard/settings'),
			onGoConnect: () => goto('/dashboard/connect'),
			onRefreshSync: () => {
				const repoId = $page.params.repoId;
				if (repoId) {
					window.location.reload();
				}
			}
		});
	}

	let { children } = $props();
</script>

<svelte:head>
	<title>Dashboard — ShipSense</title>
	<meta name="description" content="ShipSense dashboard — daily repo health briefs, anomaly alerts, and growth intelligence." />
	<meta name="author" content="ShipSense" />
	<meta name="theme-color" content="#0a0a0a" />
	<meta property="og:site_name" content="ShipSense" />
	<link rel="canonical" href="https://shipsense.app/dashboard" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div
	class="relative flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300"
>
	<!-- Ambient Background Glows -->
	<div class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
		<div
			class="absolute top-[-20%] left-[-10%] h-[50%] w-[50%] animate-pulse-soft rounded-full bg-primary/5 blur-[100px]"
		></div>
		<div
			class="absolute right-[-15%] bottom-[-20%] h-[50%] w-[50%] animate-pulse-soft rounded-full bg-primary/5 blur-[100px]"
			style="animation-delay: 3s;"
		></div>
	</div>

	<!-- Floating Glass Header -->
	<div
		class="fixed top-2 right-2 left-2 z-50 sm:top-3 sm:right-3 sm:left-3 lg:top-6 lg:left-1/2 lg:w-full lg:max-w-5xl lg:-translate-x-1/2 lg:px-4"
	>
		<header
			class="flex h-12 items-center justify-between rounded-xl border border-border bg-background/80 px-3 shadow-2xl backdrop-blur-xl sm:h-14 sm:rounded-2xl sm:px-4 lg:h-16 lg:rounded-full lg:px-8"
		>
			<a
				href="/"
				class="flex cursor-pointer items-center gap-1.5 font-mono font-bold tracking-tighter transition-opacity hover:opacity-80 sm:gap-2"
			>
				<div
					class="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] sm:h-7 sm:w-7 lg:h-8 lg:w-8 lg:rounded-lg"
				>
					S
				</div>
				<span class="hidden sm:inline">ShipSense</span>
			</a>

			<nav class="flex items-center gap-0 text-[10px] font-medium sm:gap-0.5 sm:text-xs lg:gap-1 lg:text-sm">
				<a
					href="/dashboard"
					class="cursor-pointer rounded-full px-1.5 py-1 transition-colors hover:bg-muted sm:px-2 sm:py-1.5 {$page
						.url.pathname === '/dashboard'
						? 'bg-muted text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="hidden lg:inline">Overview</span>
					<span class="lg:hidden">{' '}</span>
				</a>
				<a
					href="/dashboard/connect"
					class="cursor-pointer rounded-full px-1.5 py-1 transition-colors hover:bg-muted sm:px-2 sm:py-1.5 {$page.url.pathname.includes(
						'/connect'
					)
						? 'bg-muted text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="hidden lg:inline">Connect</span>
					<span class="lg:hidden">+</span>
				</a>
				<a
					href="/dashboard/settings"
					class="cursor-pointer rounded-full px-1.5 py-1 transition-colors hover:bg-muted sm:px-2 sm:py-1.5 {$page.url.pathname.includes(
						'/settings'
					)
						? 'bg-muted text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="hidden lg:inline">Settings</span>
					<span class="lg:hidden">⚙</span>
				</a>
			</nav>

			<div class="flex items-center gap-1 lg:gap-2">
				<NotificationCenter />
				<Button
					variant="ghost"
					size="icon"
					title="Keyboard shortcuts (? or Ctrl+K)"
					class="rounded-full hover:bg-muted"
					onclick={() =>
						import('$lib/components/dashboard/KeyboardShortcutsModal.svelte').then((m) => {
							import('$lib/stores/keyboard').then((s) => s.showKeyboardShortcutsModal.set(true));
						})}
				>
					<Keyboard class="h-4 w-4" />
				</Button>
				<ThemeToggle />
				<div class="hidden h-4 w-px bg-border lg:block"></div>
				<Button
					variant="ghost"
					size="icon"
					onclick={handleSignOut}
					title="Log out"
					class="rounded-full hover:bg-red-500/10 hover:text-red-400"
				>
					<LogOutIcon class="h-4 w-4" />
				</Button>
			</div>
		</header>
	</div>

	<main class="relative z-10 container mx-auto max-w-7xl flex-1 px-4 pt-24 pb-16 lg:pt-32 lg:pb-24">
		<TooltipProvider>
			{@render children()}
		</TooltipProvider>
	</main>
</div>

<KeyboardShortcutsModal />
