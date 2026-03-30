<script lang="ts">
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { Card, CardHeader, CardTitle, CardContent } from "$lib/components/ui/card";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { ListTodo, CheckCircle2, Circle } from "lucide-svelte";
  import { fade } from "svelte/transition";

  let { repoId } = $props<{ repoId: string }>();

  // Use raw context repoId
  const tasksQuery = useQuery(api.dashboard.getRepoTasks, () => ({ repoId: repoId as any }));
  const client = useConvexClient();

  let tasks = $derived(tasksQuery.data || []);
  let isLoading = $derived(tasksQuery.isLoading);
</script>

<Card class="border-border bg-card shadow-sm transition-colors">
  <CardHeader class="pb-3 border-b border-border">
    <div class="flex items-center gap-2">
      <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <ListTodo class="h-4 w-4" />
      </div>
      <div>
        <CardTitle class="text-base font-semibold">Priority Tasks</CardTitle>
        <p class="text-xs text-muted-foreground">Deterministic actionable steps</p>
      </div>
    </div>
  </CardHeader>
  
  <CardContent class="pt-5">
    {#if isLoading}
      <div class="space-y-4">
        {#each [1, 2, 3] as _}
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 rounded-full bg-muted animate-pulse"></div>
            <div class="h-4 bg-muted rounded w-full animate-pulse"></div>
          </div>
        {/each}
      </div>
    {:else if tasks.length === 0}
      <div class="text-center py-8 flex flex-col items-center justify-center space-y-3">
        <div class="p-3 bg-muted rounded-full text-success/50">
          <CheckCircle2 class="h-6 w-6" />
        </div>
        <div>
          <h4 class="text-sm font-medium text-foreground mb-1">You're all caught up!</h4>
          <p class="text-xs text-muted-foreground max-w-[200px]">No pending tasks for this repository right now.</p>
        </div>
      </div>
    {:else}
      <div class="space-y-3">
        {#each tasks as task (task._id)}
          <div 
            class="group flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-all"
            transition:fade={{duration: 200}}
          >
            <!-- Checkbox alternative -->
            <button 
              class="shrink-0 mt-0.5"
              aria-label="Mark task as complete"
              onclick={() => client.mutation(api.dashboard.completeTask, { taskId: task._id })}
            >
              <Circle class="h-5 w-5 text-muted-foreground/50 hover:text-success hover:fill-success/10 transition-colors" />
            </button>
            
            <div class="flex-1">
              <p class="text-sm text-foreground mt-0.5 leading-snug">{task.taskText}</p>
              
              <div class="flex items-center gap-2 mt-2">
                <span class={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  task.taskType === 'commit' ? 'bg-primary/10 text-primary border-primary/20' :
                  task.taskType === 'pr' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                  task.taskType === 'issue' ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-muted text-muted-foreground border-border'
                }`}>
                  {task.taskType.toUpperCase()}
                </span>
                
                {#if task.priority === 1}
                  <span class="text-[10px] flex items-center text-destructive font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5"></span> High Priority
                  </span>
                {:else if task.priority === 2}
                  <span class="text-[10px] flex items-center text-warning font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-warning mr-1.5"></span> Medium Priority
                  </span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>
