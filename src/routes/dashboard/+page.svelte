<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Activity, Rocket, Zap, Clock } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import ArrowRightIcon from "lucide-svelte/icons/arrow-right";

  const activeReposQuery = useQuery(api.repos.listMyRepos, {});
  
  let repos = $derived(activeReposQuery.data || []);
  let isLoading = $derived(activeReposQuery.isLoading);
</script>

<svelte:head>
  <title>Dashboard | ShipSense</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-zinc-400 mt-2">Overview of your active repositories and growth scores.</p>
    </div>
    
    <Button href="/dashboard/connect" class="bg-white text-black hover:bg-zinc-200">
      <span class="mr-2">Connect Repository</span>
      <ArrowRightIcon class="h-4 w-4" />
    </Button>
  </div>

  {#if isLoading}
    <div class="flex justify-center p-12 text-zinc-500">Loading your repositories...</div>
  {:else if repos.length === 0}
    <div class="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-lg bg-zinc-950/50">
      <div class="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
        <svg class="h-6 w-6 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-white mb-2">No repositories connected</h3>
      <p class="text-zinc-400 text-center max-w-sm mb-6">
        Get started by connecting a GitHub repository to track its health score and unlock growth insights.
      </p>
      <Button href="/dashboard/connect" class="bg-white text-black hover:bg-zinc-200">
        Connect your first repo
      </Button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each repos as repo}
        <Card class="border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-colors cursor-pointer">
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="text-lg">{repo.name}</CardTitle>
              <!-- Placeholder for health score badge to be added in Phase 3 -->
              <div class="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                --
              </div>
            </div>
            <CardDescription>{repo.owner}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <span class="text-zinc-500 block text-xs">Stars</span>
                <span class="font-medium text-white">{repo.starsCount}</span>
              </div>
              <div>
                <span class="text-zinc-500 block text-xs">Forks</span>
                <span class="font-medium text-white">{repo.forksCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>
