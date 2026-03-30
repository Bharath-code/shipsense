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

<Card class="border-border bg-card shadow-sm transition-colors">
	<CardHeader class="border-b border-border pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<TrendingUp class="h-4 w-4" />
				</div>
				<div>
					<CardTitle class="text-base font-semibold">Momentum Engine</CardTitle>
					<p class="text-xs text-muted-foreground">Last 7 snapshots (health score trend)</p>
				</div>
			</div>

			{#if history.length > 0}
				<div class="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1">
					<Activity class="h-3 w-3 text-success" />
					<span class="text-xs font-semibold text-foreground"
						>{history[history.length - 1]?.healthScore || 0}</span
					>
				</div>
			{/if}
		</div>
	</CardHeader>

	<CardContent class="pt-6">
		{#if isLoading}
			<div class="flex h-40 animate-pulse items-end justify-between gap-2">
				{#each [1, 2, 3, 4, 5, 6, 7] as idx}
					<div
						class="w-full rounded-t-sm bg-muted"
						style={`height: ${Math.random() * 80 + 20}%`}
					></div>
				{/each}
			</div>
		{:else if history.length === 0}
			<div class="flex h-40 flex-col items-center justify-center text-center">
				<div
					class="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border bg-muted/50 text-muted-foreground"
				>
					<BarChart2 class="h-5 w-5" />
				</div>
				<p class="text-sm font-medium text-muted-foreground">Waiting for first snapshot</p>
				<p class="mt-1 text-xs text-muted-foreground/60">Data will populate after analysis runs.</p>
			</div>
		{:else}
			<div class="relative flex h-48 flex-col">
				<!-- Y Axis Lines -->
				<div
					class="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between pb-6"
				>
					<div class="w-full border-t border-dashed border-border/80"></div>
					<div class="w-full border-t border-dashed border-border/50"></div>
					<div class="w-full border-t border-dashed border-border/30"></div>
					<div class="w-full space-y-0 border-t border-border"></div>
				</div>

				<!-- Bars Container -->
				<div
					class="relative z-10 mb-6 flex flex-1 items-end justify-between gap-1 px-1 pt-4 pb-0 sm:gap-2"
				>
					{#each history as point, i}
						<div class="group relative flex h-full w-full flex-col justify-end">
							<!-- Bar -->
							<div
								class="w-full rounded-t-sm border-t border-primary/50 bg-gradient-to-t from-primary/50 via-primary/80 to-primary transition-all duration-500 ease-out hover:brightness-125"
								style={`height: ${(point.healthScore / maxScore) * 100}%`}
							>
								<!-- Score Tooltip on hover -->
								<div
									class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded border border-border bg-popover px-2 py-1 text-[10px] font-bold text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
								>
									{point.healthScore}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- X Axis Labels -->
				<div class="absolute inset-x-0 bottom-0 flex h-6 justify-between px-1">
					{#each history as point}
						<div class="w-full text-center">
							<span
								class="text-[9px] font-medium tracking-wider whitespace-nowrap text-muted-foreground uppercase"
							>
								{formatDate(point.calculatedAt)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
