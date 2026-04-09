<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Star, TrendingUp, TrendingDown, ArrowRight, Target, Zap } from 'lucide-svelte';

	let { repoId }: { repoId: string } = $props();

	const forecastQuery = useQuery(api.dashboard.getStarForecast, () => ({
		repoId: repoId as any
	}));

	let forecast = $derived(forecastQuery.data);
	let isLoading = $derived(forecastQuery.isLoading);

	function trendIcon(t: 'accelerating' | 'decelerating' | 'stable') {
		if (t === 'accelerating') return TrendingUp;
		if (t === 'decelerating') return TrendingDown;
		return ArrowRight;
	}

	function trendClass(t: 'accelerating' | 'decelerating' | 'stable') {
		if (t === 'accelerating') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
		if (t === 'decelerating') return 'text-red-400 bg-red-400/10 border-red-400/20';
		return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
	}

	function trendLabel(t: 'accelerating' | 'decelerating' | 'stable') {
		if (t === 'accelerating') return 'Accelerating';
		if (t === 'decelerating') return 'Slowing';
		return 'Steady';
	}

	function confidenceClass(c: 'high' | 'medium' | 'low') {
		if (c === 'high') return 'text-emerald-400';
		if (c === 'medium') return 'text-amber-400';
		return 'text-muted-foreground';
	}

	function formatDate(ms: number): string {
		return new Date(ms).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDays(d: number): string {
		if (d <= 7) return `${d} days`;
		if (d <= 30) return `~${Math.round(d / 7)} weeks`;
		if (d <= 365) return `~${Math.round(d / 30)} months`;
		return `~${(d / 365).toFixed(1)} years`;
	}

	// Progress bar: how far from previous milestone to next
	let progress = $derived.by(() => {
		if (!forecast) return 0;
		const { currentStars, nextMilestone } = forecast;

		// determine previous milestone
		const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
		const prevMilestone = milestones.reverse().find((m) => m < currentStars) ?? 0;
		milestones.reverse();

		const range = nextMilestone - prevMilestone;
		const done = currentStars - prevMilestone;
		return range > 0 ? Math.min(100, Math.round((done / range) * 100)) : 0;
	});
</script>

<div class="relative overflow-hidden rounded-[2rem] border border-white/10 glass-panel p-6 shadow-2xl">
	<!-- Ambient glow -->
	<div class="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-warning/5 blur-3xl"></div>

	<div class="relative mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
				Growth Oracle
			</p>
			<h2 class="mt-1 text-2xl font-black text-foreground">Star Forecast</h2>
			<p class="mt-1 text-sm text-muted-foreground">Predictive projection based on velocity trend</p>
		</div>

		{#if forecast && forecast.hasEnoughData}
			{@const cls = trendClass(forecast.trend)}
			{@const Icon = trendIcon(forecast.trend)}
			<div class="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold {cls}">
				<Icon class="h-4 w-4" />
				{trendLabel(forecast.trend)}
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="space-y-4">
			{#each Array(3) as _}
				<div class="h-16 animate-pulse rounded-2xl bg-white/5"></div>
			{/each}
		</div>
	{:else if !forecast}
		<p class="text-sm text-muted-foreground">Unable to load forecast.</p>
	{:else}
		<!-- Current + next milestone progress -->
		<div class="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
						<Star class="h-5 w-5" />
					</div>
					<div>
						<p class="text-2xl font-black text-foreground">
							{forecast.currentStars.toLocaleString()}
						</p>
						<p class="text-xs text-muted-foreground">Current stars</p>
					</div>
				</div>

				<div class="text-right">
					<div class="flex items-center gap-1.5 justify-end">
						<Target class="h-4 w-4 text-primary" />
						<p class="text-xl font-black text-primary">
							{forecast.nextMilestone.toLocaleString()}
						</p>
					</div>
					<p class="text-xs text-muted-foreground">Next milestone</p>
				</div>
			</div>

			<!-- Progress bar -->
			<div class="relative h-2 overflow-hidden rounded-full bg-white/5">
				<div
					class="h-full rounded-full bg-gradient-to-r from-warning/60 to-warning transition-all duration-700"
					style="width: {progress}%"
				></div>
			</div>
			<div class="mt-2 flex items-center justify-between">
				<p class="text-xs text-muted-foreground">{progress}% to next milestone</p>
				{#if forecast.daysUntilMilestone !== null}
					<p class="text-xs font-semibold text-foreground">
						{(forecast.nextMilestone - forecast.currentStars).toLocaleString()} stars to go
					</p>
				{/if}
			</div>
		</div>

		<!-- Velocity + projection stats -->
		<div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
			<div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
				<p class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Weekly</p>
				<p class="mt-2 text-xl font-black text-warning">+{forecast.weeklyVelocity}</p>
				<p class="text-xs text-muted-foreground">stars this week</p>
			</div>

			<div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
				<p class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Daily avg</p>
				<p class="mt-2 text-xl font-black text-foreground">
					{forecast.velocityPerDay > 0
						? forecast.velocityPerDay >= 1
							? `${forecast.velocityPerDay.toFixed(1)}`
							: `${(forecast.velocityPerDay * 7).toFixed(1)}`
						: '0'}
				</p>
				<p class="text-xs text-muted-foreground">
					{forecast.velocityPerDay >= 1 ? 'stars/day' : 'stars/week'}
				</p>
			</div>

			<div class="col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-1">
				<p class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ETA</p>
				{#if forecast.projectedDate && forecast.daysUntilMilestone !== null}
					<p class="mt-2 text-xl font-black text-primary">
						{formatDays(forecast.daysUntilMilestone)}
					</p>
					<p class="text-xs text-muted-foreground">{formatDate(forecast.projectedDate)}</p>
				{:else}
					<p class="mt-2 text-xl font-black text-muted-foreground">—</p>
					<p class="text-xs text-muted-foreground">No velocity yet</p>
				{/if}
			</div>
		</div>

		<!-- Narrative -->
		<div class="rounded-2xl border border-primary/20 bg-primary/5 p-4">
			<div class="mb-2 flex items-center gap-2">
				<Zap class="h-4 w-4 text-primary" />
				<p class="text-[10px] font-bold tracking-widest text-primary uppercase">Forecast</p>
				{#if forecast.hasEnoughData}
					<span class="ml-auto text-[10px] font-semibold {confidenceClass(forecast.confidence)} uppercase">
						{forecast.confidence} confidence
					</span>
				{/if}
			</div>
			<p class="text-sm leading-relaxed text-foreground">{forecast.narrative}</p>
		</div>

		{#if !forecast.hasEnoughData}
			<div class="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
				<p class="text-sm text-muted-foreground">
					Sync daily for 3+ days to unlock a calibrated star projection.
				</p>
			</div>
		{/if}
	{/if}
</div>
