<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { Card, CardHeader, CardTitle, CardContent } from "$lib/components/ui/card";
  import { TrendingUp, BarChart2, Activity } from "lucide-svelte";
  
  let { repoId } = $props<{ repoId: string }>();

  // Use raw context repoId
  const scoreHistoryQuery = useQuery(api.dashboard.getRepoScoreHistory, () => ({ repoId: repoId as any }));
  
  let history = $derived(scoreHistoryQuery.data || []);
  let isLoading = $derived(scoreHistoryQuery.isLoading);

  // Normalize scores for graph heights (0-100% relative to max)
  let maxScore = $derived(Math.max(10, ...history.map((h: any) => h.healthScore)));
  
  // Format date correctly
  function formatDate(timestamp: number) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
  }
</script>

<Card class="border-border bg-card shadow-sm transition-colors">
  <CardHeader class="pb-3 border-b border-border">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <TrendingUp class="h-4 w-4" />
        </div>
        <div>
          <CardTitle class="text-base font-semibold">Momentum Engine</CardTitle>
          <p class="text-xs text-muted-foreground">Last 7 snapshots (health score trend)</p>
        </div>
      </div>
      
      {#if history.length > 0}
        <div class="flex items-center gap-1.5 px-3 py-1 bg-muted border border-border rounded-full">
          <Activity class="h-3 w-3 text-success" />
          <span class="text-xs font-semibold text-foreground">{history[history.length - 1]?.healthScore || 0}</span>
        </div>
      {/if}
    </div>
  </CardHeader>
  
  <CardContent class="pt-6">
    {#if isLoading}
      <div class="h-40 flex items-end gap-2 justify-between animate-pulse">
        {#each [1, 2, 3, 4, 5, 6, 7] as idx}
          <div class="w-full bg-muted rounded-t-sm" style={`height: ${Math.random() * 80 + 20}%`}></div>
        {/each}
      </div>
    {:else if history.length === 0}
      <div class="h-40 flex flex-col items-center justify-center text-center">
         <div class="h-12 w-12 rounded-full border border-dashed border-border bg-muted/50 flex items-center justify-center text-muted-foreground mb-3">
           <BarChart2 class="h-5 w-5" />
         </div>
         <p class="text-sm font-medium text-muted-foreground">Waiting for first snapshot</p>
         <p class="text-xs text-muted-foreground/60 mt-1">Data will populate after analysis runs.</p>
      </div>
    {:else}
      <div class="h-48 relative flex flex-col">
        
        <!-- Y Axis Lines -->
        <div class="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none pb-6">
          <div class="w-full border-t border-dashed border-border/80"></div>
          <div class="w-full border-t border-dashed border-border/50"></div>
          <div class="w-full border-t border-dashed border-border/30"></div>
          <div class="w-full border-t space-y-0 border-border"></div>
        </div>
        
        <!-- Bars Container -->
        <div class="flex-1 flex items-end justify-between gap-1 sm:gap-2 z-10 px-1 pt-4 pb-0 mb-6 relative">
          {#each history as point, i}
            <div class="group relative flex flex-col justify-end w-full h-full">
              <!-- Bar -->
              <div 
                class="w-full rounded-t-sm bg-gradient-to-t from-primary/50 via-primary/80 to-primary transition-all duration-500 ease-out hover:brightness-125 border-t border-primary/50"
                style={`height: ${(point.healthScore / maxScore) * 100}%`}
              >
                <!-- Score Tooltip on hover -->
                <div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold py-1 px-2 rounded shadow-lg border border-border pointer-events-none">
                  {point.healthScore}
                </div>
              </div>
            </div>
          {/each}
        </div>
        
        <!-- X Axis Labels -->
        <div class="absolute bottom-0 inset-x-0 flex justify-between h-6 px-1">
          {#each history as point}
            <div class="w-full text-center">
              <span class="text-[9px] text-muted-foreground font-medium tracking-wider uppercase whitespace-nowrap">
                {formatDate(point.calculatedAt)}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </CardContent>
</Card>
