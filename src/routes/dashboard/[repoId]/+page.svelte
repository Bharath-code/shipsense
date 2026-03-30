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
    <Button variant="ghost" size="sm" href="/dashboard" class="text-muted-foreground hover:text-foreground group transition-colors px-2">
      <ArrowLeft class="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
      Back to Dashboard
    </Button>
  </div>

  {#if isLoading}
    <!-- Loading Skeleton Header -->
    <div class="h-28 border border-border rounded-xl bg-card p-6 animate-pulse flex items-start gap-4">
      <div class="h-12 w-12 rounded-lg bg-muted"></div>
      <div class="space-y-3 flex-1">
        <div class="h-5 bg-muted rounded w-1/3"></div>
        <div class="h-4 bg-muted rounded w-1/4"></div>
      </div>
    </div>
  {:else if !repo}
    <div class="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-lg text-center space-y-4">
      <div class="h-12 w-12 rounded-full border border-border bg-muted flex items-center justify-center">
        <Activity class="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <h3 class="text-lg font-medium text-foreground">Repository Not Found</h3>
        <p class="text-sm text-muted-foreground max-w-sm mt-1">This repository either doesn't exist or you do not have permission to view it.</p>
      </div>
      <Button href="/dashboard" variant="outline" class="mt-4 border-border bg-muted text-foreground hover:bg-muted/80">Return to Dashboard</Button>
    </div>
  {:else}
    <!-- Repository Overview Header -->
    <div class="border border-border rounded-xl bg-card p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:items-center justify-between shadow-sm relative overflow-hidden transition-colors">
      
      <!-- Aesthetic Glows -->
      <div class="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[64px] pointer-events-none"></div>
      
      <div class="flex items-start gap-4 sm:gap-6 z-10 w-full lg:w-3/5">
        <!-- Logo/Avatar block -->
        <div class="hidden sm:flex h-16 w-16 bg-gradient-to-br from-muted to-muted/80 border border-border/50 rounded-xl items-center justify-center shadow-inner">
          <GitBranch class="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{repo.name}</h1>
            {#if repo.isPrivate}
              <Badge variant="outline" class="border-border text-muted-foreground bg-muted uppercase text-[10px] tracking-widest"><Lock class="h-3 w-3 inline mr-1 -mt-0.5" /> Private</Badge>
            {:else}
              <Badge variant="outline" class="border-success/20 text-success bg-success/10 uppercase text-[10px] tracking-widest"><Globe class="h-3 w-3 inline mr-1 -mt-0.5" /> Public</Badge>
            {/if}
          </div>
          
          <p class="text-sm text-muted-foreground flex items-center gap-2">
            <span class="text-muted-foreground/80">{repo.owner}</span>
            {#if repo.language}
              <span class="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
              <span class="flex items-center text-foreground/80 gap-1.5 text-xs font-mono bg-muted/50 px-2 py-0.5 rounded">
                <span class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></span>
                {repo.language}
              </span>
            {/if}
          </p>
          
          {#if repo.description}
            <p class="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">{repo.description}</p>
          {/if}
        </div>
      </div>
      
      <!-- Key GitHub Metrics -->
      <div class="grid grid-cols-2 lg:flex gap-4 sm:gap-8 z-10 p-4 rounded-lg bg-muted/20 border border-border/50 min-w-max items-center">
        <div class="flex flex-col">
          <span class="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1 flex items-center gap-1.5"><Star class="h-3 w-3" /> Stars</span>
          <span class="text-2xl font-bold text-foreground">{repo.starsCount}</span>
        </div>
        
        <div class="w-px h-10 bg-border hidden lg:block"></div>
        
        <div class="flex flex-col mb-4 lg:mb-0">
          <span class="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1 flex items-center gap-1.5"><GitFork class="h-3 w-3" /> Forks</span>
          <span class="text-2xl font-bold text-foreground">{repo.forksCount}</span>
        </div>
        
        <div class="w-px h-10 bg-border hidden lg:block"></div>
        
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
