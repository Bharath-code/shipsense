<script lang="ts">
  import './layout.css';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';
  import { setupConvex } from 'convex-svelte';

  let { children } = $props();

  // Set up Convex client globally, providing reactive queries to all children
  setupConvex(PUBLIC_CONVEX_URL);
</script>

<svelte:head>
  <title>ShipSense | AI Repo Growth Intelligence</title>
</svelte:head>

<div class="min-h-screen bg-black text-white selection:bg-zinc-800">
  {@render children()}
</div>
