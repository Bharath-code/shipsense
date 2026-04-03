<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { AlertTriangle, TrendingUp, Users, ChevronRight } from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	const anomalyQuery = useQuery(api.anomalies.getRepoAnomalies, () => ({ repoId }));
	let anomalies = $derived(anomalyQuery.data ?? []);
	let isLoading = $derived(anomalyQuery.isLoading);
	let open = $state(false);

	function iconFor(kind: string) {
		if (kind === 'star_spike') return TrendingUp;
		if (kind === 'contributor_spike') return Users;
		return AlertTriangle;
	}

	function colorFor(severity: string): string {
		if (severity === 'high') return 'text-destructive';
		if (severity === 'medium') return 'text-warning';
		return 'text-primary';
	}
 </script>

<div class="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-border/80">
	<div class="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
	<div class="relative p-6">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
					<AlertTriangle class="h-5 w-5 text-destructive" />
				</div>
				<div>
					<h3 class="font-semibold text-foreground">Anomaly Alerts</h3>
					<p class="text-xs text-muted-foreground">Timely momentum signals worth acting on</p>
				</div>
			</div>
			<span class="text-sm text-muted-foreground">{anomalies.length} active</span>
		</div>

		{#if isLoading}
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
				Scanning for anomalies...
			</div>
		{:else if anomalies.length === 0}
			<div class="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
				No active anomaly alerts right now.
			</div>
		{:else}
			<button
				type="button"
				class="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-left text-sm transition-colors hover:bg-muted"
				onclick={() => (open = !open)}
			>
				<div>
					<p class="font-medium text-foreground">{anomalies[0].title}</p>
					<p class="mt-0.5 text-xs text-muted-foreground">{anomalies[0].description}</p>
				</div>
				<ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground transition-transform {open ? 'rotate-90' : ''}" />
			</button>

			{#if open}
				<div class="mt-3 space-y-2">
					{#each anomalies as anomaly}
						{@const Icon = iconFor(anomaly.kind)}
						<div class="rounded-lg border border-border/50 bg-background/40 p-3">
							<div class="flex items-start gap-3">
								<Icon class="mt-0.5 h-4 w-4 shrink-0 {colorFor(anomaly.severity)}" />
								<div class="min-w-0">
									<p class="text-sm font-medium text-foreground">{anomaly.title}</p>
									<p class="mt-1 text-xs text-muted-foreground">{anomaly.description}</p>
									<p class="mt-2 text-xs font-medium {colorFor(anomaly.severity)}">
										Next move: {anomaly.recommendedAction}
									</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
