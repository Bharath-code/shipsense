<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { README_SCORE_RULES } from '$lib/utils/readmeAnalysis';
	import { FileText, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	const snapshotQuery = useQuery(api.dashboard.getScoreBreakdown, () => ({ repoId }));
	let data = $derived(snapshotQuery.data);
	let isLoading = $derived(snapshotQuery.isLoading);

	let showFullSuggestions = $state(false);
	let showScoreBreakdown = $state(false);

	function getScoreColor(score: number | null): string {
		if (score === null) return 'text-muted-foreground';
		if (score >= 80) return 'text-success';
		if (score >= 60) return 'text-warning';
		if (score >= 40) return 'text-orange-500';
		return 'text-destructive';
	}

	const scoreValue = $derived(data?.readmeScore ?? null);
	const suggestionsValue = $derived(data?.readmeSuggestions ?? []);
</script>

<div
	class="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-border/80"
>
	<div
		class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
	></div>

	<div class="relative p-6">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<FileText class="h-5 w-5 text-primary" />
				</div>
				<div>
					<h3 class="font-semibold text-foreground">README Score</h3>
					<p class="text-xs text-muted-foreground">Documentation quality</p>
				</div>
			</div>
			{#if scoreValue !== null}
				<div class="flex items-center gap-2">
					<span class="text-3xl font-black {getScoreColor(scoreValue)}">{scoreValue}</span>
					<span class="text-sm text-muted-foreground">/100</span>
				</div>
			{/if}
		</div>

		{#if isLoading}
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
				></div>
				Analyzing README...
			</div>
		{:else if scoreValue === null}
			<div class="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
				<AlertCircle class="h-4 w-4" />
				No README data yet. Run a sync to analyze.
			</div>
		{:else}
			<div class="mb-4">
				<div class="h-2 overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full transition-all duration-500 {scoreValue >= 80
							? 'bg-success'
							: scoreValue >= 60
								? 'bg-warning'
								: scoreValue >= 40
									? 'bg-orange-500'
									: 'bg-destructive'}"
						style="width: {scoreValue}%"
					></div>
				</div>
			</div>

			<div class="space-y-2">
				<button
					type="button"
					class="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-left text-sm transition-colors hover:bg-muted"
					onclick={() => (showScoreBreakdown = !showScoreBreakdown)}
				>
					<span class="text-muted-foreground">How the score is calculated</span>
					<div class="flex items-center gap-2">
						<span class="text-xs text-muted-foreground">Max 100 points</span>
						<ChevronRight
							class="h-4 w-4 text-muted-foreground transition-transform {showScoreBreakdown
								? 'rotate-90'
								: ''}"
						/>
					</div>
				</button>

				{#if showScoreBreakdown}
					<div class="rounded-lg border border-border/50 bg-background/40 p-3">
						<div class="space-y-2">
							{#each README_SCORE_RULES as rule}
								<div class="flex items-start justify-between gap-4 text-xs">
									<div>
										<p class="font-medium text-foreground">{rule.label}</p>
										<p class="text-muted-foreground">{rule.description}</p>
									</div>
									<span class="shrink-0 rounded-full bg-muted px-2 py-1 text-muted-foreground">
										{rule.maxPoints} pts
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if suggestionsValue && suggestionsValue.length > 0}
					<button
						type="button"
						class="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-left text-sm transition-colors hover:bg-muted"
						onclick={() => (showFullSuggestions = !showFullSuggestions)}
					>
						<span class="flex items-center gap-2 text-muted-foreground">
							<AlertCircle class="h-4 w-4 text-warning" />
							{suggestionsValue.length} suggestion{suggestionsValue.length > 1 ? 's' : ''}
						</span>
						<ChevronRight
							class="h-4 w-4 text-muted-foreground transition-transform {showFullSuggestions
								? 'rotate-90'
								: ''}"
						/>
					</button>

					{#if showFullSuggestions}
						<div class="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3">
							{#each suggestionsValue as suggestion}
								<div class="flex items-start gap-2 text-xs">
									<ChevronRight class="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
									<span class="text-muted-foreground">{suggestion}</span>
								</div>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
					<CheckCircle2 class="h-4 w-4" />
					README looks great!
				</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
