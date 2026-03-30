<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { Card, CardHeader, CardTitle, CardContent } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Sparkles, AlertTriangle, CheckCircle, Activity } from "lucide-svelte";

  let { repoId } = $props<{ repoId: string }>();

  // Fetch insights
  const insightsQuery = useQuery(api.dashboard.getRepoInsights, () => ({ repoId: repoId as any }));
  let insights = $derived(insightsQuery.data);
  let isLoading = $derived(insightsQuery.isLoading);
</script>

<Card class="border-border bg-card shadow-sm transition-colors">
  <CardHeader class="pb-3 border-b border-border">
    <div class="flex items-center gap-2">
      <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Sparkles class="h-4 w-4" />
      </div>
      <div>
        <CardTitle class="text-base font-semibold">AI Insights</CardTitle>
        <p class="text-xs text-muted-foreground">Powered by Gemini</p>
      </div>
    </div>
  </CardHeader>
  
  <CardContent class="pt-5 space-y-6">
    {#if isLoading}
      <div class="space-y-3 animate-pulse">
        <div class="h-4 bg-muted rounded w-3/4"></div>
        <div class="h-4 bg-muted rounded w-full"></div>
        <div class="h-4 bg-muted rounded w-5/6"></div>
      </div>
    {:else if !insights}
      <div class="text-center py-6 text-muted-foreground flex flex-col items-center">
        <Activity class="h-8 w-8 py-1 opacity-20" />
        <p class="mt-2 text-sm">No insights generated yet.</p>
        <p class="text-xs">Check back soon.</p>
      </div>
    {:else}
      <!-- Summary -->
      <div>
        <h4 class="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Summary</h4>
        <p class="text-sm text-foreground leading-relaxed group-hover:text-primary transition-colors">
          {insights.summary}
        </p>
      </div>
      
      <!-- Risk Assessment -->
      <div class="p-3 rounded-lg border border-border bg-muted/30 flex items-start gap-3">
        {#if insights.risk.toLowerCase().includes("high") || insights.risk.toLowerCase().includes("critical")}
          <div class="mt-0.5 text-destructive"><AlertTriangle class="h-4 w-4" /></div>
        {:else if insights.risk.toLowerCase().includes("medium")}
          <div class="mt-0.5 text-warning"><AlertTriangle class="h-4 w-4" /></div>
        {:else}
          <div class="mt-0.5 text-success"><CheckCircle class="h-4 w-4" /></div>
        {/if}
        <div>
          <h4 class="text-xs font-semibold text-muted-foreground">Risk Assessment</h4>
          <p class="text-sm text-foreground mt-1">{insights.risk}</p>
        </div>
      </div>
      
      <!-- Recommended Actions -->
      {#if insights.actions && insights.actions.length > 0}
        <div>
          <h4 class="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Recommended Actions</h4>
          <ul class="space-y-2">
            {#each insights.actions as action}
              <li class="flex items-start gap-2 text-sm text-foreground">
                <span class="text-primary shrink-0 mt-1">•</span>
                <span>{action}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
