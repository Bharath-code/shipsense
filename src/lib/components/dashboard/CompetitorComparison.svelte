<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import {
		Star,
		TrendingUp,
		TrendingDown,
		Users,
		GitPullRequest,
		ArrowUpRight,
		ArrowDownRight,
		Zap
	} from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';

	let { repoId }: { repoId: string } = $props();

	const client = useConvexClient();

	// Fetch data
	const userRepoQuery = useQuery(api.dashboard.getRepoDetails, { repoId: repoId as any });
	const watchlistQuery = useQuery(api.watchlist.getMyWatchlist, {});

	let userRepo = $derived(userRepoQuery.data);
	let watchlist = $derived(watchlistQuery.data ?? []);
	let isLoading = $derived(userRepoQuery.isLoading || watchlistQuery.isLoading);

	// Comparison Logic
	$: if (userRepo && watchlist.length > 0) {
		// Ensure we are comparing against the correct repo if userRepo is actually a watchlist entry
		// (though in this context userRepo is the repo the dashboard is for)
	}

	function formatNumber(n: number | null | undefined): string {
		if (n == null) return '—';
		if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
		return n.toString();
	}

	// Helpers for visual indicators
	function getTrendStatus(userVal: number, compVal: number) {
		if (compVal > userVal) return 'winning';
		if (compVal < userVal) return 'lagging';
		return 'stable';
	}
</script>

{#if isLoading}
	<div class="h-64 animate-pulse rounded-2xl border border-border bg-muted"></div>
{:else if watchlist.length === 0}
	<div class="rounded-2xl border border-border bg-card p-8 text-center">
		<Zap class="mx-auto h-8 w-8 text-muted-foreground/40" />
		<p class="mt-3 text-sm font-semibold text-foreground">No competitors in watchlist</p>
		<p class="mt-1 text-sm text-muted-foreground">
			Add repositories to your watchlist to see how they compare to yours.
		</p>
	</div>
{:else}
	<div class="overflow-hidden rounded-lg border border-border bg-card">
		<div class="border-b border-border bg-card px-6 py-4">
			<h3 class="text-lg font-bold text-foreground">Growth Comparison</h3>
			<p class="text-xs text-muted-foreground">Comparing <b>{userRepo?.name}</b> against your watchlist</p>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead>
					<tr class="border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
						<th class="px-6 py-4">Competitor</th>
						<th class="px-4 py-4 text-center">Stars (7d)</th>
						<th class="px-4 py-4 text-center">Contributors (14d)</th>
						<th class="px-4 py-4 text-center">PRs Merged (7d)</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/5">
					{#each watchlist as entry}
						<tr class="group hover:bg-card transition-colors">
							<td class="px-6 py-4">
								<div class="flex flex-col">
									<span class="text-sm font-semibold text-foreground">{entry.fullName}</span>
									<span class="text-[10px] text-muted-foreground">Total Stars: {formatNumber(entry.starsCount)}</span>
								</div>
							</td>

							<!-- Stars Comparison -->
							<td class="px-4 py-4 text-center">
								<div class="flex flex-col items-center gap-1">
									<span class="text-sm font-bold text-foreground">+{formatNumber(entry.starsLast7d)}</span>
									{#if userRepo && entry.starsLast7d !== undefined}
										{@const status = getTrendStatus(userRepo.starsLast7d ?? 0, entry.starsLast7d ?? 0)}
										{#if status === 'winning'}
											<div class="flex items-center gap-1 text-[10px] font-bold text-success">
												<ArrowUpRight class="h-3 w-3" /> Winning
											</div>
										{:else if status === 'lagging'}
											<div class="flex items-center gap-1 text-[10px] font-bold text-destructive">
												<ArrowDownRight class="h-3 w-3" /> Lagging
											</div>
										{:else}
											<span class="text-[10px] text-muted-foreground">Stable</span>
										{/if}
									{/if}
								</div>
							</td>

							<!-- Contributors Comparison -->
							<td class="px-4 py-4 text-center">
								<div class="flex flex-col items-center gap-1">
									<span class="text-sm font-bold text-foreground">{formatNumber(entry.contributors14d)}</span>
									{#if userRepo && entry.contributors14d !== undefined}
										{@const status = getTrendStatus(userRepo.contributors14d ?? 0, entry.contributors14d ?? 0)}
										{#if status === 'winning'}
											<div class="flex items-center gap-1 text-[10px] font-bold text-success">
												<ArrowUpRight class="h-3 w-3" /> Winning
											</div>
										{:else if status === 'lagging'}
											<div class="flex items-center gap-1 text-[10px] font-bold text-destructive">
												<ArrowDownRight class="h-3 w-3" /> Lagging
											</div>
										{:else}
											<span class="text-[10px] text-muted-foreground">Stable</span>
										{/if}
									{/if}
								</div>
							</td>

							<!-- PRs Comparison -->
							<td class="px-4 py-4 text-center">
								<div class="flex flex-col items-center gap-1">
									<span class="text-sm font-bold text-foreground">{formatNumber(entry.prsMerged7d)}</span>
									{#if userRepo && entry.prsMerged7d !== undefined}
										{@const status = getTrendStatus(userRepo.prsMerged7d ?? 0, entry.prsMerged7d ?? 0)}
										{#if status === 'winning'}
											<div class="flex items-center gap-1 text-[10px] font-bold text-success">
												<ArrowUpRight class="h-3 w-3" /> Winning
											</div>
										{:else if status === 'lagging'}
											<div class="flex items-center gap-1 text-[10px] font-bold text-destructive">
												<ArrowDownRight class="h-3 w-3" /> Lagging
											</div>
										{:else}
											<span class="text-[10px] text-muted-foreground">Stable</span>
										{/if}
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
