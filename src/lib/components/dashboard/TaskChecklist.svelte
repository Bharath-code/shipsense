<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { ListTodo, CheckCircle2, Circle, Sparkles, MessageSquare } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { LABELS } from '$lib/constants/labels';
	import IssueReplyModal from '$lib/components/dashboard/IssueReplyModal.svelte';

	let { repoId } = $props<{ repoId: string }>();

	// Use typed query - Convex handles the type conversion internally
	const tasksQuery = useQuery(api.dashboard.getRepoTasks, () => ({ repoId }));
	const client = useConvexClient();

	let tasks = $derived(tasksQuery.data || []);
	let isLoading = $derived(tasksQuery.isLoading);
	let primaryTask = $derived(tasks[0] ?? null);
	let secondaryTasks = $derived(tasks.slice(1));

	// AI Draft state
	let isGeneratingDraft = $state(false);
	let activeDraft = $state<{
		draft: string;
		issueTitle: string;
		issueNumber: number;
		taskId: string;
	} | null>(null);
	let showModal = $state(false);

	function handleGenerateDraft(task: any) {
		if (task.taskType !== 'issue') return;
		isGeneratingDraft = true;

		client.action(api.issueReplyDraft.generateIssueReplyDraft, {
			repoId: repoId as any,
			issueNumber: task.issueNumber
		}).then(async (res) => {
			await client.mutation(api.issueReplyDraft.storeIssueDraft, {
				taskId: task._id,
				draft: res.draft,
				issueTitle: res.issueTitle,
				issueNumber: res.issueNumber
			});

			activeDraft = {
				draft: res.draft,
				issueTitle: res.issueTitle,
				issueNumber: res.issueNumber,
				taskId: task._id
			};
			showModal = true;
			isGeneratingDraft = false;
		}).catch((err) => {
			console.error(err);
			isGeneratingDraft = false;
			alert('Failed to generate draft. Please try again.');
		});
	}

	function handleCompleteDraft() {
		showModal = false;
		activeDraft = null;
		tasksQuery.refresh();
	}

	function closeModal() {
		showModal = false;
		activeDraft = null;
	}

	function sourceLabel(source: string | null | undefined): string {
		if (source === 'anomaly') return 'Anomaly';
		if (source === 'dependency') return 'Dependency';
		if (source === 'readme') return 'README';
		if (source === 'hygiene') return 'Maintenance';
		return 'Trend';
	}
</script>

