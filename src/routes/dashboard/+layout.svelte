<script lang="ts">
	import { useAuth } from '@mmailaender/convex-auth-svelte/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import { LogOut as LogOutIcon } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';

	const auth = useAuth();
	// ... rest of logic remains same ...
	let wasAuthenticated = $state(false);

	$effect(() => {
		if (auth.isAuthenticated) {
			wasAuthenticated = true;
		}
	});

	$effect(() => {
		const url = $page.url;
		const inOAuthCallback = url.searchParams.has('code') || url.searchParams.has('state');

		if (!auth.isLoading && !auth.isAuthenticated && !inOAuthCallback && !wasAuthenticated) {
			goto('/auth/login');
		}
	});

	async function handleSignOut() {
		wasAuthenticated = false;
		await auth.signOut();
		window.location.href = '/auth/login';
	}

	let { children } = $props();
</script>

<div
	class="relative flex min-h-screen flex-col bg-slate-950 text-foreground transition-colors duration-300"
>
	<!-- Ambient Background Glows -->
	<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
		<div
			class="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] animate-float rounded-full bg-primary/20 opacity-50 blur-[120px]"
		></div>
		<div
			class="absolute right-[-10%] bottom-[10%] h-[30%] w-[30%] animate-pulse rounded-full bg-success/15 opacity-40 blur-[100px]"
		></div>
		<div
			class="absolute top-[30%] right-[10%] h-[25%] w-[25%] animate-float rounded-full bg-warning/10 opacity-30 blur-[80px]"
			style="animation-delay: -2s;"
		></div>
	</div>

	<!-- Floating Glass Header -->
	<div class="fixed top-6 left-1/2 z-50 w-full max-w-5xl -translate-x-1/2 px-4">
		<header
			class="flex h-16 items-center justify-between rounded-full border border-white/10 bg-white/5 px-8 shadow-2xl backdrop-blur-2xl"
		>
			<a
				href="/"
				class="flex items-center gap-2 font-mono font-bold tracking-tighter transition-opacity hover:opacity-80"
			>
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
				>
					S
				</div>
				<span class="hidden sm:inline">ShipSense</span>
			</a>

			<nav class="flex items-center space-x-1 text-sm font-medium">
				<a
					href="/dashboard"
					class="rounded-full px-4 py-2 transition-colors hover:bg-white/5 {$page.url.pathname ===
					'/dashboard'
						? 'bg-white/10 text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					Overview
				</a>
				<a
					href="/dashboard/connect"
					class="rounded-full px-4 py-2 transition-colors hover:bg-white/5 {$page.url.pathname.includes(
						'/connect'
					)
						? 'bg-white/10 text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					Connect
				</a>
				<a
					href="/dashboard/settings"
					class="rounded-full px-4 py-2 transition-colors hover:bg-white/5 {$page.url.pathname.includes(
						'/settings'
					)
						? 'bg-white/10 text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					Settings
				</a>
			</nav>

			<div class="flex items-center gap-2">
				<ThemeToggle />
				<div class="h-4 w-px bg-white/10"></div>
				<Button
					variant="ghost"
					size="icon"
					onclick={handleSignOut}
					title="Log out"
					class="rounded-full bg-white/5 hover:bg-red-500/10 hover:text-red-400"
				>
					<LogOutIcon class="h-4 w-4" />
				</Button>
			</div>
		</header>
	</div>

	<main class="relative z-10 container mx-auto max-w-7xl flex-1 px-4 pt-32 pb-24">
		{@render children()}
	</main>
</div>
