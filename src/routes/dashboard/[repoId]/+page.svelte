<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import {
		ArrowLeft,
		GitBranch,
		Star,
		Activity,
		GitFork,
		Lock,
		Globe,
		Trash2,
		AlertTriangle,
		CheckCircle2,
		Clock,
		RefreshCw
	} from 'lucide-svelte';

	import InsightCard from '$lib/components/dashboard/InsightCard.svelte';
	import TaskChecklist from '$lib/components/dashboard/TaskChecklist.svelte';
	import ShipStreak from '$lib/components/dashboard/ShipStreak.svelte';
	import MomentumGraph from '$lib/components/dashboard/MomentumGraph.svelte';
	import GrowthCardModal from '$lib/components/dashboard/GrowthCardModal.svelte';

	function formatTimeAgo(timestamp: number): string {
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 60) return 'Just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	// Using Id<"repos"> string from URL dynamically
	let repoId = $derived($page.params.repoId);
	const client = useConvexClient();

	// Raw casting as we're passing convex string Ids
	const repoQuery = useQuery(api.dashboard.getRepoDetails, () => ({ repoId: repoId as any }));

	let repo = $derived(repoQuery.data);
	let isLoading = $derived(repoQuery.isLoading);
	let isDisconnecting = $state(false);
	let isSyncing = $state(false);

	async function disconnectRepo() {
		if (!repo || isDisconnecting) return;

		const confirmed = window.confirm(
			`Disconnect ${repo.name}? ShipSense will stop tracking this repository.`
		);
		if (!confirmed) return;

		isDisconnecting = true;
		try {
			await client.mutation(api.repos.disconnectRepo, { repoId: repoId as any });
			await goto('/dashboard');
		} finally {
			isDisconnecting = false;
		}
	}

	async function triggerSync() {
		if (isSyncing) return;
		isSyncing = true;
		try {
			await client.action(api.repos.syncConnectedRepo, { repoId: repoId as any });
		} finally {
			isSyncing = false;
		}
	}
</script>

<svelte:head>
	<title>{repo ? `${repo.name} | ShipSense` : 'Loading Repo...'}</title>
</svelte:head>

