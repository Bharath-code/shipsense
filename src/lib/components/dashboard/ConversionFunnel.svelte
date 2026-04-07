<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { TrendingUp, TrendingDown, Minus, Eye, Star, GitFork, Users, ArrowRight, Sparkles } from 'lucide-svelte';

	let { repoId }: { repoId: string } = $props();

	const funnelQuery = useQuery(api.trafficIntelligence.getConversionFunnel, () => ({
		repoId: repoId as any
	}));

	let funnel = $derived(funnelQuery.data);
	let isLoading = $derived(funnelQuery.isLoading);

	function sentimentClass(s: 'excellent' | 'good' | 'weak' | 'none') {
		if (s === 'excellent') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
		if (s === 'good') return 'text-primary bg-primary/10 border-primary/20';
		if (s === 'weak') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
		return 'text-muted-foreground bg-white/5 border-white/10';
	}

	function valueColor(s: 'excellent' | 'good' | 'weak' | 'none') {
		if (s === 'excellent') return 'text-emerald-400';
		if (s === 'good') return 'text-primary';
		if (s === 'weak') return 'text-amber-400';
		return 'text-muted-foreground';
	}

	function stageIcon(label: string) {
		if (label === 'Views') return Eye;
		if (label === 'Stars') return Star;
		if (label === 'Clones') return GitFork;
		return Users;
	}

	function momentumConfig(v: 'accelerating' | 'coasting' | 'stalling') {
		if (v === 'accelerating')
			return {
				label: 'Accelerating',
				icon: TrendingUp,
				cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
			};
		if (v === 'stalling')
			return {
				label: 'Stalling',
				icon: TrendingDown,
				cls: 'text-red-400 bg-red-400/10 border-red-400/20'
			};
		return {
			label: 'Coasting',
			icon: Minus,
			cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
		};
	}

	function formatRate(r: number | null): string {
		if (r === null) return '—';
		if (r >= 10) return `${r.toFixed(0)}%`;
		return `${r.toFixed(1)}%`;
	}
</script>

<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl overflow-hidden relative">
	<!-- subtle bg glow -->
	<div class="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>

	<div class="relative mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
				Growth Intelligence
			</p>
			<h2 class="mt-1 text-2xl font-black text-foreground">Conversion Funnel</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				How visitors become stars, cloners, and contributors
			</p>
		</div>

		{#if funnel}
			{@const cfg = momentumConfig(funnel.momentumVector)}
			<div class="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold {cfg.cls}">
				{#if funnel.momentumVector === 'accelerating'}
					<TrendingUp class="h-4 w-4" />
				{:else if funnel.momentumVector === 'stalling'}
					<TrendingDown class="h-4 w-4" />
				{:else}
					<Minus class="h-4 w-4" />
				{/if}
				{cfg.label}
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="space-y-3">
			{#each Array(4) as _}
				<div class="h-24 animate-pulse rounded-2xl bg-white/5"></div>
			{/each}
		</div>
	{:else if !funnel}
		<p class="text-sm text-muted-foreground">Unable to load funnel data.</p>
	{:else}
		<!-- Funnel pipeline -->
		<div class="relative space-y-2">
			{#each funnel.stages as stage, i}
				<div class="group">
					<!-- Stage card -->
					<div class="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]">
						<!-- Icon -->
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 {valueColor(stage.sentiment)}">
							{#if stage.label === 'Views'}
								<Eye class="h-5 w-5" />
							{:else if stage.label === 'Stars'}
								<Star class="h-5 w-5" />
							{:else if stage.label === 'Clones'}
								<GitFork class="h-5 w-5" />
							{:else}
								<Users class="h-5 w-5" />
							{/if}
						</div>

						<!-- Label + sub -->
						<div class="min-w-[6rem] shrink-0">
							<p class="text-sm font-semibold text-foreground">{stage.label}</p>
							<p class="text-xs text-muted-foreground">{stage.subLabel}</p>
						</div>

						<!-- Value -->
						<div class="flex-1 text-right sm:text-left">
							<p class="text-2xl font-black {valueColor(stage.sentiment)}">
								{stage.value.toLocaleString()}
							</p>
						</div>

						<!-- Conversion badge — only for stages 2-4 -->
						{#if stage.conversionRate !== null}
							<div class="shrink-0">
								<span class="inline-flex flex-col items-end gap-0.5 rounded-xl border px-3 py-1.5 text-right {sentimentClass(stage.sentiment)}">
									<span class="text-base font-bold leading-tight">{formatRate(stage.conversionRate)}</span>
									<span class="text-[10px] font-medium leading-tight opacity-80">{stage.conversionLabel}</span>
								</span>
							</div>
						{:else}
							<div class="shrink-0">
								<span class="inline-flex flex-col items-end gap-0.5 rounded-xl border px-3 py-1.5 text-right {sentimentClass(stage.sentiment)}">
									<span class="text-[10px] font-medium leading-tight opacity-80">{stage.conversionLabel}</span>
								</span>
							</div>
						{/if}
					</div>

					<!-- Arrow connector (not on last stage) -->
					{#if i < funnel.stages.length - 1}
						<div class="flex justify-center py-1">
							<ArrowRight class="h-4 w-4 rotate-90 text-white/20" />
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Momentum reason -->
		<div class="mt-4 rounded-xl bg-white/5 px-4 py-2.5">
			<p class="text-xs text-muted-foreground">
				<span class="font-semibold text-foreground">Momentum signal:</span>
				{funnel.momentumReason}
			</p>
		</div>

		<!-- One Thing -->
		<div class="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
			<div class="mb-2 flex items-center gap-2">
				<Sparkles class="h-4 w-4 text-primary" />
				<p class="text-xs font-bold tracking-widest text-primary uppercase">One Thing</p>
			</div>
			<p class="text-sm leading-relaxed text-foreground">{funnel.oneThing}</p>
		</div>

		<!-- No traffic data nudge -->
		{#if !funnel.hasData}
			<div class="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
				<p class="text-sm text-muted-foreground">
					Traffic data hasn't been collected yet. Run a sync and check back in 24 hours to see
					your full funnel.
				</p>
			</div>
		{/if}
	{/if}
</div>
