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

<Card class="border-border bg-card shadow-sm transition-colors">
	<CardHeader class="border-b border-border pb-3">
		<div class="flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<Sparkles class="h-4 w-4" />
			</div>
			<div>
				<CardTitle class="text-base font-semibold">AI Insights</CardTitle>
				<p class="text-xs text-muted-foreground">Powered by Gemini</p>
			</div>
		</div>
	</CardHeader>

	<CardContent class="space-y-6 pt-5">
		{#if isLoading}
			<div class="animate-pulse space-y-3">
				<div class="h-4 w-3/4 rounded bg-muted"></div>
				<div class="h-4 w-full rounded bg-muted"></div>
				<div class="h-4 w-5/6 rounded bg-muted"></div>
			</div>
		{:else if !insights}
			<div class="flex flex-col items-center py-6 text-center text-muted-foreground">
				<Activity class="h-8 w-8 py-1 opacity-20" />
				<p class="mt-2 text-sm">No insights generated yet.</p>
				<p class="text-xs">Check back soon.</p>
			</div>
		{:else}
			<!-- Summary -->
			<div>
				<h4 class="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					Summary
				</h4>
				<p
					class="text-sm leading-relaxed text-foreground transition-colors group-hover:text-primary"
				>
					{insights.summary}
				</p>
			</div>

			<!-- Risk Assessment -->
			<div class="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
				{#if insights.risk.toLowerCase().includes('high') || insights.risk
						.toLowerCase()
						.includes('critical')}
					<div class="mt-0.5 text-destructive"><AlertTriangle class="h-4 w-4" /></div>
				{:else if insights.risk.toLowerCase().includes('medium')}
					<div class="mt-0.5 text-warning"><AlertTriangle class="h-4 w-4" /></div>
				{:else}
					<div class="mt-0.5 text-success"><CheckCircle class="h-4 w-4" /></div>
				{/if}
				<div>
					<h4 class="text-xs font-semibold text-muted-foreground">Risk Assessment</h4>
					<p class="mt-1 text-sm text-foreground">{insights.risk}</p>
				</div>
			</div>

			<!-- Recommended Actions -->
			{#if insights.actions && insights.actions.length > 0}
				<div>
					<h4 class="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
						Recommended Actions
					</h4>
					<ul class="space-y-2">
						{#each insights.actions as action}
							<li class="flex items-start gap-2 text-sm text-foreground">
								<span class="mt-1 shrink-0 text-primary">•</span>
								<span>{action}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}
	</CardContent>
</Card>
