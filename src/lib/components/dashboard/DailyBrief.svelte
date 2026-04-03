<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import {
		SunMedium,
		Sparkles,
		AlertTriangle,
		ListTodo,
		ArrowRight,
		TrendingUp,
		Zap
	} from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	const briefQuery = useQuery(api.dashboard.getRepoDailyBrief, () => ({ repoId }));
	let brief = $derived(briefQuery.data);
	let isLoading = $derived(briefQuery.isLoading);

	function riskTone(severity: string | null | undefined): string {
		if (severity === 'high') return 'text-destructive';
		if (severity === 'medium') return 'text-warning';
		return 'text-primary';
	}

	function formatSyncTime(timestamp: number | null): string {
		if (!timestamp) return 'Waiting for first sync';
		const minutes = Math.floor((Date.now() - timestamp) / 1000 / 60);
		if (minutes < 1) return 'Synced just now';
		if (minutes < 60) return `Synced ${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `Synced ${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `Synced ${days}d ago`;
	}

	function sourceLabel(source: string | null | undefined): string {
		if (source === 'anomaly') return 'Anomaly';
		if (source === 'dependency') return 'Dependency';
		if (source === 'readme') return 'README';
		if (source === 'hygiene') return 'Maintenance';
		return 'Trend';
	}
</script>

<div class="overflow-hidden rounded-[2rem] border glass-panel shadow-2xl">
	<div class="p-6 sm:p-8">
		<div class="mb-5 flex items-start justify-between gap-4">
			<div class="flex items-center gap-3">
				<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<SunMedium class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-foreground">Daily Digest</h3>
					<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
						What changed since yesterday and what to do next
					</p>
				</div>
			</div>
			{#if brief}
				<p class="text-right text-xs text-muted-foreground">{formatSyncTime(brief.lastSyncedAt)}</p>
			{/if}
		</div>

		{#if isLoading}
			<div class="space-y-3">
				<div class="h-4 w-2/3 animate-pulse rounded-full bg-muted"></div>
				<div class="h-4 w-full animate-pulse rounded-full bg-muted"></div>
				<div class="h-20 animate-pulse rounded-2xl bg-muted"></div>
			</div>
		{:else if !brief}
			<div class="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
				Run a sync to generate your first daily digest.
			</div>
		{:else}
			<div class="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
				<div class="space-y-4">
					<div class="flex flex-wrap items-center gap-2">
						{#if brief.healthScore !== null}
							<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
								Score {brief.healthScore}/100
							</span>
						{/if}
						{#if brief.starsLast7d > 0}
							<span class="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
								+{brief.starsLast7d} stars this week
							</span>
						{/if}
						{#if brief.contributors14d > 0}
							<span class="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
								{brief.contributors14d} contributors active
							</span>
						{/if}
					</div>

					<p class="text-base leading-relaxed text-foreground">{brief.summaryLine}</p>

					<div class="rounded-2xl border border-border/50 bg-background/40 p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
							<TrendingUp class="h-4 w-4 text-primary" />
							What changed
						</div>
						<p class="text-sm leading-relaxed text-muted-foreground">{brief.changeSummary}</p>
					</div>

					<div class="rounded-2xl border border-primary/10 bg-primary/5 p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
							<ArrowRight class="h-4 w-4 text-primary" />
							Today&apos;s focus
						</div>
						<div class="mb-2 flex flex-wrap items-center gap-2">
							{#if brief.todayFocusSource}
								<span class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-foreground/80 uppercase">
									{sourceLabel(brief.todayFocusSource)}
								</span>
							{/if}
							{#if brief.isQuietDay}
								<span class="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-success uppercase">
									Quiet day
								</span>
							{/if}
						</div>
						<p class="text-sm leading-relaxed text-foreground">
							{brief.todayFocus ?? 'Keep monitoring this repo while more signals accumulate.'}
						</p>
						{#if brief.todayFocusImpact}
							<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
								Expected impact: {brief.todayFocusImpact}
							</p>
						{/if}
					</div>
				</div>

				<div class="space-y-3">
					<div class="rounded-2xl border border-border/50 bg-background/40 p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
							<AlertTriangle
								class="h-4 w-4 {riskTone(brief.topAnomaly?.severity ?? null)}"
							/>
							Top signal
						</div>
						{#if brief.topAnomaly}
							<p class="text-sm font-medium text-foreground">{brief.topAnomaly.title}</p>
							<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
								{brief.topAnomaly.recommendedAction}
							</p>
						{:else}
							<p class="text-xs text-muted-foreground">No active anomalies. Momentum looks stable.</p>
						{/if}
					</div>

					<div class="rounded-2xl border border-border/50 bg-background/40 p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
							<Zap class="h-4 w-4 text-success" />
							Top win
						</div>
						<p class="text-sm leading-relaxed text-foreground">
							{brief.topWin ?? 'No standout win yet. Keep shipping to create the next momentum signal.'}
						</p>
					</div>

					<div class="rounded-2xl border border-border/50 bg-background/40 p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
							<ListTodo class="h-4 w-4 text-primary" />
							Top task
						</div>
						{#if brief.topTask}
							<p class="text-sm font-medium text-foreground">{brief.topTask.text}</p>
							<p class="mt-1 text-xs text-muted-foreground">
								Priority {brief.topTask.priority} / {brief.topTask.type}
							</p>
							{#if brief.topTask.expectedImpact}
								<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
									{brief.topTask.expectedImpact}
								</p>
							{/if}
						{:else}
							<p class="text-xs text-muted-foreground">No open tasks right now.</p>
						{/if}
					</div>

					<div class="rounded-2xl border border-border/50 bg-background/40 p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
							<Sparkles class="h-4 w-4 text-warning" />
							AI read
						</div>
						{#if brief.insight}
							<p class="text-sm font-medium text-foreground">{brief.insight.summary}</p>
							<p class="mt-1 text-xs text-muted-foreground">Risk: {brief.insight.risk}</p>
						{:else}
							<p class="text-xs text-muted-foreground">
								Insight generation will show up here after the next successful sync.
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
