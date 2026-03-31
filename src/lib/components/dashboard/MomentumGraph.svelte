<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { TrendingUp, BarChart2, Activity } from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	// Use raw context repoId
	const scoreHistoryQuery = useQuery(api.dashboard.getRepoScoreHistory, () => ({
		repoId: repoId as any
	}));

	let history = $derived(scoreHistoryQuery.data || []);
	let isLoading = $derived(scoreHistoryQuery.isLoading);

	// Normalize scores for graph heights (0-100% relative to max)
	let maxScore = $derived(Math.max(10, ...history.map((h: any) => h.healthScore)));

	// Format date correctly
	function formatDate(timestamp: number) {
		return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
			new Date(timestamp)
		);
	}
</script>

<div class="group relative flex flex-col rounded-[2rem] border glass-panel p-8 shadow-2xl">
	<div class="mb-10 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
			>
				<Activity class="h-6 w-6" />
			</div>
			<div>
				<h3 class="text-xl font-bold text-foreground">Momentum Engine</h3>
				<p class="text-xs font-medium tracking-tight text-muted-foreground">
					Last 7 health snapshots
				</p>
			</div>
		</div>

		{#if history.length > 0}
			<div
				class="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2 shadow-inner"
			>
				<div class="h-2 w-2 animate-pulse rounded-full bg-success"></div>
				<span class="text-sm font-bold text-foreground">
					{history[history.length - 1]?.healthScore || 0}
				</span>
			</div>
		{/if}
	</div>

	<div class="relative flex-1">
		{#if isLoading}
			<div class="flex h-48 items-end justify-between gap-3 px-2">
				{#each [1, 2, 3, 4, 5, 6, 7] as _}
					<div
						class="w-full animate-pulse rounded-2xl bg-muted"
						style={`height: ${Math.random() * 60 + 20}%`}
					></div>
				{/each}
			</div>
		{:else if history.length === 0}
			<div class="flex h-48 flex-col items-center justify-center space-y-4 text-center">
				<div
					class="rounded-3xl border border-dashed border-border bg-muted p-5 text-muted-foreground"
				>
					<BarChart2 class="h-10 w-10" />
				</div>
				<div class="space-y-1">
					<p class="text-sm font-bold text-foreground">Waiting for first engine fire</p>
					<p class="max-w-[200px] text-xs leading-relaxed text-muted-foreground italic">
						"Analysis data will populate here after the next synchronization."
					</p>
				</div>
			</div>
		{:else}
			<div class="relative flex h-64 flex-col">
				<!-- Y Axis Grid Lines -->
				<div
					class="pointer-events-none absolute inset-x-0 top-0 bottom-12 flex flex-col justify-between"
				>
					<div class="w-full border-t border-white/5"></div>
					<div class="w-full border-t border-white/5"></div>
					<div class="w-full border-t border-white/5"></div>
				</div>

				<!-- Bars Container -->
				<div
					class="relative z-10 flex flex-1 items-end justify-between gap-2 px-2 pt-6 pb-12 sm:gap-4"
				>
					{#each history as point, i}
						<div class="group/bar relative flex h-full w-full flex-col justify-end">
							<!-- Bar Glow (Hidden by default, shows on hover) -->
							<div
								class="absolute bottom-0 left-1/2 w-4/5 -translate-x-1/2 rounded-t-3xl bg-primary/30 opacity-0 blur-2xl transition-opacity duration-500 group-hover/bar:opacity-100"
								style={`height: ${(point.healthScore / maxScore) * 100}%`}
							></div>

							<!-- The Bar -->
							<div
								class="relative w-full overflow-hidden rounded-t-3xl border-t border-white/20 bg-gradient-to-t from-primary/10 via-primary/30 to-primary/60 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/bar:brightness-125"
								style={`height: ${(point.healthScore / maxScore) * 100}%`}
							>
								<!-- Internal Shimmer -->
								<div class="absolute inset-x-0 top-0 h-1 bg-white/20"></div>
							</div>

							<!-- Floating Tooltip -->
							<div
								class="pointer-events-none absolute -top-12 left-1/2 flex -translate-x-1/2 -translate-y-2 flex-col items-center opacity-0 transition-all duration-300 group-hover/bar:-translate-y-4 group-hover/bar:opacity-100"
							>
								<div class="rounded-xl border border-border bg-background px-3 py-1.5 shadow-2xl">
									<span class="text-xs font-bold text-foreground">{point.healthScore}</span>
								</div>
								<div class="h-2 w-px bg-white/20"></div>
							</div>

							<!-- X Label -->
							<div class="absolute inset-x-0 -bottom-8 flex justify-center">
								<span
									class="text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase"
								>
									{formatDate(point.calculatedAt)}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
