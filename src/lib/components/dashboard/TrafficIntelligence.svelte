<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type {
		TrafficIntelligenceReport,
		TrafficConversionInsight,
		TrafficSourceInsight
	} from '$convex/trafficIntelligence';
	import {
		ArrowUpRight,
		ArrowDownRight,
		TrendingUp,
		Minus,
		GitFork,
		Globe,
		Lightbulb,
		AlertTriangle,
		Sparkles
	} from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';

	let { repoId }: { repoId: string } = $props();

	const reportQuery = useQuery(api.trafficIntelligence.getTrafficIntelligence, () => ({
		repoId: repoId as any
	}));

	const report = $derived(reportQuery.data);
	const isLoading = $derived(reportQuery.isLoading);

	function velocityTone(v: 'accelerating' | 'steady' | 'declining') {
		if (v === 'accelerating') return 'text-success';
		if (v === 'declining') return 'text-destructive';
		return 'text-muted-foreground';
	}

	function sentimentColor(sentiment: 'positive' | 'neutral' | 'warning') {
		if (sentiment === 'positive') return 'bg-success/10 text-success';
		if (sentiment === 'warning') return 'bg-destructive/10 text-destructive';
		return 'bg-white/5 text-muted-foreground';
	}

	function conversionTrendTone(trend: 'improving' | 'declining' | 'stable') {
		if (trend === 'improving') return 'text-success';
		if (trend === 'declining') return 'text-destructive';
		return 'text-muted-foreground';
	}

	function topSourceWidth(s: TrafficSourceInsight, sources: TrafficSourceInsight[]) {
		const max = sources[0]?.views ?? 1;
		return max > 0 ? (s.views / max) * 100 : 0;
	}
</script>

