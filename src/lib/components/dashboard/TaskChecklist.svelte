<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { ListTodo, CheckCircle2, Circle } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	let { repoId } = $props<{ repoId: string }>();

	// Use raw context repoId
	const tasksQuery = useQuery(api.dashboard.getRepoTasks, () => ({ repoId: repoId as any }));
	const client = useConvexClient();

	let tasks = $derived(tasksQuery.data || []);
	let isLoading = $derived(tasksQuery.isLoading);
</script>

<div class="group flex flex-col rounded-[2rem] glass-panel border-white/10 p-8 shadow-2xl">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
			>
				<ListTodo class="h-6 w-6" />
			</div>
			<div>
				<h3 class="text-xl font-bold text-white/90">Priority Delta</h3>
				<p class="text-xs font-medium tracking-tight text-muted-foreground/60">
					Deterministic actionable steps
				</p>
			</div>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto">
		{#if isLoading}
			<div class="space-y-4">
				{#each [1, 2, 3] as _}
					<div class="flex items-center space-x-4">
						<div class="h-6 w-6 animate-pulse rounded-full bg-white/5"></div>
						<div class="h-5 w-full animate-pulse rounded-xl bg-white/5"></div>
					</div>
				{/each}
			</div>
		{:else if tasks.length === 0}
			<div class="flex flex-col items-center justify-center space-y-4 py-8 text-center">
				<div class="rounded-full bg-white/5 p-4 text-success/40">
					<CheckCircle2 class="h-8 w-8" />
				</div>
				<div>
					<h4 class="text-lg font-bold text-white/80">Clear Horizon</h4>
					<p class="max-w-[180px] text-xs leading-relaxed text-muted-foreground/60 italic">
						"The best way to predict the future is to ship it."
					</p>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				{#each tasks as task (task._id)}
					<div
						class="group flex items-start gap-4 rounded-3xl border border-white/5 bg-white/5 p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-xl"
						transition:fade={{ duration: 200 }}
					>
						<button
							class="mt-1 shrink-0 transition-transform active:scale-95"
							aria-label="Mark task as complete"
							onclick={() => client.mutation(api.dashboard.completeTask, { taskId: task._id })}
						>
							<Circle
								class="h-6 w-6 text-muted-foreground/30 transition-colors group-hover:text-success/50"
							/>
						</button>

						<div class="flex-1 space-y-3">
							<p class="text-sm leading-relaxed font-medium text-white/80">
								{task.taskText}
							</p>

							<div class="flex items-center gap-3">
								<span
									class={`rounded-lg border px-2.5 py-1 text-[9px] font-black tracking-widest uppercase transition-colors ${
										task.taskType === 'commit'
											? 'border-primary/20 bg-primary/10 text-primary'
											: task.taskType === 'pr'
												? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
												: task.taskType === 'anomaly'
													? 'border-destructive/20 bg-destructive/10 text-destructive'
													: 'border-white/10 bg-white/5 text-muted-foreground'
									}`}
								>
									{task.taskType}
								</span>

								{#if task.priority === 1}
									<span class="flex items-center gap-1.5 text-[10px] font-bold text-destructive/80">
										<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive"></span>
										CRITICAL
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
