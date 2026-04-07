<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { LABELS, MESSAGES } from '$lib/constants/labels';
	import Toast from '$lib/components/ui/toast/toast.svelte';
	import {
		ArrowLeft,
		GitBranch,
		Star,
		GitFork,
		Lock,
		Globe,
		Trash2,
		Activity,
		Clock,
		RefreshCw,
		AlertTriangle,
		ListTodo,
		Share2,
		FileText,
		Package,
		BadgeCheck,
		ExternalLink,
		ChevronRight,
		CheckCircle2,
		Sparkles
	} from 'lucide-svelte';
	import InsightCard from '$lib/components/dashboard/InsightCard.svelte';
	import MomentumGraph from '$lib/components/dashboard/MomentumGraph.svelte';
	import ScoreBreakdown from '$lib/components/dashboard/ScoreBreakdown.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import ReadmeScore from '$lib/components/dashboard/ReadmeScore.svelte';
	import DependencyList from '$lib/components/dashboard/DependencyList.svelte';
	import AnomalyAlerts from '$lib/components/dashboard/AnomalyAlerts.svelte';
	import DailyBrief from '$lib/components/dashboard/DailyBrief.svelte';
	import SharePromptToast from '$lib/components/dashboard/SharePromptToast.svelte';
	import ShipStreak from '$lib/components/dashboard/ShipStreak.svelte';
	import WinCard from '$lib/components/dashboard/WinCard.svelte';
	import TrafficIntelligence from '$lib/components/dashboard/TrafficIntelligence.svelte';
	import ConversionFunnel from '$lib/components/dashboard/ConversionFunnel.svelte';
	import StarForecast from '$lib/components/dashboard/StarForecast.svelte';
	import BenchmarkBadge from '$lib/components/dashboard/BenchmarkBadge.svelte';
	import PaywallBlur from '$lib/components/ui/PaywallBlur.svelte';
	import { onMount } from 'svelte';

	const repoTabs = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'growth', label: 'Growth' },
		{ value: 'health', label: 'Health' },
		{ value: 'tasks', label: 'Tasks' },
		{ value: 'share', label: 'Share' }
	] as const;

	type RepoTab = (typeof repoTabs)[number]['value'];

	function isRepoTab(value: string | null): value is RepoTab {
		// Legacy tab aliases for deep links that used old tab names
		if (value === 'signals' || value === 'traffic') return true;
		return repoTabs.some((tab) => tab.value === value);
	}

	function sourceLabel(source: string | null | undefined): string {
		if (source === 'anomaly') return 'Anomaly';
		if (source === 'dependency') return 'Dependency';
		if (source === 'readme') return 'README';
		if (source === 'hygiene') return 'Maintenance';
		return 'Trend';
	}

	function getReferrerSource(referrer: string): string | null {
		const lower = referrer.toLowerCase();
		if (lower.includes('hacker news') || lower.includes('news.ycombinator')) return 'Hacker News';
		if (lower.includes('reddit')) return 'Reddit';
		if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter';
		if (lower.includes('linkedin')) return 'LinkedIn';
		if (lower.includes('dev.to')) return 'Dev.to';
		if (lower.includes('youtube')) return 'YouTube';
		if (lower.includes('google')) return 'Google Search';
		if (lower.includes('bing') || lower.includes('duckduckgo')) return 'Search';
		return null;
	}

	function trendLabel(trend: 'up' | 'down' | 'stable', hasTrend: boolean): string {
		if (!hasTrend) return 'Baseline';
		if (trend === 'up') return 'Improving';
		if (trend === 'down') return 'Slipping';
		return 'Holding steady';
	}

	function trendTone(trend: 'up' | 'down' | 'stable', hasTrend: boolean): string {
		if (!hasTrend || trend === 'stable') return 'text-muted-foreground';
		return trend === 'up' ? 'text-success' : 'text-destructive';
	}

	function formatMomentum(momentum: number | null | undefined): string {
		if (typeof momentum !== 'number') return 'No prior score';
		if (momentum > 0) return `+${momentum}`;
		if (momentum < 0) return `${momentum}`;
		return '0';
	}

	function scoreTone(score: number | null | undefined): string {
		if (typeof score !== 'number') return 'text-muted-foreground';
		if (score >= 80) return 'text-success';
		if (score >= 60) return 'text-warning';
		if (score >= 40) return 'text-orange-500';
		return 'text-destructive';
	}

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

	function formatStreakSummary(
		lastCommitDate: string | undefined,
		currentStreak: number | undefined
	): string {
		if (!lastCommitDate) return 'No history yet';
		if ((currentStreak ?? 0) > 0) return `${currentStreak} day streak`;
		return 'Streak paused';
	}

	function taskTypeLabel(taskType: string): string {
		if (taskType === 'pr') return 'PR';
		if (taskType === 'issue') return 'Issue';
		if (taskType === 'commit') return 'Commit';
		if (taskType === 'anomaly') return 'Signal';
		return 'General';
	}

	let repoId = $derived($page.params.repoId as string);
	let activeTab = $derived.by<RepoTab>(() => {
		const tab = $page.url.searchParams.get('tab');
		// Map legacy tab names to new structure
		if (tab === 'signals' || tab === 'traffic') return 'growth';
		return isRepoTab(tab) ? tab : 'overview';
	});

	const client = useConvexClient();
	const repoQuery = useQuery(api.dashboard.getRepoDetails, () => ({ repoId: repoId as any }));
	const dailyBriefQuery = useQuery(api.dashboard.getRepoDailyBrief, () => ({
		repoId: repoId as any
	}));
	const tasksQuery = useQuery(api.dashboard.getRepoTasks, () => ({ repoId: repoId as any }));
	const streakQuery = useQuery(api.dashboard.getRepoStreak, () => ({ repoId: repoId as any }));
	const referrersQuery = useQuery(api.collector.getLatestReferrersPublic, () => ({
		repoId: repoId as any
	}));
	const snapshotQuery = useQuery(api.collector.getLatestSnapshotWithTrafficPublic, () => ({
		repoId: repoId as any
	}));
	const funnelQuery = useQuery(api.trafficIntelligence.getConversionFunnel, () => ({
		repoId: repoId as any
	}));
	const planQuery = useQuery(api.billing.getUserPlan, () => ({}));

	let repo = $derived(repoQuery.data);
	let isLoading = $derived(repoQuery.isLoading);
	let dailyBrief = $derived(dailyBriefQuery.data);
	let tasks = $derived(tasksQuery.data || []);
	let streak = $derived(streakQuery.data);
	let snapshot = $derived(snapshotQuery.data);
	let referrers = $derived(referrersQuery.data);
	let funnel = $derived(funnelQuery.data);
	let userPlan = $derived(planQuery.data ?? 'free');
	let primaryTask = $derived(tasks[0] ?? null);
	let groupedTasks = $derived.by(() => {
		const grouped = new Map<string, typeof tasks>();
		for (const task of tasks.slice(1)) {
			const key = sourceLabel(task.taskSource);
			grouped.set(key, [...(grouped.get(key) ?? []), task]);
		}

		return Array.from(grouped.entries()).map(([label, items]) => ({
			label,
			items
		}));
	});

	let isDisconnecting = $state(false);
	let isSyncing = $state(false);
	let showBadgeModal = $state(false);
	let badgeCopied = $state(false);
	let publicLinkCopied = $state(false);

	let showFirstSyncToast = $state(false);
	let toastDismissed = $state(false);

	let GrowthCardModal = $state<
		typeof import('$lib/components/dashboard/GrowthCardModal.svelte').default | null
	>(null);
	let showGrowthCard = $state(false);

	$effect(() => {
		if (showGrowthCard && !GrowthCardModal) {
			import('$lib/components/dashboard/GrowthCardModal.svelte').then((module) => {
				GrowthCardModal = module.default;
			});
		}
	});

	$effect(() => {
		if (!browser) return;
		const dismissed = localStorage.getItem(`shipsense_toast_dismissed_${repoId}`);
		if (dismissed) {
			toastDismissed = true;
		}
	});

	$effect(() => {
		if (!browser || !repo || toastDismissed) return;

		if (repo.lastSyncedAt) {
			const timer = setTimeout(() => {
				if (!toastDismissed) {
					showFirstSyncToast = true;
				}
			}, 2000);

			return () => clearTimeout(timer);
		}
	});

	let badgeUrl = $derived(`/api/badge/${repo?.slug || repoId}.svg`);
	let publicUrl = $derived(`/p/${repo?.slug || repoId}`);
	let badgeMarkdown = $derived(`![ShipSense Health](https://shipsense.app${badgeUrl})`);
	let healthSummary = $derived(
		repo?.hasScore ? `${repo.healthScore}/100` : repo?.lastSyncedAt ? 'Calculating' : 'Pending'
	);

	function dismissToast() {
		showFirstSyncToast = false;
		toastDismissed = true;
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

	async function completeTask(taskId: string) {
		await client.mutation(api.dashboard.completeTask, { taskId: taskId as any });
	}

	async function copyText(value: string, kind: 'badge' | 'public') {
		if (!browser) return;
		try {
			await navigator.clipboard.writeText(value);
			if (kind === 'badge') {
				badgeCopied = true;
				setTimeout(() => (badgeCopied = false), 2000);
			} else {
				publicLinkCopied = true;
				setTimeout(() => (publicLinkCopied = false), 2000);
			}
		} catch {
			// Clipboard fallback is intentionally silent.
		}
	}

	function switchTab(tab: RepoTab) {
		const params = new URLSearchParams($page.url.searchParams);
		if (tab === 'overview') {
			params.delete('tab');
		} else {
			params.set('tab', tab);
		}

		const queryString = params.toString();
		void goto(`${$page.url.pathname}${queryString ? `?${queryString}` : ''}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}
</script>

<svelte:head>
	<title>{repo ? `${repo.name} | ShipSense` : 'Loading Repo...'}</title>
</svelte:head>

<div class="space-y-6 pb-12">
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

		{#if repo}
			<div class="flex items-center gap-3">
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
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="space-y-6">
			<div class="h-56 animate-pulse rounded-[2rem] border border-white/10 bg-white/5"></div>
			<div class="h-14 animate-pulse rounded-2xl border border-white/10 bg-white/5"></div>
			<div class="h-[28rem] animate-pulse rounded-[2rem] border border-white/10 bg-white/5"></div>
		</div>
	{:else if !repo}
		<div
			class="flex h-96 flex-col items-center justify-center space-y-6 rounded-3xl border glass-panel border-white/10 text-center"
		>
			<div
				class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground"
			>
				<Activity class="h-8 w-8" />
			</div>
			<div>
				<h3 class="text-2xl font-bold text-foreground">Repository Not Found</h3>
				<p class="mt-2 max-w-sm text-muted-foreground">
					This repository either doesn&apos;t exist or you do not have permission to view it.
				</p>
			</div>
			<Button
				href="/dashboard"
				variant="outline"
				class="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
			>
				Return to Ecosystem
			</Button>
		</div>
	{:else}
		<div class="overflow-hidden rounded-[2.5rem] border glass-panel border-white/10 shadow-2xl">
			<div
				class="grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.95fr)] xl:p-10"
			>
				<div class="space-y-5">
					<div class="flex flex-wrap items-center gap-3">
						<div
							class="hidden h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent sm:flex"
						>
							<GitBranch class="h-8 w-8 text-primary" />
						</div>

						<div class="min-w-0 space-y-2">
							<div class="flex flex-wrap items-center gap-3">
								<h1 class="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
									{repo.name}
								</h1>
								{#if repo.isPrivate}
									<Badge
										variant="outline"
										class="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
									>
										<Lock class="-mt-0.5 mr-1 inline h-3 w-3" /> Private
									</Badge>
								{:else}
									<Badge
										variant="outline"
										class="rounded-full border-success/20 bg-success/5 px-3 py-1 text-[10px] font-bold tracking-widest text-success uppercase"
									>
										<Globe class="-mt-0.5 mr-1 inline h-3 w-3" /> Public
									</Badge>
								{/if}
							</div>

							<p
								class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground sm:text-base"
							>
								<span class="font-medium text-foreground/60">{repo.owner}</span>
								{#if repo.language}
									<span class="h-1.5 w-1.5 rounded-full bg-white/20"></span>
									<span
										class="rounded-full border border-white/5 bg-white/5 px-3 py-1 font-mono text-xs text-primary sm:text-sm"
									>
										{repo.language}
									</span>
								{/if}
							</p>
						</div>
					</div>

					{#if repo.description}
						<p class="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
							{repo.description}
						</p>
					{/if}

					<div class="flex flex-wrap gap-3 text-sm text-muted-foreground">
						<div
							class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"
						>
							<Star class="h-4 w-4 text-warning" />
							<span class="font-medium text-foreground">{repo.starsCount}</span>
							<span>stars</span>
							{#if repo.starsLast7d > 0}
								<span
									class="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success"
								>
									+{repo.starsLast7d} this week
								</span>
							{/if}
						</div>

						<div
							class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"
						>
							<GitFork class="h-4 w-4 text-primary" />
							<span class="font-medium text-foreground">{repo.forksCount}</span>
							<span>forks</span>
						</div>

						{#if repo.lastSyncedAt}
							<div
								class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"
							>
								<Clock class="h-4 w-4 text-muted-foreground" />
								<span>Synced {formatTimeAgo(repo.lastSyncedAt)}</span>
							</div>
						{/if}
					</div>

					{#if repo.lastError}
						<div class="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
							<div class="flex items-start gap-3">
								<AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
								<div>
									<p class="text-sm font-semibold text-foreground">Last sync needs attention</p>
									<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{repo.lastError}</p>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-3">
					<div class="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
						<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
							Health
						</p>
						<p class="mt-3 text-3xl font-black {scoreTone(repo.healthScore)}">{healthSummary}</p>
						<p class="mt-2 text-sm text-muted-foreground">
							{repo.hasScore
								? 'Current repo health score'
								: repo.lastSyncedAt
									? 'Score is being calculated'
									: 'Run the first sync to score this repo'}
						</p>
					</div>

					<div class="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
						<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
							Trend
						</p>
						<p class="mt-3 text-2xl font-black {trendTone(repo.trend, repo.hasTrend)}">
							{trendLabel(repo.trend, repo.hasTrend)}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">
							{repo.hasTrend
								? `Score delta ${formatMomentum(repo.momentum)}`
								: 'Waiting for a second score'}
						</p>
					</div>

					<div class="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
						<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
							Freshness
						</p>
						<p class="mt-3 text-2xl font-black text-foreground">
							{repo.lastSyncedAt ? formatTimeAgo(repo.lastSyncedAt) : 'Not synced'}
						</p>
						<p class="mt-2 text-sm text-muted-foreground">Data freshness</p>
					</div>
				</div>
			</div>
		</div>

		<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2">
			<div
				class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/[0.03] to-transparent"
			></div>
			<div class="flex gap-2 overflow-x-auto" role="tablist" aria-label="Repository sections">
				{#each repoTabs as tab}
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === tab.value}
						aria-controls={`panel-${tab.value}`}
						id={`tab-${tab.value}`}
						class={`min-h-[44px] shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ${
							activeTab === tab.value
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
						}`}
						onclick={() => switchTab(tab.value)}
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</div>

		{#if activeTab === 'overview'}
			<div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" class="space-y-6">
				<DailyBrief repoId={repoId as string} />

				<ErrorBoundary>
					<BenchmarkBadge repoId={repoId as string} />
				</ErrorBoundary>

				<div class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.95fr)]">
					<div class="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-6">
						<div class="mb-4 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"
							>
								<ListTodo class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-bold text-foreground">What should I do next</h2>
								<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
									Top task
								</p>
							</div>
						</div>

						{#if primaryTask}
							<p class="text-base font-semibold text-foreground">{primaryTask.taskText}</p>
							<div class="mt-3 flex flex-wrap items-center gap-2">
								<span
									class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-foreground/80 uppercase"
								>
									{sourceLabel(primaryTask.taskSource)}
								</span>
								<span
									class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-foreground/80 uppercase"
								>
									Priority {primaryTask.priority}
								</span>
							</div>
							{#if primaryTask.expectedImpact}
								<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
									Expected impact: {primaryTask.expectedImpact}
								</p>
							{/if}
							<div class="mt-4 flex flex-wrap gap-3">
								<Button
									size="sm"
									class="rounded-full"
									onclick={() => completeTask(primaryTask._id)}
								>
									<CheckCircle2 class="mr-2 h-4 w-4" />
									Mark complete
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="rounded-full"
									onclick={() => switchTab('tasks')}
								>
									Open tasks
								</Button>
							</div>
						{:else}
							<p class="text-sm leading-relaxed text-muted-foreground">
								Nothing urgent is open right now. Keep syncing to surface the next best move.
							</p>
						{/if}
					</div>

					<div class="space-y-6">
						<div class="rounded-[1.5rem] border border-warning/15 bg-warning/5 p-5">
							<div class="mb-3 flex items-center gap-2">
								<AlertTriangle class="h-4 w-4 text-warning" />
								<h3 class="text-sm font-bold text-foreground">What matters now</h3>
							</div>

							{#if dailyBrief?.topAnomaly}
								<p class="text-sm font-semibold text-foreground">{dailyBrief.topAnomaly.title}</p>
								<p class="mt-1 text-sm text-muted-foreground">
									{dailyBrief.topAnomaly.description}
								</p>
								<p class="mt-2 text-sm font-medium text-foreground">
									Next: {dailyBrief.topAnomaly.recommendedAction}
								</p>
								<button
									type="button"
									class="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
									onclick={() => switchTab('growth')}
								>
									View in Growth
									<ChevronRight class="h-3 w-3" />
								</button>
							{:else}
								<p class="text-sm text-muted-foreground">No active anomaly. Signals look steady.</p>
							{/if}
						</div>

						<div class="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
							<div class="mb-3 flex items-center gap-2">
								<Sparkles class="h-4 w-4 text-muted-foreground" />
								<h3 class="text-sm font-bold text-foreground">Quick links</h3>
							</div>

							<div class="space-y-2">
								<button
									type="button"
									class="flex min-h-[44px] w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
									onclick={() => switchTab('growth')}
								>
									<span>Growth & traffic</span>
									<ChevronRight class="h-3 w-3" />
								</button>
								{#if dailyBrief?.topWin}
									<button
										type="button"
										class="flex min-h-[44px] w-full items-center justify-between rounded-xl bg-success/10 px-3 py-2.5 text-sm text-success transition-colors hover:bg-success/15 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
										onclick={() => switchTab('share')}
									>
										<span>Share win</span>
										<ChevronRight class="h-3 w-3" />
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if activeTab === 'growth'}
			<div role="tabpanel" id="panel-growth" aria-labelledby="tab-growth" class="space-y-6">
				<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl">
					<h2 class="text-2xl font-black text-foreground">Growth Intelligence</h2>
					<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
						Your full conversion funnel, traffic intelligence, and anomaly signals — combined into
						one view to show exactly where you are winning and where to focus next.
					</p>
				</div>

				<PaywallBlur plan={userPlan} feature="Conversion Funnel">
					<ConversionFunnel repoId={repoId as string} />
				</PaywallBlur>

				<div class="grid gap-6 xl:grid-cols-2">
					<ErrorBoundary>
						<StarForecast repoId={repoId as string} />
					</ErrorBoundary>

					<ErrorBoundary>
						<AnomalyAlerts repoId={repoId as string} />
					</ErrorBoundary>
				</div>

				<div class="grid gap-6 xl:grid-cols-2">
					<ErrorBoundary>
						<MomentumGraph repoId={repoId as string} />
					</ErrorBoundary>
				</div>

				<PaywallBlur plan={userPlan} feature="AI Traffic Intelligence">
					<TrafficIntelligence repoId={repoId as string} />
				</PaywallBlur>

				<div class="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.9fr)]">
					<div class="space-y-6">
						<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl">
							<h3 class="mb-4 text-lg font-bold text-foreground">Views &amp; Clones (14 days)</h3>
							{#if snapshot}
								<div class="grid grid-cols-2 gap-4">
									<div class="rounded-xl bg-background/50 p-4">
										<p class="text-sm text-muted-foreground">Total Views</p>
										<p class="text-2xl font-black text-foreground">{snapshot.views ?? 0}</p>
										<p class="text-xs text-muted-foreground">
											{snapshot.uniqueVisitors ?? 0} unique visitors
										</p>
									</div>
									<div class="rounded-xl bg-background/50 p-4">
										<p class="text-sm text-muted-foreground">Total Clones</p>
										<p class="text-2xl font-black text-foreground">{snapshot.clones ?? 0}</p>
										<p class="text-xs text-muted-foreground">
											{snapshot.uniqueCloners ?? 0} unique cloners
										</p>
									</div>
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">No traffic data available yet.</p>
							{/if}
						</div>

						<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl">
							<h3 class="mb-4 text-lg font-bold text-foreground">Top Referrers</h3>
							{#if referrers && referrers.referrers && referrers.referrers.length > 0}
								<div class="space-y-3">
									{#each referrers.referrers.slice(0, 8) as ref}
										<div class="flex items-center justify-between">
											<span class="text-sm font-medium text-foreground">{ref.referrer}</span>
											<div class="flex items-center gap-2">
												<span class="text-sm text-muted-foreground">{ref.count} views</span>
												<div class="h-2 w-20 overflow-hidden rounded-full bg-background">
													<div
														class="h-full bg-primary"
														style="width: {(ref.count / (referrers.referrers[0]?.count || 1)) *
															100}%"
													></div>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">
									No referrer data yet. Traffic data collects daily.
								</p>
							{/if}
						</div>
					</div>

					<div class="space-y-6">
						<ErrorBoundary>
							<ShipStreak repoId={repoId as string} />
						</ErrorBoundary>
						<ErrorBoundary>
							<InsightCard repoId={repoId as string} />
						</ErrorBoundary>
					</div>
				</div>
			</div>
		{:else if activeTab === 'tasks'}
			<div role="tabpanel" id="panel-tasks" aria-labelledby="tab-tasks" class="space-y-6">
				<div class="rounded-[2rem] border border-primary/15 bg-primary/5 p-6 shadow-2xl">
					<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div class="max-w-2xl">
							<p class="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
								Today&apos;s focus
							</p>
							{#if primaryTask}
								<h2 class="mt-2 text-2xl font-black text-foreground">{primaryTask.taskText}</h2>
								<div class="mt-3 flex flex-wrap items-center gap-2">
									<span
										class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-foreground/80 uppercase"
									>
										{sourceLabel(primaryTask.taskSource)}
									</span>
									<span
										class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-foreground/80 uppercase"
									>
										{taskTypeLabel(primaryTask.taskType)}
									</span>
									<span
										class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-foreground/80 uppercase"
									>
										Priority {primaryTask.priority}
									</span>
								</div>
								{#if primaryTask.expectedImpact}
									<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
										Expected impact: {primaryTask.expectedImpact}
									</p>
								{/if}
							{:else}
								<h2 class="mt-2 text-2xl font-black text-foreground">Nothing urgent is open</h2>
								<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
									You&apos;re clear for now. The next sync will repopulate this queue if new work
									appears.
								</p>
							{/if}
						</div>

						{#if primaryTask}
							<Button class="rounded-full" onclick={() => completeTask(primaryTask._id)}>
								<CheckCircle2 class="mr-2 h-4 w-4" />
								Mark today&apos;s focus complete
							</Button>
						{/if}
					</div>
				</div>

				{#if tasks.length === 0}
					<div class="rounded-[2rem] border glass-panel border-white/10 p-8 text-center shadow-2xl">
						<p class="text-lg font-semibold text-foreground">Task queue is clear.</p>
						<p class="mt-2 text-sm text-muted-foreground">
							Ship some work, sync again, and ShipSense will surface the next operational move.
						</p>
					</div>
				{:else}
					<div class="grid gap-6 xl:grid-cols-2">
						{#each groupedTasks as group}
							<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl">
								<div class="mb-5 flex items-center justify-between">
									<div>
										<h3 class="text-lg font-bold text-foreground">{group.label}</h3>
										<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
											Operational queue
										</p>
									</div>
									<span class="rounded-full bg-white/10 px-2.5 py-1 text-xs text-muted-foreground">
										{group.items.length}
									</span>
								</div>

								<div class="space-y-3">
									{#each group.items as task}
										<div class="rounded-2xl border border-white/10 bg-background/30 p-4">
											<div class="flex items-start justify-between gap-4">
												<div>
													<p class="text-sm font-medium text-foreground">{task.taskText}</p>
													<div class="mt-3 flex flex-wrap items-center gap-2">
														<span
															class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-foreground/80 uppercase"
														>
															{taskTypeLabel(task.taskType)}
														</span>
														<span
															class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-foreground/80 uppercase"
														>
															Priority {task.priority}
														</span>
													</div>
													{#if task.expectedImpact}
														<p class="mt-3 text-xs leading-relaxed text-muted-foreground">
															{task.expectedImpact}
														</p>
													{/if}
												</div>
												<Button
													size="sm"
													variant="outline"
													class="rounded-full"
													onclick={() => completeTask(task._id)}
												>
													Done
												</Button>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else if activeTab === 'health'}
			<div role="tabpanel" id="panel-health" aria-labelledby="tab-health" class="space-y-6">
				<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl">
					<h2 class="text-2xl font-black text-foreground">Repo hygiene and maintainability</h2>
					<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
						Check your README quality, dependency health, score breakdown, and recent wins.
					</p>
				</div>

				<div class="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
					<ErrorBoundary>
						<ReadmeScore repoId={repoId as string} />
					</ErrorBoundary>

					<ErrorBoundary>
						<DependencyList repoId={repoId as string} />
					</ErrorBoundary>
				</div>

				<div class="grid gap-6 xl:grid-cols-2">
					<ScoreBreakdown repoId={repoId as string} />
					<ErrorBoundary>
						<WinCard repoId={repoId as string} />
					</ErrorBoundary>
				</div>
			</div>
		{:else if activeTab === 'share'}
			<div role="tabpanel" id="panel-share" aria-labelledby="tab-share" class="space-y-6">
				<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl">
					<h2 class="text-2xl font-black text-foreground">Share and external surfaces</h2>
					<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
						Sharing stays available, but secondary to day-to-day repo operations. Use these tools
						when you have a real win to amplify or want a public health surface.
					</p>
				</div>

				<div class="grid gap-6 xl:grid-cols-2">
					<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl">
						<div class="mb-4 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"
							>
								<Share2 class="h-5 w-5" />
							</div>
							<div>
								<h3 class="text-lg font-bold text-foreground">Growth card</h3>
								<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
									Shareable snapshot
								</p>
							</div>
						</div>
						<p class="text-sm leading-relaxed text-muted-foreground">
							Export a polished share card when this repo has momentum worth showing publicly.
						</p>
						<Button class="mt-4 rounded-full" onclick={() => (showGrowthCard = true)}>
							<Share2 class="mr-2 h-4 w-4" />
							Open growth card
						</Button>

						{#if dailyBrief?.topWin}
							<div class="mt-4 rounded-2xl border border-success/20 bg-success/10 p-4">
								<p class="text-xs font-bold tracking-widest text-success uppercase">Top win</p>
								<p class="mt-2 text-sm leading-relaxed text-foreground">{dailyBrief.topWin}</p>
							</div>
						{/if}
					</div>

					<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl">
						<div class="mb-4 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"
							>
								<BadgeCheck class="h-5 w-5" />
							</div>
							<div>
								<h3 class="text-lg font-bold text-foreground">Badge and public page</h3>
								<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
									Embed and link
								</p>
							</div>
						</div>

						<div class="rounded-2xl bg-muted/40 p-4">
							<img
								src={badgeUrl}
								alt={`ShipSense health score badge for ${repo?.name || 'repository'}`}
								class="h-5"
							/>
						</div>

						<div class="mt-4 flex flex-wrap gap-3">
							<Button
								variant="outline"
								class="rounded-full"
								onclick={() => (showBadgeModal = true)}
							>
								<BadgeCheck class="mr-2 h-4 w-4" />
								Get badge
							</Button>
							<Button
								variant="outline"
								class="rounded-full"
								href={publicUrl}
								target="_blank"
								rel="noreferrer"
							>
								<ExternalLink class="mr-2 h-4 w-4" />
								Open public page
							</Button>
						</div>

						<div class="mt-4 rounded-2xl border border-white/10 bg-background/30 p-4">
							<p class="text-xs font-medium text-muted-foreground">Public link</p>
							<p class="mt-2 text-sm break-all text-foreground">{publicUrl}</p>
							<Button
								size="sm"
								variant="ghost"
								class="mt-3 rounded-full"
								onclick={() => copyText(publicUrl, 'public')}
							>
								{publicLinkCopied ? 'Copied' : 'Copy link'}
							</Button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	{#if GrowthCardModal}
		{@const GrowthCard = GrowthCardModal}
		<GrowthCard repoId={repoId as string} bind:open={showGrowthCard} />
	{/if}

	<SharePromptToast repoId={repoId as string} />

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

	{#if showBadgeModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-modal="true"
			aria-labelledby="health-badge-title"
			tabindex="-1"
			onkeydown={(e) => {
				if (e.key === 'Escape') showBadgeModal = false;
			}}
		>
			<button
				type="button"
				class="absolute inset-0 bg-black/60 backdrop-blur-sm"
				aria-label="Close badge modal"
				onclick={() => (showBadgeModal = false)}
			></button>
			<div
				class="relative mx-4 w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-background p-8 shadow-2xl"
			>
				<div class="mb-6 flex items-center justify-between">
					<h2 id="health-badge-title" class="text-xl font-bold text-foreground">Health Badge</h2>
					<button
						type="button"
						onclick={() => (showBadgeModal = false)}
						aria-label="Close badge modal"
						class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div class="mb-6 flex justify-center rounded-xl bg-muted/50 p-6">
					<img
						src={badgeUrl}
						alt={`ShipSense health score badge for ${repo?.name || 'repository'}`}
						class="h-5"
					/>
				</div>

				<div class="mb-4">
					<p class="mb-2 text-sm font-medium text-muted-foreground">
						Copy this markdown to your README:
					</p>
					<div class="flex items-center gap-2 rounded-lg bg-muted p-3">
						<code class="flex-1 text-xs break-all text-foreground">{badgeMarkdown}</code>
						<button
							type="button"
							onclick={() => copyText(badgeMarkdown, 'badge')}
							class="shrink-0 cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
						>
							{badgeCopied ? 'Copied!' : 'Copy'}
						</button>
					</div>
				</div>

				<div class="mb-6">
					<p class="mb-2 text-sm font-medium text-muted-foreground">Public health page:</p>
					<a href={publicUrl} target="_blank" class="text-sm break-all text-primary hover:underline"
						>{publicUrl}</a
					>
				</div>

				<p class="text-xs text-muted-foreground">
					The badge updates automatically when your health score changes. After deploying, replace
					the relative URL with your app&apos;s domain.
				</p>
			</div>
		</div>
	{/if}
</div>