<div class="group flex flex-col rounded-[2rem] border glass-panel p-8 shadow-2xl">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
			>
				<ListTodo class="h-6 w-6" />
			</div>
			<div>
				<h3 class="text-xl font-bold text-foreground">{LABELS.PRIORITY_DELTA}</h3>
				<p class="text-xs font-medium tracking-tight text-muted-foreground">
					{LABELS.DETERMINISTIC_STEPS}
				</p>
			</div>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto">
		{#if isLoading}
			<div class="space-y-4">
				{#each [1, 2, 3] as _}
					<div class="flex items-center space-x-4">
						<div class="h-6 w-6 animate-pulse rounded-full bg-muted"></div>
						<div class="h-5 w-full animate-pulse rounded-xl bg-muted"></div>
					</div>
				{/each}
			</div>
		{:else if tasks.length === 0}
			<div class="flex flex-col items-center justify-center space-y-4 py-8 text-center">
				<div class="rounded-full bg-muted p-4 text-success/40">
					<CheckCircle2 class="h-8 w-8" />
				</div>
				<div>
					<h4 class="text-lg font-bold text-foreground">Clear Horizon</h4>
					<p class="max-w-[180px] text-xs leading-relaxed text-muted-foreground italic">
						"The best way to predict the future is to ship it."
					</p>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				{#if primaryTask}
					<div
						class="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.08)]"
					>
						<div class="mb-3 flex items-center justify-between gap-3">
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<p class="text-sm font-medium text-foreground">{primaryTask.taskText}</p>
									<button
										type="button"
										onclick={() =>
											client.mutation(api.dashboard.completeTask, { taskId: primaryTask._id })
										}
										class="shrink-0 transition-transform active:scale-95"
										aria-label="Mark primary task as complete"
									>
										<Circle class="h-6 w-6 text-primary/50 transition-colors hover:text-success" />
									</button>
								</div>
							</div>

							<div class="flex items-center gap-2">
								{#if primaryTask.taskType === 'issue'}
									<button
										type="button"
										disabled={isGeneratingDraft}
										onclick={() => handleGenerateDraft(primaryTask)}
										class="flex h-8 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
									>
										{#if isGeneratingDraft}
											<div class="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
										{:else}
											<Sparkles class="h-3.5 w-3.5" />
										</div>
										Draft Reply
									</button>
								{/if}
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							<span class="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
								{sourceLabel(primaryTask.taskSource)}
							</span>
							<span class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-foreground/70 uppercase">
								Priority {primaryTask.priority}
							</span>
							{#if primaryTask.impactScore}
								<span class="ml-auto flex items-center gap-1 rounded-full border border-success/20 bg-success/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-success uppercase shadow-[0_0_15px_rgba(34,197,94,0.15)]">
									+{primaryTask.impactScore} Health
								</span>
							{/if}
						</div>

						{#if primaryTask.expectedImpact}
							<p class="mt-3 text-xs leading-relaxed text-muted-foreground">
								Expected impact: {primaryTask.expectedImpact}
							</p>
						{/if}
					</div>
				{/if}

				{#if secondaryTasks.length > 0}
					<div class="pt-2">
						<p class="mb-3 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
							Next up
						</p>
					</div>
				{/if}

				{#each secondaryTasks as task (task._id)}
					<div
						class="group flex items-start gap-4 rounded-3xl border bg-muted/50 p-5 transition-all duration-300 hover:bg-muted"
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
							<div class="flex items-center justify-between gap-3">
								<p class="text-sm leading-relaxed font-medium text-foreground">
									{task.taskText}
								</p>
								{#if task.taskType === 'issue'}
									<button
										type="button"
										disabled={isGeneratingDraft}
										onclick={() => handleGenerateDraft(task)}
										class="flex h-7 items-center gap-1.5 rounded-full bg-primary/10 px-2 text-[10px] font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
									>
										{#if isGeneratingDraft}
											<div class="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
										{:else}
											<Sparkles class="h-3 w-3" />
										</div>
										Draft
									</button>
								{/if}
							</div>

							<div class="flex flex-wrap items-center gap-3">
								<span
									class={`rounded-lg border px-2.5 py-1 text-[9px] font-black tracking-widest uppercase transition-colors ${
										task.taskType === 'commit'
											? 'border-primary/20 bg-primary/10 text-primary'
											: task.taskType === 'pr'
												? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
												: task.taskType === 'anomaly'
													? 'border-destructive/20 bg-destructive/10 text-destructive'
													: task.taskType === 'dependency'
														? 'border-orange-500/20 bg-orange-500/10 text-orange-400'
														: task.taskType === 'readme'
															? 'border-violet-500/20 bg-violet-500/10 text-violet-400'
															: 'border-border bg-muted text-muted-foreground'
									}`}
								>
									{task.taskType}
								</span>
								<span class="rounded-lg border border-border bg-muted px-2.5 py-1 text-[9px] font-black tracking-widest text-muted-foreground uppercase">
									{sourceLabel(task.taskSource)}
								</span>

								{#if task.priority === 1}
									<span class="flex items-center gap-1.5 text-[10px] font-bold text-destructive/80">
										<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive"></span>
										CRITICAL
									</span>
								{/if}

								{#if task.impactScore}
									<span class="ml-auto flex items-center gap-1 rounded-full border border-success/20 bg-success/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-success uppercase">
										+{task.impactScore} Health
									</span>
								{/if}
							</div>

							{#if task.expectedImpact}
								<p class="text-xs leading-relaxed text-muted-foreground">
									Expected impact: {task.expectedImpact}
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if showModal && activeDraft}
		<IssueReplyModal
			{...activeDraft}
			onComplete={handleCompleteDraft}
			onClose={closeModal}
		/>
	{/if}
</div>
