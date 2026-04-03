<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { HelpTooltip } from '$lib/components/ui/tooltip';
	import { LABELS, MESSAGES, TOOLTIPS } from '$lib/constants/labels';
	import Toast from '$lib/components/ui/toast/toast.svelte';
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
		RefreshCw,
		Share2
	} from 'lucide-svelte';

	import InsightCard from '$lib/components/dashboard/InsightCard.svelte';
	import TaskChecklist from '$lib/components/dashboard/TaskChecklist.svelte';
	import ShipStreak from '$lib/components/dashboard/ShipStreak.svelte';
	import MomentumGraph from '$lib/components/dashboard/MomentumGraph.svelte';
	import ScoreBreakdown from '$lib/components/dashboard/ScoreBreakdown.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import ReadmeScore from '$lib/components/dashboard/ReadmeScore.svelte';
	import DependencyList from '$lib/components/dashboard/DependencyList.svelte';
	import AnomalyAlerts from '$lib/components/dashboard/AnomalyAlerts.svelte';
	import DailyBrief from '$lib/components/dashboard/DailyBrief.svelte';

	// Get repoId from route params
	let repoId = $derived($page.params.repoId as string);

	// Get Convex client
	const client = useConvexClient();

	// Badge modal state
	let showBadgeModal = $state(false);
	let badgeCopied = $state(false);

	const repoQuery2 = useQuery(api.dashboard.getRepoDetails, () => ({ repoId: repoId as any }));
	let repoForBadge = $derived(repoQuery2.data);
	let badgeUrl = $derived(`/api/badge/${repoForBadge?.slug || repoId}.svg`);
	let publicUrl = $derived(`/p/${repoForBadge?.slug || repoId}`);
	let badgeMarkdown = $derived(`![ShipSense Health](https://shipsense.app${badgeUrl})`);

	async function copyBadgeUrl() {
		try {
			await navigator.clipboard.writeText(badgeMarkdown);
			badgeCopied = true;
			setTimeout(() => (badgeCopied = false), 2000);
		} catch {
			// Fallback for older browsers
		}
	}

	// Lazy load GrowthCardModal - only load when modal opens
	let GrowthCardModal = $state<
		typeof import('$lib/components/dashboard/GrowthCardModal.svelte').default | null
	>(null);
	let showGrowthCard = $state(false);

	// Load modal when opened
	$effect(() => {
		if (showGrowthCard && !GrowthCardModal) {
			import('$lib/components/dashboard/GrowthCardModal.svelte').then((module) => {
				GrowthCardModal = module.default;
			});
		}
	});

	// Note: We need to cast repoId to the expected type for convex-svelte
	// This is because route params are strings but Convex expects Id<"repos">
	const repoQuery = useQuery(api.dashboard.getRepoDetails, () => ({ repoId: repoId as any }));

	// Helper function
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

	let repo = $derived(repoQuery.data);
	let isLoading = $derived(repoQuery.isLoading);
	let isDisconnecting = $state(false);
	let isSyncing = $state(false);

	// Toast state for first sync prompt
	let showFirstSyncToast = $state(false);
	let toastDismissed = $state(false);

	// Check localStorage on mount to see if user previously dismissed
	$effect(() => {
		if (!browser) return;
		const dismissed = localStorage.getItem(`shipsense_toast_dismissed_${repoId}`);
		if (dismissed) {
			toastDismissed = true;
		}
	});

	// Check if first sync completed and show toast
	$effect(() => {
		if (!browser || !repo || toastDismissed) return;

		// Check if we have sync data (first sync completed)
		if (repo.lastSyncedAt) {
			// Show toast after a short delay to let the UI settle
			const timer = setTimeout(() => {
				if (!toastDismissed) {
					showFirstSyncToast = true;
				}
			}, 2000);

			return () => clearTimeout(timer);
		}
	});

	function dismissToast() {
		showFirstSyncToast = false;
		toastDismissed = true;
		// Store in localStorage to not show again
		if (browser) {
			localStorage.setItem(`shipsense_toast_dismissed_${repoId}`, 'true');
		}
	}

	async function disconnectRepo() {
		if (!repo || isDisconnecting) return;

		const confirmed = window.confirm(MESSAGES.DISCONNECT_CONFIRM(repo.name));
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
					{isSyncing ? LABELS.SYNCING : LABELS.SYNC_NOW}
				</Button>
				<Button
					variant="destructive"
					size="sm"
					class="rounded-full px-4"
					disabled={isDisconnecting}
					onclick={disconnectRepo}
				>
					<Trash2 class="mr-2 h-4 w-4" />
					{isDisconnecting ? LABELS.DISCONNECTING : LABELS.DISCONNECT}
				</Button>
			{/if}
			{#if repo && repo.lastSyncedAt}
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Clock class="h-3 w-3" />
					<span>{formatTimeAgo(repo.lastSyncedAt)}</span>
				</div>
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
				<h3 class="text-2xl font-bold text-foreground">Repository Not Found</h3>
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
						<h1 class="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
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
						<span class="font-medium text-foreground/60">{repo.owner}</span>
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
						<p class="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
							{repo.description}
						</p>
					{/if}
				</div>
			</div>

			<!-- Key GitHub Metrics -->
			<div
				class="z-10 flex flex-wrap items-center gap-8 rounded-[2rem] border border-white/5 bg-white/[0.03] p-8 lg:border-none lg:bg-transparent lg:p-0"
			>
				<HelpTooltip content={TOOLTIPS.STARS}>
					<div class="flex cursor-help flex-col text-center lg:text-left">
						<span
							class="mb-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase lg:justify-start"
							><Star class="h-3 w-3 text-warning/60" /> {LABELS.STARS}</span
						>
						<div class="flex items-center gap-2">
							<span class="text-4xl font-black text-foreground">{repo.starsCount}</span>
							{#if repo.starsLast7d && repo.starsLast7d > 0}
								<span class="rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
									+{repo.starsLast7d}
								</span>
							{/if}
						</div>
					</div>
				</HelpTooltip>

				<div class="hidden h-16 w-px bg-white/10 lg:block"></div>

				<HelpTooltip content={TOOLTIPS.FORKS}>
					<div class="flex cursor-help flex-col text-center lg:text-left">
						<span
							class="mb-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase lg:justify-start"
							><GitFork class="h-3 w-3 text-primary/60" /> {LABELS.FORKS}</span
						>
						<span class="text-4xl font-black text-foreground">{repo.forksCount}</span>
					</div>
				</HelpTooltip>

				<div class="hidden h-16 w-px bg-white/10 lg:block"></div>

				<div class="w-full lg:w-auto">
					{#if GrowthCardModal}
						{@const GrowthCard = GrowthCardModal}
						<GrowthCard repoId={repoId as string} bind:open={showGrowthCard} />
					{:else}
						<Button
							variant="outline"
							class="border-primary/30 font-medium text-primary transition-all hover:bg-primary/10 hover:text-primary/80"
							onclick={() => (showGrowthCard = true)}
							aria-label={LABELS.SHARE_GROWTH_CARD}
						>
							<Share2 class="mr-2 h-4 w-4" />
							{LABELS.SHARE_GROWTH_CARD}
						</Button>
					{/if}
				</div>

				<div class="w-full lg:w-auto">
					<Button
						variant="outline"
						class="border-primary/30 font-medium text-primary transition-all hover:bg-primary/10 hover:text-primary/80"
						onclick={() => (showBadgeModal = true)}
						aria-label="Get health badge"
					>
						<svg class="mr-2 h-4 w-4" viewBox="0 0 100 20" fill="none">
							<rect width="55" height="20" rx="3" fill="#555" />
							<rect x="55" width="45" height="20" rx="3" fill="#4c1" />
							<text
								x="27"
								y="14"
								fill="#fff"
								font-family="Verdana"
								font-size="11"
								text-anchor="middle">S</text
							>
							<text
								x="77"
								y="14"
								fill="#fff"
								font-family="Verdana"
								font-size="11"
								text-anchor="middle">85</text
							>
						</svg>
						Get Badge
					</Button>
				</div>
			</div>
		</div>

		<!-- Score Breakdown Section -->
		<ScoreBreakdown repoId={repoId as string} />
		<DailyBrief repoId={repoId as string} />

		<!-- Main Dashboard Grid -->
		<div class="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
			<!-- Left Column (Heavy Content) -->
			<div class="flex flex-col gap-8 lg:col-span-7 xl:col-span-8">
				<ErrorBoundary>
					<InsightCard repoId={repoId as string} />
				</ErrorBoundary>
				<ErrorBoundary>
					<MomentumGraph repoId={repoId as string} />
				</ErrorBoundary>
			</div>

			<!-- Right Column (Widgets) -->
			<div class="flex flex-col gap-8 lg:col-span-5 xl:col-span-4">
				<ErrorBoundary>
					<ShipStreak repoId={repoId as string} />
				</ErrorBoundary>
				<ErrorBoundary>
					<ReadmeScore repoId={repoId as string} />
				</ErrorBoundary>
				<ErrorBoundary>
					<AnomalyAlerts repoId={repoId as string} />
				</ErrorBoundary>
				<ErrorBoundary>
					<DependencyList repoId={repoId as string} />
				</ErrorBoundary>
				<ErrorBoundary>
					<TaskChecklist repoId={repoId as string} />
				</ErrorBoundary>
			</div>
		</div>
	{/if}

	<!-- First sync toast prompt -->
	<Toast
		bind:open={showFirstSyncToast}
		title={LABELS.TOAST_FIRST_SYNC_TITLE}
		message={LABELS.TOAST_FIRST_SYNC_MESSAGE}
		type="success"
	>
		<div class="mt-3 flex gap-2">
			<Button
				size="sm"
				class="h-8 rounded-lg bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
				onclick={() => {
					showFirstSyncToast = false;
					showGrowthCard = true;
				}}
			>
				{LABELS.TOAST_SHARE_NOW}
			</Button>
			<Button
				size="sm"
				variant="ghost"
				class="h-8 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
				onclick={dismissToast}
			>
				{LABELS.TOAST_LATER}
			</Button>
		</div>
	</Toast>

	<!-- Badge Modal -->
	{#if showBadgeModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
			onclick={() => (showBadgeModal = false)}
		>
			<div
				class="mx-4 w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-background p-8 shadow-2xl"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-bold text-foreground">Health Badge</h2>
					<button
						type="button"
						onclick={() => (showBadgeModal = false)}
						class="text-muted-foreground hover:text-foreground"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/></svg
						>
					</button>
				</div>

				<!-- Badge Preview -->
				<div class="mb-6 flex justify-center rounded-xl bg-muted/50 p-6">
					<img src={badgeUrl} alt="Health Badge" class="h-5" />
				</div>

				<!-- Markdown Code -->
				<div class="mb-4">
					<p class="mb-2 text-sm font-medium text-muted-foreground">
						Copy this markdown to your README:
					</p>
					<div class="flex items-center gap-2 rounded-lg bg-muted p-3">
						<code class="flex-1 text-xs break-all text-foreground">{badgeMarkdown}</code>
						<button
							type="button"
							onclick={copyBadgeUrl}
							class="shrink-0 cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
						>
							{badgeCopied ? 'Copied!' : 'Copy'}
						</button>
					</div>
				</div>

				<!-- Public Page Link -->
				<div class="mb-6">
					<p class="mb-2 text-sm font-medium text-muted-foreground">Public health page:</p>
					<a href={publicUrl} target="_blank" class="text-sm break-all text-primary hover:underline"
						>{publicUrl}</a
					>
				</div>

				<p class="text-xs text-muted-foreground">
					The badge updates automatically when your health score changes. After deploying, replace
					the relative URL with your app's domain.
				</p>
			</div>
		</div>
	{/if}
</div>
