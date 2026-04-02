<script lang="ts">
	import { useAuth } from '@mmailaender/convex-auth-svelte/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import { LogOut as LogOutIcon, Keyboard } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';
	import KeyboardShortcutsModal from '$lib/components/dashboard/KeyboardShortcutsModal.svelte';
	import NotificationCenter from '$lib/components/dashboard/NotificationCenter.svelte';
	import { keyboardHandler } from '$lib/stores/keyboard';
	import { TooltipProvider } from '$lib/components/ui/tooltip';

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

<svelte:window onkeydown={handleKeydown} />

<div
	class="relative flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300"
>
	<!-- Ambient Background Glows - Pure CSS -->
	<div class="pointer-events-none fixed inset-0 z-0"></div>

	<!-- Floating Glass Header -->
	<div
		class="fixed top-4 right-4 left-4 z-50 lg:top-6 lg:left-1/2 lg:w-full lg:max-w-5xl lg:-translate-x-1/2 lg:px-4"
	>
		<header
			class="flex h-14 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 shadow-2xl backdrop-blur-2xl lg:h-16 lg:rounded-full lg:px-8"
		>
			<a
				href="/"
				class="flex cursor-pointer items-center gap-2 font-mono font-bold tracking-tighter transition-opacity hover:opacity-80"
			>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] lg:h-8 lg:w-8 lg:rounded-lg"
				>
					S
				</div>
				<span class="hidden sm:inline">ShipSense</span>
			</a>

			<nav class="flex items-center space-x-0.5 text-xs font-medium lg:space-x-1 lg:text-sm">
				<a
					href="/dashboard"
					class="cursor-pointer rounded-full px-2 py-1.5 transition-colors hover:bg-white/5 lg:px-4 lg:py-2 {$page
						.url.pathname === '/dashboard'
						? 'bg-white/10 text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="hidden lg:inline">Overview</span>
					<span class="lg:hidden">Ovr</span>
				</a>
				<a
					href="/dashboard/connect"
					class="cursor-pointer rounded-full px-2 py-1.5 transition-colors hover:bg-white/5 lg:px-4 lg:py-2 {$page.url.pathname.includes(
						'/connect'
					)
						? 'bg-white/10 text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="hidden lg:inline">Connect</span>
					<span class="lg:hidden">Con</span>
				</a>
				<a
					href="/dashboard/settings"
					class="cursor-pointer rounded-full px-2 py-1.5 transition-colors hover:bg-white/5 lg:px-4 lg:py-2 {$page.url.pathname.includes(
						'/settings'
					)
						? 'bg-white/10 text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="hidden lg:inline">Settings</span>
					<span class="lg:hidden">Set</span>
				</a>
			</nav>

			<div class="flex items-center gap-1 lg:gap-2">
				<NotificationCenter />
				<Button
					variant="ghost"
					size="icon"
					title="Keyboard shortcuts (? or Ctrl+K)"
					class="h-8 w-8 rounded-lg bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground lg:h-9 lg:w-9 lg:rounded-full"
					onclick={() =>
						import('$lib/components/dashboard/KeyboardShortcutsModal.svelte').then((m) => {
							import('$lib/stores/keyboard').then((s) => s.showKeyboardShortcutsModal.set(true));
						})}
				>
					<Keyboard class="h-4 w-4" />
				</Button>
				<ThemeToggle />
				<div class="hidden h-4 w-px bg-white/10 lg:block"></div>
				<Button
					variant="ghost"
					size="icon"
					onclick={handleSignOut}
					title="Log out"
					class="h-8 w-8 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 lg:h-9 lg:w-9 lg:rounded-full"
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
