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
	import { HelpTooltip } from '$lib/components/ui/tooltip';
	import { LABELS, TOOLTIPS } from '$lib/constants/labels';
	import { Activity, Rocket, Zap, Clock, Star, AlertTriangle, CheckCircle } from 'lucide-svelte';
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
			<h1 class="text-4xl font-bold tracking-tight text-foreground">Your Ecosystem</h1>
			<p class="mt-2 text-lg text-muted-foreground/80">Monitor and grow your open-source impact.</p>
		</div>

		<Button
			href="/dashboard/connect"
			class="group relative h-12 overflow-hidden rounded-full bg-primary px-8 font-semibold text-primary-foreground transition-all hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background"
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
				<div class="h-48 animate-pulse rounded-2xl border border-border bg-muted"></div>
			{/each}
		</div>
	{:else if repos.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-3xl border glass-panel p-12 text-center lg:p-16"
		>
			<div class="mb-8 flex items-center justify-center">
				<svg
					class="h-32 w-32 text-primary/20"
					viewBox="0 0 200 200"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<circle
						cx="100"
						cy="100"
						r="80"
						stroke="currentColor"
						stroke-width="2"
						fill="none"
						class="opacity-30"
					/>
					<circle
						cx="100"
						cy="100"
						r="60"
						stroke="currentColor"
						stroke-width="1.5"
						fill="none"
						class="opacity-20"
					/>
					<circle
						cx="100"
						cy="100"
						r="40"
						stroke="currentColor"
						stroke-width="1"
						fill="none"
						class="opacity-15"
					/>
					<path
						d="M100 50 L100 150 M50 100 L150 100"
						stroke="currentColor"
						stroke-width="1"
						class="opacity-10"
					/>
					<circle cx="100" cy="70" r="8" fill="currentColor" class="opacity-60" />
					<circle cx="130" cy="90" r="5" fill="currentColor" class="opacity-40" />
					<circle cx="70" cy="90" r="5" fill="currentColor" class="opacity-40" />
					<circle cx="85" cy="125" r="6" fill="currentColor" class="opacity-50" />
					<circle cx="115" cy="125" r="6" fill="currentColor" class="opacity-50" />
					<path
						d="M60 60 Q80 40 100 50 Q120 40 140 60"
						stroke="currentColor"
						stroke-width="2"
						fill="none"
						class="opacity-40"
					/>
				</svg>
			</div>
			<h3 class="text-2xl font-bold text-foreground">Ready to launch your growth?</h3>
			<p class="mt-2 mb-8 max-w-lg text-lg text-muted-foreground">
				Connect any public or private GitHub repo to unlock AI-powered health scores, automated
				insights, and streak tracking — all in one dashboard.
			</p>

			<div class="mb-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
				<div class="flex items-center gap-2">
					<CheckCircle class="h-4 w-4 text-success" />
					<span>AI Health Score</span>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle class="h-4 w-4 text-success" />
					<span>Commit Streaks</span>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle class="h-4 w-4 text-success" />
					<span>Weekly Reports</span>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle class="h-4 w-4 text-success" />
					<span>Growth Cards</span>
				</div>
			</div>

			<Button
				href="/dashboard/connect"
				variant="outline"
				class="h-12 rounded-full border-border bg-muted px-10 hover:bg-muted/80"
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
						class="relative flex h-full flex-col overflow-hidden rounded-3xl border glass-card p-8"
					>
						<!-- Hover Glow -->
						<div
							class="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100"
						></div>

						<div class="mb-6 flex items-start justify-between">
							<div class="space-y-1">
								<h3 class="text-xl font-bold text-foreground">{repo.name}</h3>
								<p class="text-sm text-muted-foreground">{repo.owner}</p>
							</div>
							<div class="flex items-center gap-2">
								{#if repo.lastError}
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive"
										title={repo.lastError}
									>
										<AlertTriangle class="h-4 w-4" />
									</div>
								{/if}
								<HelpTooltip content={TOOLTIPS.HEALTH_SCORE}>
									<div
										class={`flex h-12 w-12 cursor-help items-center justify-center rounded-2xl text-xl font-bold ${
											repo.hasScore
												? 'border border-success/20 bg-success/10 text-success'
												: 'border border-border bg-muted text-muted-foreground'
										}`}
									>
										{repo.hasScore ? repo.healthScore : '...'}
									</div>
								</HelpTooltip>
							</div>
						</div>

						<div class="mt-auto grid grid-cols-2 gap-6 border-t pt-6">
							<div class="space-y-1">
								<div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<Star class="h-3 w-3" /> Stars
								</div>
								<div class="text-lg font-bold text-foreground">{repo.starsCount}</div>
							</div>
							<div class="space-y-1">
								<div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<Activity class="h-3 w-3" />
									{trendLabel(repo)}
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
