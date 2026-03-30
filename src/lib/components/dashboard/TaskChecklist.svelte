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

<Card class="border-border bg-card shadow-sm transition-colors">
	<CardHeader class="border-b border-border pb-3">
		<div class="flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
						<div class="h-5 w-5 animate-pulse rounded-full bg-muted"></div>
						<div class="h-4 w-full animate-pulse rounded bg-muted"></div>
					</div>
				{/each}
			</div>
		{:else if tasks.length === 0}
			<div class="flex flex-col items-center justify-center space-y-3 py-8 text-center">
				<div class="rounded-full bg-muted p-3 text-success/50">
					<CheckCircle2 class="h-6 w-6" />
				</div>
				<div>
					<h4 class="mb-1 text-sm font-medium text-foreground">You're all caught up!</h4>
					<p class="max-w-[200px] text-xs text-muted-foreground">
						No pending tasks for this repository right now.
					</p>
				</div>
			</div>
		{:else}
			<div class="space-y-3">
				{#each tasks as task (task._id)}
					<div
						class="group flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 transition-all hover:bg-muted/30"
						transition:fade={{ duration: 200 }}
					>
						<!-- Checkbox alternative -->
						<button
							class="mt-0.5 shrink-0"
							aria-label="Mark task as complete"
							onclick={() => client.mutation(api.dashboard.completeTask, { taskId: task._id })}
						>
							<Circle
								class="h-5 w-5 text-muted-foreground/50 transition-colors hover:fill-success/10 hover:text-success"
							/>
						</button>

						<div class="flex-1">
							<p class="mt-0.5 text-sm leading-snug text-foreground">{task.taskText}</p>

							<div class="mt-2 flex items-center gap-2">
								<span
									class={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
										task.taskType === 'commit'
											? 'border-primary/20 bg-primary/10 text-primary'
											: task.taskType === 'pr'
												? 'border-blue-500/20 bg-blue-500/10 text-blue-500'
												: task.taskType === 'issue'
													? 'border-warning/20 bg-warning/10 text-warning'
													: 'border-border bg-muted text-muted-foreground'
									}`}
								>
									{task.taskType.toUpperCase()}
								</span>

								{#if task.priority === 1}
									<span class="flex items-center text-[10px] font-medium text-destructive">
										<span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-destructive"></span> High Priority
									</span>
								{:else if task.priority === 2}
									<span class="flex items-center text-[10px] font-medium text-warning">
										<span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-warning"></span> Medium Priority
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
