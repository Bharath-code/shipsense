<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Sparkles, AlertTriangle, CheckCircle, Activity } from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	// Fetch insights
	const insightsQuery = useQuery(api.dashboard.getRepoInsights, () => ({ repoId: repoId as any }));
	let insights = $derived(insightsQuery.data);
	let isLoading = $derived(insightsQuery.isLoading);
</script>

<div class="overflow-hidden rounded-[2rem] border glass-panel p-8 shadow-2xl">
	<div class="mb-8 flex items-center justify-between border-b pb-6">
		<div class="flex items-center gap-4">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
			>
				<Sparkles class="h-6 w-6" />
			</div>
			<div>
				<h3 class="text-xl font-bold text-foreground">AI Insights</h3>
				<p class="text-sm font-medium tracking-widest text-muted-foreground uppercase">
					Intelligence Layer
				</p>
			</div>
		</div>
		<Badge
			variant="outline"
			class="rounded-full border-border bg-muted px-4 py-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
		>
			Beta 1.0
		</Badge>
	</div>

	<div class="space-y-8">
		{#if isLoading}
			<div class="animate-pulse space-y-4">
				<div class="h-4 w-3/4 rounded-full bg-white/10"></div>
				<div class="h-4 w-full rounded-full bg-white/10"></div>
				<div class="h-4 w-5/6 rounded-full bg-white/10"></div>
			</div>
		{:else if !insights}
			<div class="flex flex-col items-center py-12 text-center text-muted-foreground">
				<Activity class="h-12 w-12 py-1 opacity-20" />
				<p class="mt-4 text-lg font-medium text-muted-foreground">No insights generated yet.</p>
				<p class="text-sm">Check back in 24 hours.</p>
			</div>
		{:else}
			<!-- Summary -->
			<div class="space-y-3">
				<h4 class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
					Growth Summary
				</h4>
				<p class="text-lg leading-relaxed text-foreground transition-colors">
					{insights.summary}
				</p>
			</div>

			<!-- Risk Assessment -->
			<div
				class="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04]"
			>
				<div class="relative z-10 flex items-start gap-4">
					{#if insights.risk.toLowerCase().includes('high') || insights.risk
							.toLowerCase()
							.includes('critical')}
						<div
							class="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive shadow-[0_0_15px_rgba(var(--destructive-rgb),0.2)]"
						>
							<AlertTriangle class="h-5 w-5" />
						</div>
					{:else if insights.risk.toLowerCase().includes('medium')}
						<div
							class="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning shadow-[0_0_15px_rgba(var(--warning-rgb),0.2)]"
						>
							<AlertTriangle class="h-5 w-5" />
						</div>
					{:else}
						<div
							class="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success shadow-[0_0_15px_rgba(var(--success-rgb),0.2)]"
						>
							<CheckCircle class="h-5 w-5" />
						</div>
					{/if}
					<div>
						<h4 class="text-sm font-bold text-foreground">Health Risk Warning</h4>
						<p class="mt-1 text-base text-muted-foreground/80">{insights.risk}</p>
					</div>
				</div>
			</div>

			<!-- Recommended Actions -->
			{#if insights.actions && insights.actions.length > 0}
				<div class="space-y-4">
					<h4 class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
						Next Strategic Moves
					</h4>
					<div class="grid gap-3">
						{#each insights.actions as action}
							<div
								class="flex items-center gap-3 rounded-2xl border bg-muted/50 p-4 text-sm text-foreground transition-all hover:bg-muted"
							>
								<div
									class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
								></div>
								{action}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
