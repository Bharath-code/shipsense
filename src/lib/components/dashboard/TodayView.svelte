<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import {
		Zap,
		CheckCircle2,
		AlertTriangle,
		Sparkles,
		TrendingUp,
		TrendingDown,
		ArrowRight,
		Flame,
		ExternalLink,
		RefreshCw,
		Clock
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let { repoId, onExplore } = $props<{ repoId: string; onExplore: () => void }>();
	const client = useConvexClient();

	const todayView = useQuery(api.todayView.getTodayView, () => ({ repoId: repoId as any }));

	let data = $derived(todayView.data);
	let isLoading = $derived(todayView.isLoading);

	function momentumConfig(v: string | null) {
		if (v === 'up') return { label: 'Accelerating', icon: TrendingUp, cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
		if (v === 'down') return { label: 'Stalling', icon: TrendingDown, cls: 'text-red-400 bg-red-400/10 border-red-400/20' };
		return { label: 'Coasting', icon: ArrowRight, cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
	}

	function scoreTone(score: number | null): string {
		if (score == null) return 'text-muted-foreground';
		if (score >= 80) return 'text-emerald-400';
		if (score >= 60) return 'text-amber-400';
		if (score >= 40) return 'text-orange-400';
		return 'text-red-400';
	}

	function formatTimeAgo(timestamp: number | null): string {
		if (!timestamp) return 'Not synced yet';
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 60) return 'Just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}

	function urgencyBadge(urgency: string | null): { emoji: string; label: string; cls: string } {
		if (!urgency) return { emoji: '', label: '', cls: '' };
		const map: Record<string, { emoji: string; label: string; cls: string }> = {
			critical: { emoji: '🔴', label: 'Critical', cls: 'text-red-400 bg-red-400/10 border-red-400/20' },
			high: { emoji: '🟡', label: 'High', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
			medium: { emoji: '⚪', label: 'Medium', cls: 'text-muted-foreground bg-white/5 border-white/10' },
			low: { emoji: '💬', label: 'Low', cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20' }
		};
		return map[urgency] ?? { emoji: '', label: '', cls: '' };
	}

	async function handleCompleteTask(taskId: string) {
		await client.mutation(api.dashboard.completeTask, { taskId: taskId as any });
	}

	async function handleSync() {
		await client.action(api.repos.syncConnectedRepo, { repoId: repoId as any });
	}
</script>

{#if isLoading}
	<div class="space-y-6">
		<div class="h-48 animate-pulse rounded-[2rem] border border-white/10 bg-white/5"></div>
		<div class="h-32 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"></div>
		<div class="h-24 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"></div>
	</div>
{:else if !data}
	<div class="flex h-80 flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 text-center">
		<p class="text-lg font-semibold text-foreground">No data yet</p>
		<p class="mt-2 text-sm text-muted-foreground">Run a sync to get your first health brief.</p>
		<Button class="mt-4 rounded-full" onclick={handleSync}>
			<RefreshCw class="mr-2 h-4 w-4" />
			Run Sync
		</Button>
	</div>
{:else}
	<div class="space-y-6">
		<!-- ═══════════════════════════════════════════════════════════ -->
		<!-- HEADER: repo name + sync status + streak                   -->
		<!-- ═══════════════════════════════════════════════════════════ -->
		<div class="flex items-start justify-between gap-4">
			<div>
				<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Today's Brief</p>
				<h1 class="mt-1 text-2xl font-black text-foreground sm:text-3xl">{data.repo.name}</h1>
				{#if data.repo.language}
					<span class="mt-1 inline-block rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-primary">{data.repo.language}</span>
				{/if}
			</div>
			<div class="flex flex-col items-end gap-2">
				{#if data.streak && data.streak.current > 0}
					<span class="flex items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning">
						<Flame size={12} /> {data.streak.current}-day streak
					</span>
				{/if}
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Clock size={12} />
					{formatTimeAgo(data.repo.lastSyncedAt)}
				</div>
			</div>
		</div>

		<!-- ═══════════════════════════════════════════════════════════ -->
		<!-- QUICK STATS BAR                                            -->
		<!-- ═══════════════════════════════════════════════════════════ -->
		<div class="flex flex-wrap gap-2">
			{#if data.score != null}
				<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold {scoreTone(data.score)}">
					Score {data.score}/100
				</span>
			{/if}
			{#if data.starsLast7d > 0}
				<span class="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
					+{data.starsLast7d} stars this week
				</span>
			{/if}
			{#if data.contributors14d > 0}
				<span class="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
					{data.contributors14d} contributors
				</span>
			{/if}
			{#if data.trend}
				{@const m = momentumConfig(data.trend)}
				<span class="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold {m.cls}">
					<m.icon size={12} /> {m.label}
				</span>
			{/if}
		</div>

		<!-- ═══════════════════════════════════════════════════════════ -->
		<!-- NARRATIVE BRIEF                                            -->
		<!-- ═══════════════════════════════════════════════════════════ -->
		<div class="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
			<p class="text-base leading-relaxed text-foreground">{data.summaryLine}</p>
			{#if data.topWin}
				<div class="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3">
					<Sparkles size={14} class="mt-0.5 shrink-0 text-emerald-400" />
					<div>
						<p class="text-xs font-semibold text-emerald-400">Win</p>
						<p class="text-sm text-foreground">{data.topWin}</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- ═══════════════════════════════════════════════════════════ -->
		<!-- ONE THING TO DO                                            -->
		<!-- ═══════════════════════════════════════════════════════════ -->
		{#if data.topTask}
			<div class="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5">
				<div class="mb-3 flex items-center gap-2">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<Zap size={14} />
					</div>
					<div>
						<p class="text-sm font-bold text-foreground">One thing to do</p>
						<p class="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
							{data.topTask.source ?? 'System'} · Priority {data.topTask.priority}
						</p>
					</div>
				</div>

				<p class="text-base font-semibold text-foreground">{data.topTask.text}</p>
				{#if data.topTask.impact}
					<p class="mt-1 text-sm text-muted-foreground">{data.topTask.impact}</p>
				{/if}
				{#if data.topTask.urgency}
					{@const u = urgencyBadge(data.topTask.urgency)}
					<span class="mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold {u.cls}">
						{u.emoji} {u.label}
					</span>
				{/if}

				<div class="mt-4 flex flex-wrap gap-2">
					<Button size="default" class="rounded-full" onclick={() => data.topTask && handleCompleteTask(data.topTask.id)}>
						<CheckCircle2 class="mr-2 h-4 w-4" />
						Mark done
					</Button>
					<Button variant="outline" size="default" class="rounded-full" onclick={onExplore}>
						See all tasks
						<ExternalLink class="ml-2 h-3 w-3" />
					</Button>
				</div>
			</div>
		{:else}
			<div class="rounded-[1.5rem] border border-emerald-400/15 bg-emerald-400/5 p-5 text-center">
				<p class="text-lg font-semibold text-emerald-400">All clear</p>
				<p class="mt-1 text-sm text-muted-foreground">Nothing urgent. Keep shipping and check back tomorrow.</p>
			</div>
		{/if}

		<!-- ═══════════════════════════════════════════════════════════ -->
		<!-- ACTIVE ANOMALIES                                           -->
		<!-- ═══════════════════════════════════════════════════════════ -->
		{#if data.anomalies.length > 0}
			<div class="rounded-[1.5rem] border border-red-400/15 bg-red-400/5 p-5">
				<div class="mb-3 flex items-center gap-2">
					<AlertTriangle size={16} class="text-red-400" />
					<p class="text-sm font-bold text-red-400">{data.anomalies.length} active signal{data.anomalies.length > 1 ? 's' : ''}</p>
				</div>
				<div class="space-y-2">
					{#each data.anomalies as anomaly}
						<div class="rounded-xl border border-white/5 bg-white/5 p-3">
							<p class="text-sm font-medium text-foreground">{anomaly.title}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">{anomaly.description}</p>
						</div>
					{/each}
				</div>
				<Button variant="outline" size="default" class="mt-3 rounded-full" onclick={onExplore}>
					View details
					<ExternalLink class="ml-2 h-3 w-3" />
				</Button>
			</div>
		{/if}

		<!-- ═══════════════════════════════════════════════════════════ -->
		<!-- EXPLORE FULL DASHBOARD CTA                                 -->
		<!-- ═══════════════════════════════════════════════════════════ -->
		<div class="rounded-[1.5rem] border border-border bg-card p-6 text-center">
			<p class="text-sm font-semibold text-foreground">Want the full picture?</p>
			<p class="mt-1 text-sm text-muted-foreground">Growth intelligence, health breakdown, share tools, and more.</p>
			<Button class="mt-4 rounded-full" onclick={onExplore}>
				Explore Full Dashboard
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		</div>
	</div>
{/if}
