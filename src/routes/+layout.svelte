<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import { setupConvex } from 'convex-svelte';
	import { setupConvexAuth } from '@mmailaender/convex-auth-svelte/svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';

	// Initialize core Convex client
	setupConvex(PUBLIC_CONVEX_URL);

	// Initialize Auth glue
	setupConvexAuth({ convexUrl: PUBLIC_CONVEX_URL });

	let { children } = $props();
</script>

<svelte:head>
	<title>ShipSense | AI Repo Growth Intelligence</title>
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
