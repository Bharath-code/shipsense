<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { BarChart3, Users, Clock } from 'lucide-svelte';

	let { repoId }: { repoId: string } = $props();

	const breakdownQuery = useQuery(api.benchmarks.getCohortBreakdown, () => ({
		repoId: repoId as any
	}));

	let data = $derived(breakdownQuery.data);

	function barWidth(score: number, p90: number): string {
		if (p90 <= 0) return '0%';
		const pct = Math.min(100, (score / p90) * 100);
		return `${pct}%`;
	}

	function percentileTone(p: number): string {
		if (p >= 85) return 'text-amber-400';
		if (p >= 65) return 'text-emerald-400';
		if (p >= 35) return 'text-blue-400';
		return 'text-muted-foreground';
	}

	function percentileBarColor(p: number): string {
		if (p >= 85) return 'bg-amber-400';
		if (p >= 65) return 'bg-emerald-400';
		if (p >= 35) return 'bg-blue-400';
		return 'bg-white/30';
	}
</script>

{#if data}
	<div class="rounded-[2rem] border border-white/10 glass-panel p-6 shadow-xl">
		<div class="mb-5 flex flex-wrap items-start justify-between gap-4">
			<div>
				<div class="mb-2 flex items-center gap-2">
					<BarChart3 class="h-4 w-4 text-primary" />
					<h3 class="text-sm font-bold text-foreground">Cohort Comparison</h3>
				</div>
				<p class="text-xs text-muted-foreground">
					How you compare to {data.cohortLabel}
				</p>
			</div>
			<div class="flex items-center gap-3 text-[10px] text-muted-foreground">
				<span class="flex items-center gap-1">
					<Users class="h-3 w-3" />
					{data.repoCount} repos
				</span>
				<span class="flex items-center gap-1">
					<Clock class="h-3 w-3" />
					Updated {new Date(data.updatedAt).toLocaleDateString()}
				</span>
			</div>
		</div>

		<!-- Overall score comparison -->
		<div class="mb-6 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
			<div class="mb-3 flex items-center justify-between">
				<span class="text-sm font-medium text-foreground">Overall Health Score</span>
				<span class="text-sm font-black {percentileTone(data.overall.percentile)}">
					{data.overall.percentile}th percentile
				</span>
			</div>
			<div class="relative h-2 overflow-hidden rounded-full bg-white/5">
				<div class="absolute inset-y-0 left-0 w-1/4 rounded-full bg-white/10"></div>
				<div class="absolute inset-y-0 left-1/4 w-1/4 rounded-full bg-white/15"></div>
				<div class="absolute inset-y-0 left-2/4 w-1/4 rounded-full bg-white/20"></div>
				<div class="absolute inset-y-0 left-3/4 w-1/4 rounded-full bg-white/25"></div>
				<div
					class="absolute inset-y-0 left-0 rounded-full transition-all duration-700 {percentileBarColor(data.overall.percentile)}"
					style="width: {barWidth(data.overall.score, data.overall.p90)}"
				></div>
				<!-- Marker at actual score -->
				<div
					class="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-white"
					style="left: {barWidth(data.overall.score, data.overall.p90)}"
				></div>
			</div>
			<div class="mt-2 flex justify-between text-[9px] text-muted-foreground/50 uppercase tracking-widest">
				<span>p25 ({Math.round(data.overall.p25)})</span>
				<span>p50 ({Math.round(data.overall.p50)})</span>
				<span>p75 ({Math.round(data.overall.p75)})</span>
				<span>p90 ({Math.round(data.overall.p90)})</span>
			</div>
		</div>

		<!-- Component breakdown -->
		<div class="space-y-4">
			{#each data.components as comp}
				<div>
					<div class="mb-1.5 flex items-center justify-between">
						<span class="text-xs font-medium text-foreground">{comp.name}</span>
						<div class="flex items-center gap-2">
							<span class="text-xs font-semibold text-foreground">{Math.round(comp.score)}</span>
							<span class="text-[10px] font-bold {percentileTone(comp.percentile)}">
								{comp.percentile}%
							</span>
						</div>
					</div>
					<div class="relative h-1.5 overflow-hidden rounded-full bg-white/5">
						<div
							class="absolute inset-y-0 left-0 rounded-full transition-all duration-700 {percentileBarColor(comp.percentile)}"
							style="width: {barWidth(comp.score, comp.p90)}"
						></div>
					</div>
					<div class="mt-1 flex justify-between text-[9px] text-muted-foreground/40">
						<span>p25 {Math.round(comp.p25)}</span>
						<span>p75 {Math.round(comp.p75)}</span>
						<span>p90 {Math.round(comp.p90)}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
