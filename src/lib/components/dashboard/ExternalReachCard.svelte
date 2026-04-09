<script lang="ts">
	import { Globe, TrendingUp, TrendingDown, Minus, ArrowUpRight, ChevronRight } from 'lucide-svelte';
	import type { ExternalReachScore } from '$convex/trafficIntelligence';

	let { reach, onViewAll }: { reach: ExternalReachScore; onViewAll?: () => void } = $props();

	function tierBadge(tier: ExternalReachScore['tier']) {
		switch (tier) {
			case 'strong':
				return { text: 'Strong', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
			case 'moderate':
				return { text: 'Moderate', cls: 'text-primary bg-primary/10 border-primary/20' };
			case 'weak':
				return { text: 'Weak', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
			default:
				return { text: 'None', cls: 'text-muted-foreground bg-white/5 border-white/10' };
		}
	}

	function scoreColor(score: number) {
		if (score >= 65) return 'text-emerald-400';
		if (score >= 35) return 'text-primary';
		if (score > 0) return 'text-amber-400';
		return 'text-muted-foreground';
	}

	function trendIcon() {
		if (reach.trafficTrend === 'accelerating') return TrendingUp;
		if (reach.trafficTrend === 'declining') return TrendingDown;
		return Minus;
	}

	function trendColor() {
		if (reach.trafficTrend === 'accelerating') return 'text-emerald-400';
		if (reach.trafficTrend === 'declining') return 'text-red-400';
		return 'text-amber-400';
	}

	function trendLabel() {
		if (reach.trafficTrend === 'accelerating') return 'Accelerating';
		if (reach.trafficTrend === 'declining') return 'Declining';
		return 'Steady';
	}

	const badge = $derived(tierBadge(reach.tier));
	const TrendIco = $derived(trendIcon());

	function formatSourceName(name: string) {
		return name;
	}
</script>

<div class="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
	<div class="mb-3 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Globe class="h-4 w-4 text-muted-foreground" />
			<h3 class="text-sm font-bold text-foreground">External Reach</h3>
		</div>
		{#if onViewAll}
			<button
				type="button"
				class="rounded-lg px-3 py-2 text-xs font-medium text-primary hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
				style="min-height: 44px;"
				onclick={onViewAll}
			>
				Details <ChevronRight class="ml-0.5 inline h-3 w-3" />
			</button>
		{/if}
	</div>

	<!-- Score + tier row -->
	<div class="mb-3 flex items-center gap-3">
		<div class="flex items-center gap-2">
			<span class="text-2xl font-black {scoreColor(reach.score)}">{reach.score}</span>
			<span class="text-xs text-muted-foreground">/ 100</span>
		</div>
		<span class="rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase {badge.cls}">
			{badge.text}
		</span>
	</div>

	<!-- Traffic trend -->
	<div class="mb-3 flex items-center gap-2 text-xs">
		<TrendIco class="h-3.5 w-3.5 {trendColor()}" />
		<span class="{trendColor()} font-medium">{trendLabel()}</span>
		{#if reach.topSource}
			<span class="text-muted-foreground">·</span>
			<span class="text-muted-foreground">Top: {formatSourceName(reach.topSource)} ({reach.topSourceViews} views)</span>
		{/if}
	</div>

	<!-- Narrative -->
	<p class="text-xs leading-relaxed text-muted-foreground">{reach.narrative}</p>

	<!-- Source detail (if strong/moderate) -->
	{#if (reach.tier === 'strong' || reach.tier === 'moderate') && reach.topSourceViews > 0}
		<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
			{#if reach.topSource}
				<span class="flex items-center gap-1">
					<ArrowUpRight class="h-3 w-3 text-primary/60" />
					{reach.topSource}: {reach.topSourceViews} visitors
				</span>
			{/if}
			{#if reach.topSourceConversion > 0}
				<span class="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-primary">
					{reach.topSourceConversion.toFixed(1)}% conversion
				</span>
			{/if}
		</div>
	{/if}
</div>
