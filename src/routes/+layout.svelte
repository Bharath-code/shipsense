<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import { setConvexClientContext } from 'convex-svelte';
	import { setupConvexAuth } from '@mmailaender/convex-auth-svelte/svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { ConvexClient } from 'convex/browser';

	// Create ONE auth-aware ConvexClient.
	// Pass it to setupConvexAuth so it sets auth tokens on it,
	// AND register it as the convex-svelte context client so
	// useConvexClient() (used for actions) gets the same authenticated instance.
	const client = new ConvexClient(PUBLIC_CONVEX_URL);
	setConvexClientContext(client);
	setupConvexAuth({ convexUrl: PUBLIC_CONVEX_URL, client });

	let { children } = $props();
</script>

<svelte:head>
	<title>ShipSense — Daily Repo Health Intelligence</title>
</svelte:head>

<ModeWatcher />

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
>
	Skip to main content
</a>

<div
	class="min-h-screen bg-background text-foreground transition-colors duration-300 selection:bg-primary/20"
	id="main-content"
>
	{@render children()}
</div>
