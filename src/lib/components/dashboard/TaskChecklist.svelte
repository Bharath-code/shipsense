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

<Card class="border-zinc-800 bg-zinc-950 shadow-md">
  <CardHeader class="pb-3 border-b border-zinc-800/50">
    <div class="flex items-center gap-2">
      <div class="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
        <ListTodo class="h-4 w-4" />
      </div>
      <div>
        <CardTitle class="text-base font-semibold">Priority Tasks</CardTitle>
        <p class="text-xs text-zinc-500">Deterministic actionable steps</p>
      </div>
    </div>
  </CardHeader>
  
  <CardContent class="pt-5">
    {#if isLoading}
      <div class="space-y-4">
        {#each [1, 2, 3] as _}
          <div class="flex items-center space-x-3">
            <div class="w-5 h-5 rounded-full bg-zinc-800/50 animate-pulse"></div>
            <div class="h-4 bg-zinc-800/50 rounded w-full animate-pulse"></div>
          </div>
        {/each}
      </div>
    {:else if tasks.length === 0}
      <div class="text-center py-8 flex flex-col items-center justify-center space-y-3">
        <div class="p-3 bg-zinc-900 rounded-full text-emerald-500/50">
          <CheckCircle2 class="h-6 w-6" />
        </div>
        <div>
          <h4 class="text-sm font-medium text-white mb-1">You're all caught up!</h4>
          <p class="text-xs text-zinc-500 max-w-[200px]">No pending tasks for this repository right now.</p>
        </div>
      </div>
    {:else}
      <div class="space-y-3">
        {#each tasks as task (task._id)}
          <div 
            class="group flex items-start gap-3 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-800/30 transition-all"
            transition:fade={{duration: 200}}
          >
            <!-- Checkbox alternative -->
            <button 
              class="shrink-0 mt-0.5"
              aria-label="Mark task as complete"
              onclick={() => client.mutation(api.dashboard.completeTask, { taskId: task._id })}
            >
              <Circle class="h-5 w-5 text-zinc-600 hover:text-emerald-500 hover:fill-emerald-500/10 transition-colors" />
            </button>
            
            <div class="flex-1">
              <p class="text-sm text-zinc-200 mt-0.5 leading-snug">{task.taskText}</p>
              
              <div class="flex items-center gap-2 mt-2">
                <span class={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  task.taskType === 'commit' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                  task.taskType === 'pr' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  task.taskType === 'issue' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {task.taskType.toUpperCase()}
                </span>
                
                {#if task.priority === 1}
                  <span class="text-[10px] flex items-center text-rose-400 font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span> High Priority
                  </span>
                {:else if task.priority === 2}
                  <span class="text-[10px] flex items-center text-amber-400 font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span> Medium Priority
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
