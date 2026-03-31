<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Activity, Rocket, Zap, Clock, Star } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import ArrowRightIcon from 'lucide-svelte/icons/arrow-right';

	const activeReposQuery = useQuery(api.repos.listMyRepos, {});

	let repos = $derived(activeReposQuery.data || []);
	let isLoading = $derived(activeReposQuery.isLoading);

	function formatMomentum(momentum: number) {
		if (momentum > 0) return `+${momentum}`;
		return `${momentum}`;
	}

	function momentumTone(trend: 'up' | 'down' | 'stable') {
		if (trend === 'up') return 'text-success';
		if (trend === 'down') return 'text-destructive';
		return 'text-muted-foreground';
	}

	function hasNumericMomentum(momentum: number | null | undefined): momentum is number {
		return typeof momentum === 'number';
	}

	function trendLabel(repo: {
		hasScore: boolean;
		hasTrend: boolean;
		trend: 'up' | 'down' | 'stable';
	}) {
		if (!repo.hasScore) return 'Status';
		return repo.hasTrend ? 'Trend' : 'Status';
	}
</script>

<svelte:head>
	<title>Dashboard | ShipSense</title>
</svelte:head>

<div class="space-y-10">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-4xl font-bold tracking-tight text-white/90">Your Ecosystem</h1>
			<p class="mt-2 text-lg text-muted-foreground/80">Monitor and grow your open-source impact.</p>
		</div>

		<Button
			href="/dashboard/connect"
			class="group relative h-12 overflow-hidden rounded-full bg-primary px-8 font-semibold text-primary-foreground transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-slate-950"
		>
			<span class="relative z-10 flex items-center gap-2">
				Connect Repository
				<ArrowRightIcon class="h-4 w-4 transition-transform group-hover:translate-x-1" />
			</span>
		</Button>
	</div>

	{#if isLoading}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(3) as _}
				<div class="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"></div>
			{/each}
		</div>
	{:else if repos.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-3xl glass-panel border-white/5 p-16 text-center"
		>
			<div
				class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]"
			>
				<Rocket class="h-10 w-10" />
			</div>
			<h3 class="text-2xl font-bold text-white/90">No repositories yet</h3>
			<p class="mt-2 mb-10 max-w-sm text-lg text-muted-foreground/80">
				Connect your first GitHub repository to start generating AI insights and tracking growth
				streaks.
			</p>
			<Button
				href="/dashboard/connect"
				variant="outline"
				class="h-12 rounded-full border-white/10 bg-white/5 px-10 hover:bg-white/10"
			>
				Connect your first repo
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each repos as repo}
				<a
					href={`/dashboard/${repo._id}`}
					class="group transition-transform group-hover:scale-[1.02]"
				>
					<div
						class="relative flex h-full flex-col overflow-hidden rounded-3xl glass-card border-white/10 p-8"
					>
						<!-- Hover Glow -->
						<div
							class="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100"
						></div>

						<div class="mb-6 flex items-start justify-between">
							<div class="space-y-1">
								<h3 class="text-xl font-bold text-white/90">{repo.name}</h3>
								<p class="text-sm text-muted-foreground/60">{repo.owner}</p>
							</div>
							<div
								class={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black shadow-[0_0_15px_rgba(var(--success-rgb),0.2)] ${
									repo.hasScore
										? 'border border-success/20 bg-success/10 text-success'
										: 'border border-white/10 bg-white/5 text-muted-foreground'
								}`}
							>
								{repo.hasScore ? repo.healthScore : '...'}
							</div>
						</div>

						<div class="mt-auto grid grid-cols-2 gap-6 border-t border-white/5 pt-6">
							<div class="space-y-1">
								<div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<Star class="h-3 w-3" /> Stars
								</div>
								<div class="text-lg font-bold text-white/80">{repo.starsCount}</div>
							</div>
							<div class="space-y-1">
								<div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<Activity class="h-3 w-3" /> {trendLabel(repo)}
								</div>
								{#if !repo.hasScore}
									<div class="text-sm font-medium text-muted-foreground">Syncing</div>
								{:else if !repo.hasTrend}
									<div class="text-sm font-medium text-muted-foreground">Baseline</div>
								{:else if hasNumericMomentum(repo.momentum)}
									<div class={`text-lg font-bold ${momentumTone(repo.trend)}`}>
										{formatMomentum(repo.momentum)}
									</div>
								{:else}
									<div class="text-sm font-medium text-muted-foreground">Stable</div>
								{/if}
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
