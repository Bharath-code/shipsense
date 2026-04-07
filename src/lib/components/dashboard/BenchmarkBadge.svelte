<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Award, TrendingUp, Users } from 'lucide-svelte';

	let { repoId }: { repoId: string } = $props();

	const benchmarkQuery = useQuery(api.dashboard.getRepoBenchmark, () => ({
		repoId: repoId as any
	}));

	let bm = $derived(benchmarkQuery.data);

	type Tier = 'elite' | 'strong' | 'average' | 'developing';

	const tierStyles: Record<Tier, { badge: string; ring: string; text: string; glow: string }> = {
		elite: {
			badge: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
			ring: 'stroke-amber-400',
			text: 'text-amber-300',
			glow: 'bg-amber-400/8'
		},
		strong: {
			badge: 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300',
			ring: 'stroke-emerald-400',
			text: 'text-emerald-300',
			glow: 'bg-emerald-400/8'
		},
		average: {
			badge: 'bg-blue-400/15 border-blue-400/30 text-blue-300',
			ring: 'stroke-blue-400',
			text: 'text-blue-300',
			glow: 'bg-blue-400/8'
		},
		developing: {
			badge: 'bg-white/10 border-white/20 text-muted-foreground',
			ring: 'stroke-muted-foreground',
			text: 'text-muted-foreground',
			glow: 'bg-white/5'
		}
	};

	let style = $derived(bm ? tierStyles[bm.tier] : tierStyles.average);

	// SVG donut arc for percentile ring
	const RADIUS = 30;
	const CIRC = 2 * Math.PI * RADIUS;
	let dash = $derived(bm ? (bm.percentile / 100) * CIRC : 0);
	let gap = $derived(CIRC - dash);
</script>

{#if bm}
	<div
		class="relative overflow-hidden rounded-[2rem] border border-white/10 glass-panel p-6 shadow-xl {style.glow}"
	>
		<!-- Gradient ambient -->
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-30 blur-3xl {style.glow}"
		></div>

		<div class="relative flex flex-wrap items-start gap-6">
			<!-- Percentile ring -->
			<div class="relative flex h-20 w-20 shrink-0 items-center justify-center">
				<svg class="absolute inset-0 -rotate-90" viewBox="0 0 72 72">
					<!-- Track -->
					<circle
						cx="36"
						cy="36"
						r={RADIUS}
						fill="none"
						stroke-width="5"
						class="stroke-white/10"
					/>
					<!-- Fill -->
					<circle
						cx="36"
						cy="36"
						r={RADIUS}
						fill="none"
						stroke-width="5"
						stroke-linecap="round"
						stroke-dasharray="{dash} {gap}"
						class="{style.ring} transition-all duration-700"
					/>
				</svg>
				<div class="z-10 text-center">
					<p class="text-lg font-black leading-none {style.text}">{bm.percentile}</p>
					<p class="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">pct</p>
				</div>
			</div>

			<!-- Main content -->
			<div class="min-w-0 flex-1">
				<div class="mb-3 flex flex-wrap items-center gap-2">
					<span
						class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-widest uppercase {style.badge}"
					>
						<Award class="h-3.5 w-3.5" />
						{bm.tierLabel}
					</span>

					{#if !bm.usedStaticFallback && bm.cohortSize > 0}
						<span class="flex items-center gap-1 text-[10px] text-muted-foreground">
							<Users class="h-3 w-3" />
							{bm.cohortSize} repos tracked
						</span>
					{/if}
				</div>

				<p class="mb-1 text-sm font-bold text-foreground">
					Top {100 - bm.percentile}% of {bm.cohortLabel}
				</p>
				<p class="text-xs leading-relaxed text-muted-foreground">{bm.narrative}</p>

				{#if bm.usedStaticFallback}
					<p class="mt-2 text-[10px] text-muted-foreground/50">
						Based on open-source benchmarks · will refine as network grows
					</p>
				{/if}
			</div>
		</div>

		<div class="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
			<div
				class={[
					'h-full rounded-full transition-all duration-700',
					bm.tier === 'elite' ? 'bg-amber-400' : '',
					bm.tier === 'strong' ? 'bg-emerald-400' : '',
					bm.tier === 'average' ? 'bg-blue-400' : '',
					bm.tier === 'developing' ? 'bg-white/30' : ''
				].filter(Boolean).join(' ')}
				style="width: {bm.percentile}%"
			></div>
			<!-- Pointer tick -->
			<div
				class="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-white/60"
				style="left: {bm.percentile}%"
			></div>
		</div>
		<div class="mt-1.5 flex items-center justify-between">
			<span class="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Bottom</span>
			<div class="flex items-center gap-1 {style.text}">
				<TrendingUp class="h-3 w-3" />
				<span class="text-[10px] font-bold">{bm.percentile}th percentile</span>
			</div>
			<span class="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Top 1%</span>
		</div>
	</div>
{/if}
