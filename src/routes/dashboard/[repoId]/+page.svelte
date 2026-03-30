<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { ArrowLeft, GitBranch, Star, Activity, GitFork, Lock, Globe } from 'lucide-svelte';

	import InsightCard from '$lib/components/dashboard/InsightCard.svelte';
	import TaskChecklist from '$lib/components/dashboard/TaskChecklist.svelte';
	import ShipStreak from '$lib/components/dashboard/ShipStreak.svelte';
	import MomentumGraph from '$lib/components/dashboard/MomentumGraph.svelte';
	import GrowthCardModal from '$lib/components/dashboard/GrowthCardModal.svelte';

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
	<div class="mb-2 -ml-2 flex items-center gap-2">
		<Button
			variant="ghost"
			size="sm"
			href="/dashboard"
			class="group px-2 text-muted-foreground transition-colors hover:text-foreground"
		>
			<ArrowLeft class="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
			Back to Dashboard
		</Button>
	</div>

	{#if isLoading}
		<!-- Loading Skeleton Header -->
		<div
			class="flex h-28 animate-pulse items-start gap-4 rounded-xl border border-border bg-card p-6"
		>
			<div class="h-12 w-12 rounded-lg bg-muted"></div>
			<div class="flex-1 space-y-3">
				<div class="h-5 w-1/3 rounded bg-muted"></div>
				<div class="h-4 w-1/4 rounded bg-muted"></div>
			</div>
		</div>
	{:else if !repo}
		<div
			class="flex h-64 flex-col items-center justify-center space-y-4 rounded-lg border border-dashed border-border text-center"
		>
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted"
			>
				<Activity class="h-5 w-5 text-muted-foreground" />
			</div>
			<div>
				<h3 class="text-lg font-medium text-foreground">Repository Not Found</h3>
				<p class="mt-1 max-w-sm text-sm text-muted-foreground">
					This repository either doesn't exist or you do not have permission to view it.
				</p>
			</div>
			<Button
				href="/dashboard"
				variant="outline"
				class="mt-4 border-border bg-muted text-foreground hover:bg-muted/80"
				>Return to Dashboard</Button
			>
		</div>
	{:else}
		<!-- Repository Overview Header -->
		<div
			class="relative flex flex-col justify-between gap-6 overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-colors lg:flex-row lg:items-center lg:p-8"
		>
			<!-- Aesthetic Glows -->
			<div
				class="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/5 blur-[64px]"
			></div>

			<div class="z-10 flex w-full items-start gap-4 sm:gap-6 lg:w-3/5">
				<!-- Logo/Avatar block -->
				<div
					class="hidden h-16 w-16 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-br from-muted to-muted/80 shadow-inner sm:flex"
				>
					<GitBranch class="h-8 w-8 text-muted-foreground" />
				</div>

				<div class="space-y-1">
					<div class="mb-1 flex flex-wrap items-center gap-2">
						<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
							{repo.name}
						</h1>
						{#if repo.isPrivate}
							<Badge
								variant="outline"
								class="border-border bg-muted text-[10px] tracking-widest text-muted-foreground uppercase"
								><Lock class="-mt-0.5 mr-1 inline h-3 w-3" /> Private</Badge
							>
						{:else}
							<Badge
								variant="outline"
								class="border-success/20 bg-success/10 text-[10px] tracking-widest text-success uppercase"
								><Globe class="-mt-0.5 mr-1 inline h-3 w-3" /> Public</Badge
							>
						{/if}
					</div>

					<p class="flex items-center gap-2 text-sm text-muted-foreground">
						<span class="text-muted-foreground/80">{repo.owner}</span>
						{#if repo.language}
							<span class="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
							<span
								class="flex items-center gap-1.5 rounded bg-muted/50 px-2 py-0.5 font-mono text-xs text-foreground/80"
							>
								<span
									class="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
								></span>
								{repo.language}
							</span>
						{/if}
					</p>

					{#if repo.description}
						<p class="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
							{repo.description}
						</p>
					{/if}
				</div>
			</div>

			<!-- Key GitHub Metrics -->
			<div
				class="z-10 grid min-w-max grid-cols-2 items-center gap-4 rounded-lg border border-border/50 bg-muted/20 p-4 sm:gap-8 lg:flex"
			>
				<div class="flex flex-col">
					<span
						class="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
						><Star class="h-3 w-3" /> Stars</span
					>
					<span class="text-2xl font-bold text-foreground">{repo.starsCount}</span>
				</div>

				<div class="hidden h-10 w-px bg-border lg:block"></div>

				<div class="mb-4 flex flex-col lg:mb-0">
					<span
						class="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
						><GitFork class="h-3 w-3" /> Forks</span
					>
					<span class="text-2xl font-bold text-foreground">{repo.forksCount}</span>
				</div>

				<div class="hidden h-10 w-px bg-border lg:block"></div>

				<div class="col-span-2 mt-2 flex justify-center lg:col-span-1 lg:mt-0">
					<GrowthCardModal {repoId} />
				</div>
			</div>
		</div>

		<!-- Main Dashboard Grid -->
		<div class="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
			<!-- Left Column: Insights and Checklists (Heavy Content) -->
			<div class="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
				<InsightCard {repoId} />
				<MomentumGraph {repoId} />
			</div>

			<!-- Right Column: Streaks and Metrics (Widgets) -->
			<div class="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
				<ShipStreak {repoId} />
				<TaskChecklist {repoId} />
			</div>
		</div>
	{/if}
</div>
