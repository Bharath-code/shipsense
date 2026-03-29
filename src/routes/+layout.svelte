<script lang="ts">
  import "./layout.css";
  import { setupConvex } from "convex-svelte";
  import { setupConvexAuth } from "@mmailaender/convex-auth-svelte/svelte";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";

  // Initialize core Convex client
  setupConvex(PUBLIC_CONVEX_URL);
  
  // Initialize Auth glue
  setupConvexAuth({ convexUrl: PUBLIC_CONVEX_URL });

  let { children } = $props();
</script>

<svelte:head>
  <title>ShipSense | AI Repo Growth Intelligence</title>
</svelte:head>

<div class="min-h-screen bg-black text-white selection:bg-zinc-800">
  {@render children()}
</div>