{#if isLoading}
	<div class="space-y-6">
		<div class="h-8 w-full animate-pulse rounded-xl bg-white/5" />
		<div class="grid gap-4 sm:grid-cols-3">
			{#each [1, 2, 3] as _}
				<div class="h-32 animate-pulse rounded-2xl bg-white/5" />
			{/each}
		</div>
	</div>
{:else if !report}
	<div class="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
		<Globe class="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
		<p class="text-sm text-muted-foreground">No traffic intelligence available yet.</p>
		<p class="mt-1 text-xs text-muted-foreground/60">Sync your repo to start collecting data.</p>
	</div>
{:else}
	<div class="space-y-6">
		<!-- ── One Thing ──────────────────────────────────────────── -->
		<div
			class="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 shadow-2xl"
		>
			<div class="flex items-start gap-3">
				<div class="rounded-xl bg-primary/15 p-2.5 text-primary">
					<Lightbulb class="h-5 w-5" />
				</div>
				<div>
					<p
						class="text-[10px] font-bold tracking-[0.2em] text-primary uppercase"
					>
						One thing to focus on today
					</p>
					<p class="mt-2 text-base font-semibold leading-relaxed text-foreground">
						{report.oneThing}
					</p>
					{#if report.topSourceAction}
						<p class="mt-1 text-sm text-muted-foreground">{report.topSourceAction}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- ── Three Key Metrics ──────────────────────────────────── -->
		<div class="grid gap-4 sm:grid-cols-3">
			<!-- Conversion -->
			<div class="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
				<div class="flex items-center justify-between">
					<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
						Traffic → Stars
					</p>
					<span class="{conversionTrendTone(report.conversion.conversionTrend)}">
						{#if report.conversion.conversionTrend === 'improving'}
							<ArrowUpRight class="h-4 w-4" />
						{:else if report.conversion.conversionTrend === 'declining'}
							<ArrowDownRight class="h-4 w-4" />
						{:else}
							<Minus class="h-4 w-4" />
						{/if}
					</span>
				</div>
				<p class="mt-3 text-2xl font-black text-foreground">
					{report.conversion.conversionLabel}
				</p>
				<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
					{report.conversion.analysis}
				</p>
				<div
					class="mt-3 rounded-xl border border-primary/10 bg-primary/5 p-3"
				>
					<p class="text-xs font-medium text-primary">→ {report.conversion.action}</p>
				</div>
			</div>

			<!-- Clone Interest -->
			<div class="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
				<div class="flex items-center justify-between">
					<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
						Developer Interest
					</p>
					<GitFork class="h-4 w-4 text-muted-foreground/40" />
				</div>
				<p class="mt-3 text-2xl font-black text-foreground">
					{report.cloning.label}
				</p>
				<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
					{report.cloning.analysis}
				</p>
				<div
					class="mt-3 rounded-xl border border-primary/10 bg-primary/5 p-3"
				>
					<p class="text-xs font-medium text-primary">→ {report.cloning.action}</p>
				</div>
			</div>

			<!-- Velocity -->
			<div class="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5">
				<div class="flex items-center justify-between">
					<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
						Traffic Trend
					</p>
					<span class="{velocityTone(report.velocity.velocity)}">
						{#if report.velocity.velocity === 'accelerating'}
							<ArrowUpRight class="h-4 w-4" />
						{:else if report.velocity.velocity === 'declining'}
							<ArrowDownRight class="h-4 w-4" />
						{:else}
							<Minus class="h-4 w-4" />
						{/if}
					</span>
				</div>
				<p class="mt-3 text-2xl font-black text-foreground">
					{#if report.velocity.velocity === 'accelerating'}
						<span class="text-success">+{Math.abs(report.velocity.changePercent)}%</span>
					{:else if report.velocity.velocity === 'declining'}
						<span class="text-destructive">-{Math.abs(report.velocity.changePercent)}%</span>
					{:else}
						<span class="text-muted-foreground">Stable</span>
					{/if}
				</p>
				<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
					{report.velocity.analysis}
				</p>
				<div
					class="mt-3 rounded-xl border border-primary/10 bg-primary/5 p-3"
				>
					<p class="text-xs font-medium text-primary">→ {report.velocity.action}</p>
				</div>
			</div>
		</div>

		<!-- ── Top Sources ────────────────────────────────────────── -->
		{#if report.topSources.length > 0}
			<div class="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
				<div class="mb-5 flex items-center gap-3">
					<div class="rounded-xl bg-white/10 p-2.5 text-muted-foreground">
						<Globe class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Traffic Sources</h3>
						<p class="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
							Where your visitors come from
						</p>
					</div>
				</div>

				<div class="space-y-3">
					{#each report.topSources as source}
						<div class="flex flex-col gap-2">
							<div class="flex items-center justify-between gap-3">
								<div class="flex min-w-0 items-center gap-2.5">
									<span
										class={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${sentimentColor(source.sentiment)}`}
									>
										{#if source.sentiment === 'positive'}
											<TrendingUp class="-mt-0.5 inline h-3 w-3" />
										{:else if source.sentiment === 'warning'}
											<AlertTriangle class="-mt-0.5 inline h-3 w-3" />
										{:else}
											<Minus class="-mt-0.5 inline h-3 w-3" />
										{/if}
									</span>
									<span class="truncate text-sm font-medium text-foreground">
										{source.source}
									</span>
									{#if source.isNew}
										<Badge
											variant="outline"
											class="shrink-0 rounded-full border-success/20 bg-success/10 px-2 py-0 text-[9px] font-bold tracking-widest text-success uppercase"
										>
											<span class="mr-0.5 text-xs leading-none">★</span> NEW
										</Badge>
									{/if}
									{#if source.isTrending}
										<Badge
											variant="outline"
											class="shrink-0 rounded-full border-green-500/20 bg-green-500/10 px-2 py-0 text-[9px] font-bold tracking-widest text-green-400 uppercase"
										>
											<span class="mr-0.5 text-xs leading-none">▲</span> UP
										</Badge>
									{/if}
								</div>
								<div class="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
									<span>{source.views} views</span>
									<span>{source.uniques} unique</span>
									<span>
										<span class="text-foreground font-medium">{source.conversionRate}</span>★/100v
									</span>
								</div>
							</div>

							<!-- Bar -->
							<div class="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
								<div
									class="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
									style="width: {topSourceWidth(source, report.topSources)}%"
								/>
							</div>

							{#if source.action}
								<p class="text-xs text-primary/80">→ {source.action}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ── Not Enough Data ────────────────────────────────────── -->
		{#if !report.hasEnoughData}
			<div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
				<Sparkles class="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
				<p class="text-sm font-medium text-muted-foreground">
					Collecting more data to improve intelligence.
				</p>
				<p class="mt-1 text-xs text-muted-foreground/60">
					Traffic data populates daily. Check back after your next sync.
				</p>
			</div>
		{/if}
	</div>
{/if}
