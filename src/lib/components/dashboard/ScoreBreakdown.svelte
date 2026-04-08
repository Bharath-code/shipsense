<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { HelpTooltip } from '$lib/components/ui/tooltip';
	import {
		GitFork,
		GitPullRequest,
		Users,
		Star,
		Clock,
		RefreshCw
	} from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	const breakdownQuery = useQuery(api.dashboard.getScoreBreakdown, () => ({ repoId }));
	let breakdown = $derived(breakdownQuery.data);
	let isLoading = $derived(breakdownQuery.isLoading);

	function formatTimeAgo(timestamp: number): string {
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 60) return 'Just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	function formatCommitGap(hours: number): string {
		if (hours < 1) return 'Active today';
		if (hours < 24) return `${Math.round(hours)}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	const components = $derived(
		breakdown
			? [
					{
						key: 'stars',
						label: 'Stars',
						icon: Star,
						earned: breakdown.components.stars.earned,
						max: breakdown.components.stars.max,
						percentage: breakdown.components.stars.percentage,
						rawValue: breakdown.components.stars.rawValue,
						color: 'bg-yellow-500',
						formula: `${breakdown.components.stars.rawValue} stars ÷ 100 × 35`
					},
					{
						key: 'commits',
						label: 'Commits',
						icon: Clock,
						earned: breakdown.components.commits.earned,
						max: breakdown.components.commits.max,
						percentage: breakdown.components.commits.percentage,
						rawValue: breakdown.components.commits.rawValue,
						color: 'bg-blue-500',
						formula: `25 - ${breakdown.components.commits.rawValue}h × 0.5`
					},
					{
						key: 'issues',
						label: 'Issues',
						icon: Users,
						earned: breakdown.components.issues.earned,
						max: breakdown.components.issues.max,
						percentage: breakdown.components.issues.percentage,
						rawValue: breakdown.components.issues.rawValue,
						color: 'bg-purple-500',
						formula: `20 - ${breakdown.components.issues.rawValue} × 0.5`
					},
					{
						key: 'prs',
						label: 'PRs',
						icon: GitPullRequest,
						earned: breakdown.components.prs.earned,
						max: breakdown.components.prs.max,
						percentage: breakdown.components.prs.percentage,
						rawValue: breakdown.components.prs.rawValue,
						color: 'bg-green-500',
						formula: `${breakdown.components.prs.rawValue} merged ÷ 5 × 10`
					},
					{
						key: 'contributors',
						label: 'Contributors',
						icon: GitFork,
						earned: breakdown.components.contributors.earned,
						max: breakdown.components.contributors.max,
						percentage: breakdown.components.contributors.percentage,
						rawValue: breakdown.components.contributors.rawValue,
						color: 'bg-orange-500',
						formula: `${breakdown.components.contributors.rawValue} contributors ÷ 3 × 10`
					}
				]
			: []
	);

	const syncStatus = $derived(breakdown?.syncStatus);
</script>

<div class="overflow-hidden rounded-[2rem] border glass-panel shadow-2xl">
	<div class="p-6">
		<div class="mb-6 flex items-start justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-bold text-foreground">Score Breakdown</h3>
					<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
						How your score is calculated
					</p>
				</div>
			</div>
			{#if breakdown}
				<div class="text-right">
					<div class="text-3xl font-black text-foreground">{breakdown.healthScore}</div>
					<div class="text-xs text-muted-foreground">Health Score</div>
				</div>
			{/if}
		</div>

		{#if isLoading}
			<div class="space-y-4">
				{#each Array(5) as _}
					<div class="h-12 animate-pulse rounded-lg bg-muted"></div>
				{/each}
			</div>
		{:else if breakdown}
			<div class="space-y-3">
				{#each components as component}
					<HelpTooltip content={component.formula}>
						<div
							class="group cursor-help rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
						>
							<div class="mb-2 flex items-center justify-between gap-4">
								<div class="flex items-center gap-2">
									<component.icon class="h-4 w-4 text-muted-foreground" />
									<span class="text-sm font-medium text-foreground">{component.label}</span>
								</div>
								<div class="flex items-center gap-2 text-sm">
									<span class="font-bold text-foreground">{component.earned}</span>
									<span class="text-muted-foreground">/</span>
									<span class="text-muted-foreground">{component.max}</span>
									<span
										class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
									>
										{component.percentage}%
									</span>
								</div>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full transition-all {component.color}"
									style="width: {component.percentage}%"
								></div>
							</div>
							<div class="mt-1 text-xs text-muted-foreground">
								{#if component.key === 'commits'}
									{formatCommitGap(component.rawValue)}
								{:else if component.key === 'issues'}
									{component.rawValue} open
								{:else if component.key === 'prs'}
									{component.rawValue} merged (7d)
								{:else if component.key === 'contributors'}
									{component.rawValue} (14d)
								{:else}
									{component.rawValue}
								{/if}
							</div>
						</div>
					</HelpTooltip>
				{/each}
			</div>

			<div class="mt-5 rounded-xl bg-muted/30 p-4">
				<p class="text-xs font-medium text-muted-foreground">Formula</p>
				<p class="mt-1 font-mono text-xs text-foreground/80">{breakdown.formula}</p>
				<p class="mt-2 text-xs text-muted-foreground">
					Last calculated: {formatTimeAgo(breakdown.calculatedAt)}
				</p>
			</div>
		{:else}
			<div class="py-8 text-center text-muted-foreground">
				{#if syncStatus === 'syncing'}
					<div class="flex flex-col items-center gap-2">
						<RefreshCw class="h-8 w-8 animate-spin text-primary" />
						<p>Syncing data...</p>
						<p class="text-sm">Score will be calculated shortly</p>
					</div>
				{:else}
					<p>No score data available</p>
					<p class="mt-1 text-sm">Scores are calculated after the first sync</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