<div class="space-y-8 pb-12">
	<!-- Navigation Header back to Dashboard -->
	<div class="flex items-center justify-between">
		<Button
			variant="ghost"
			size="sm"
			href="/dashboard"
			class="group rounded-full bg-white/5 px-4 py-2 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
		>
			<ArrowLeft class="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
			Back to Ecosystem
		</Button>

		<div class="flex items-center gap-3">
			{#if repo}
				<Button
					variant="outline"
					size="sm"
					class="rounded-full border-white/10 bg-white/5 px-4 hover:bg-white/10"
					disabled={isSyncing}
					onclick={triggerSync}
				>
					<RefreshCw class="mr-2 h-4 w-4 {isSyncing ? 'animate-spin' : ''}" />
					{isSyncing ? 'Syncing...' : 'Sync Now'}
				</Button>
				<Button
					variant="destructive"
					size="sm"
					class="rounded-full px-4"
					disabled={isDisconnecting}
					onclick={disconnectRepo}
				>
					<Trash2 class="mr-2 h-4 w-4" />
					{isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
				</Button>
			{/if}
			{#if repo && repo.lastSyncedAt}
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Clock class="h-3 w-3" />
					<span>{formatTimeAgo(repo.lastSyncedAt)}</span>
				</div>
			{/if}
			{#if repo}
				{#if repo.lastError}
					<div class="flex items-center gap-2 text-destructive">
						<AlertTriangle class="h-3 w-3" />
						<span class="text-xs font-medium tracking-widest uppercase">Sync Error</span>
					</div>
				{:else}
					<div
						class="h-2 w-2 animate-pulse rounded-full bg-success shadow-[0_0_8px_rgba(var(--success-rgb),0.6)]"
					></div>
					<span class="text-xs font-medium tracking-widest text-muted-foreground uppercase"
						>Live Sync</span
					>
				{/if}
			{/if}
		</div>
	</div>

	{#if isLoading}
		<div class="grid grid-cols-1 gap-6">
			<div class="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5"></div>
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
				<div
					class="h-[600px] animate-pulse rounded-3xl border border-white/10 bg-white/5 lg:col-span-8"
				></div>
				<div
					class="h-[600px] animate-pulse rounded-3xl border border-white/10 bg-white/5 lg:col-span-4"
				></div>
			</div>
		</div>
	{:else if !repo}
		<div
			class="flex h-96 flex-col items-center justify-center space-y-6 rounded-3xl glass-panel border-white/10 text-center"
		>
			<div
				class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground"
			>
				<Activity class="h-8 w-8" />
			</div>
			<div>
				<h3 class="text-2xl font-bold text-white/90">Repository Not Found</h3>
				<p class="mt-2 max-w-sm text-muted-foreground">
					This repository either doesn't exist or you do not have permission to view it.
				</p>
			</div>
			<Button
				href="/dashboard"
				variant="outline"
				class="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
				>Return to Ecosystem</Button
			>
		</div>
	{:else}
		<!-- Repository Overview Header -->
		<div
			class="relative flex flex-col justify-between gap-8 overflow-hidden rounded-[2.5rem] glass-panel border-white/10 p-8 shadow-2xl transition-all lg:flex-row lg:items-center lg:p-12"
		>
			<div class="z-10 flex w-full items-start gap-8 lg:w-3/5">
				<div
					class="hidden h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-inner sm:flex"
				>
					<GitBranch class="h-10 w-10 text-primary" />
				</div>

				<div class="space-y-3">
					<div class="flex flex-wrap items-center gap-3">
						<h1 class="text-3xl font-black tracking-tight text-white/90 sm:text-5xl">
							{repo.name}
						</h1>
						{#if repo.isPrivate}
							<Badge
								variant="outline"
								class="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
								><Lock class="-mt-0.5 mr-1 inline h-3 w-3" /> Private</Badge
							>
						{:else}
							<Badge
								variant="outline"
								class="rounded-full border-success/20 bg-success/5 px-3 py-1 text-[10px] font-bold tracking-widest text-success uppercase"
								><Globe class="-mt-0.5 mr-1 inline h-3 w-3" /> Public</Badge
							>
						{/if}
					</div>

					<p class="flex items-center gap-3 text-lg text-muted-foreground">
						<span class="font-medium text-white/60">{repo.owner}</span>
						{#if repo.language}
							<span class="h-1.5 w-1.5 rounded-full bg-white/20"></span>
							<span
								class="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1 font-mono text-sm text-primary"
							>
								{repo.language}
							</span>
						{/if}
					</p>

					{#if repo.description}
						<p class="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground/80">
							{repo.description}
						</p>
					{/if}
				</div>
			</div>

			<!-- Key GitHub Metrics -->
			<div
				class="z-10 flex flex-wrap items-center gap-8 rounded-[2rem] border border-white/5 bg-white/[0.03] p-8 lg:border-none lg:bg-transparent lg:p-0"
			>
				<div class="flex flex-col text-center lg:text-left">
					<span
						class="mb-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase lg:justify-start"
						><Star class="h-3 w-3 text-warning/60" /> Stars</span
					>
					<div class="flex items-center gap-2">
						<span class="text-4xl font-black text-white/90">{repo.starsCount}</span>
						{#if repo.starsLast7d && repo.starsLast7d > 0}
							<span class="rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
								+{repo.starsLast7d}
							</span>
						{/if}
					</div>
				</div>

				<div class="hidden h-16 w-px bg-white/10 lg:block"></div>

				<div class="flex flex-col text-center lg:text-left">
					<span
						class="mb-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase lg:justify-start"
						><GitFork class="h-3 w-3 text-primary/60" /> Forks</span
					>
					<span class="text-4xl font-black text-white/90">{repo.forksCount}</span>
				</div>

				<div class="hidden h-16 w-px bg-white/10 lg:block"></div>

				<div class="w-full lg:w-auto">
					<GrowthCardModal repoId={repoId as string} />
				</div>
			</div>
		</div>

		<!-- Main Dashboard Grid -->
		<div class="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
			<!-- Left Column (Heavy Content) -->
			<div class="flex flex-col gap-8 lg:col-span-7 xl:col-span-8">
				<InsightCard repoId={repoId as string} />
				<MomentumGraph repoId={repoId as string} />
			</div>

			<!-- Right Column (Widgets) -->
			<div class="flex flex-col gap-8 lg:col-span-5 xl:col-span-4">
				<ShipStreak repoId={repoId as string} />
				<TaskChecklist repoId={repoId as string} />
			</div>
		</div>
	{/if}
</div>
