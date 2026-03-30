<script lang="ts">
  import { page } from "$app/stores";
  import { useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { ArrowLeft, GitBranch, Star, Activity, GitFork, Lock, Globe } from "lucide-svelte";
  
  import InsightCard from "$lib/components/dashboard/InsightCard.svelte";
  import TaskChecklist from "$lib/components/dashboard/TaskChecklist.svelte";
  import ShipStreak from "$lib/components/dashboard/ShipStreak.svelte";
  import MomentumGraph from "$lib/components/dashboard/MomentumGraph.svelte";
  import GrowthCardModal from "$lib/components/dashboard/GrowthCardModal.svelte";

  // Using Id<"repos"> string from URL dynamically
  let repoId = $derived($page.params.repoId);

  // Raw casting as we're passing convex string Ids
  const repoQuery = useQuery(api.dashboard.getRepoDetails, () => ({ repoId: repoId as any }));
  
  let repo = $derived(repoQuery.data);
  let isLoading = $derived(repoQuery.isLoading);
</script>

<svelte:head>
  <title>{repo ? `${repo.name} | ShipSense` : 'Loading Repo...'}</title>
</svelte:head>

<div class="space-y-6 pb-12">
  
  <!-- Navigation Header back to Dashboard -->
  <div class="flex items-center gap-2 -ml-2 mb-2">
    <Button variant="ghost" size="sm" href="/dashboard" class="text-zinc-400 hover:text-white group transition-colors px-2">
      <ArrowLeft class="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
      Back to Dashboard
    </Button>
  </div>

  {#if isLoading}
    <!-- Loading Skeleton Header -->
    <div class="h-28 border border-zinc-800 rounded-xl bg-zinc-950 p-6 animate-pulse flex items-start gap-4">
      <div class="h-12 w-12 rounded-lg bg-zinc-800/50"></div>
      <div class="space-y-3 flex-1">
        <div class="h-5 bg-zinc-800/50 rounded w-1/3"></div>
        <div class="h-4 bg-zinc-800/50 rounded w-1/4"></div>
      </div>
    </div>
  {:else if !repo}
    <div class="h-64 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg text-center space-y-4">
      <div class="h-12 w-12 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center">
        <Activity class="h-5 w-5 text-zinc-600" />
      </div>
      <div>
        <h3 class="text-lg font-medium">Repository Not Found</h3>
        <p class="text-sm text-zinc-500 max-w-sm mt-1">This repository either doesn't exist or you do not have permission to view it.</p>
      </div>
      <Button href="/dashboard" variant="outline" class="mt-4 border-zinc-700 bg-zinc-900 text-white">Return to Dashboard</Button>
    </div>
  {:else}
    <!-- Repository Overview Header -->
    <div class="border border-zinc-800 rounded-xl bg-zinc-950 p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:items-center justify-between shadow-sm relative overflow-hidden">
      
      <!-- Aesthetic Glows -->
      <div class="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[64px] pointer-events-none"></div>
      
      <div class="flex items-start gap-4 sm:gap-6 z-10 w-full lg:w-3/5">
        <!-- Logo/Avatar block -->
        <div class="hidden sm:flex h-16 w-16 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-xl items-center justify-center shadow-inner">
          <GitBranch class="h-8 w-8 text-zinc-400" />
        </div>
        
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">{repo.name}</h1>
            {#if repo.isPrivate}
              <Badge variant="outline" class="border-zinc-700 text-zinc-400 bg-zinc-900 uppercase text-[10px] tracking-widest"><Lock class="h-3 w-3 inline mr-1 -mt-0.5" /> Private</Badge>
            {:else}
              <Badge variant="outline" class="border-emerald-500/20 text-emerald-400 bg-emerald-500/10 uppercase text-[10px] tracking-widest"><Globe class="h-3 w-3 inline mr-1 -mt-0.5" /> Public</Badge>
            {/if}
          </div>
          
          <p class="text-sm text-zinc-400 flex items-center gap-2">
            <span class="text-zinc-500">{repo.owner}</span>
            {#if repo.language}
              <span class="w-1 h-1 rounded-full bg-zinc-700"></span>
              <span class="flex items-center text-zinc-300 gap-1.5 text-xs font-mono bg-zinc-800/50 px-2 py-0.5 rounded">
                <span class="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></span>
                {repo.language}
              </span>
            {/if}
          </p>
          
          {#if repo.description}
            <p class="text-sm text-zinc-300 mt-3 max-w-xl leading-relaxed opacity-90">{repo.description}</p>
          {/if}
        </div>
      </div>
      
      <!-- Key GitHub Metrics -->
      <div class="grid grid-cols-2 lg:flex gap-4 sm:gap-8 z-10 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 min-w-max items-center">
        <div class="flex flex-col">
          <span class="text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mb-1 flex items-center gap-1.5"><Star class="h-3 w-3" /> Stars</span>
          <span class="text-2xl font-bold text-white">{repo.starsCount}</span>
        </div>
        
        <div class="w-px h-10 bg-zinc-800 hidden lg:block"></div>
        
        <div class="flex flex-col mb-4 lg:mb-0">
          <span class="text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mb-1 flex items-center gap-1.5"><GitFork class="h-3 w-3" /> Forks</span>
          <span class="text-2xl font-bold text-white">{repo.forksCount}</span>
        </div>
        
        <div class="w-px h-10 bg-zinc-800 hidden lg:block"></div>
        
        <div class="col-span-2 lg:col-span-1 mt-2 lg:mt-0 flex justify-center">
          <GrowthCardModal {repoId} />
        </div>
      </div>
    </div>
    
    <!-- Main Dashboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      
      <!-- Left Column: Insights and Checklists (Heavy Content) -->
      <div class="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
        <InsightCard {repoId} />
        <MomentumGraph {repoId} />
      </div>
      
      <!-- Right Column: Streaks and Metrics (Widgets) -->
      <div class="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
        <ShipStreak {repoId} />
        <TaskChecklist {repoId} />
      </div>
      
    </div>
  {/if}
</div>
