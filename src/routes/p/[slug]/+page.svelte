<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { page } from '$app/stores';
	import { api } from '$convex/_generated/api';
	import {
		Star,
		GitFork,
		GitPullRequest,
		Users,
		Clock,
		TrendingUp,
		TrendingDown,
		Minus
	} from 'lucide-svelte';

	let slug = $derived($page.params.slug as string);

	const healthQuery = useQuery(api.dashboard.getPublicRepoHealth, () => ({ slug }));
	let data = $derived(healthQuery.data);
	let isLoading = $derived(healthQuery.isLoading);

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

	function getScoreColor(score: number | null): string {
		if (score === null) return 'text-muted-foreground';
		if (score >= 80) return 'text-success';
		if (score >= 60) return 'text-warning';
		if (score >= 40) return 'text-orange-500';
		return 'text-destructive';
	}

	function getTrendIcon(trend: string | null) {
		if (trend === 'up') return TrendingUp;
		if (trend === 'down') return TrendingDown;
		return Minus;
	}

	function getTrendColor(trend: string | null): string {
		if (trend === 'up') return 'text-success';
		if (trend === 'down') return 'text-destructive';
		return 'text-muted-foreground';
	}

	const publicUrl = $derived(`https://shipsense.app/p/${slug}`);
	const badgeUrl = $derived(`https://shipsense.app/api/badge/${slug}.svg`);
</script>

<svelte:head>
	<title
		>{data?.repo
			? `${data.repo.fullName} Health | ShipSense`
			: 'Repository Health | ShipSense'}</title
	>
	<meta
		name="description"
		content={data?.repo?.description || 'Repository health dashboard powered by ShipSense'}
	/>
	<meta
		property="og:title"
		content={data?.repo
			? `${data.repo.fullName} Health Score: ${data.healthScore || 'N/A'}/100`
			: 'Repository Health | ShipSense'}
	/>
	<meta
		property="og:description"
		content={data?.repo?.description || 'Track your repository health with ShipSense'}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={publicUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content={data?.repo
			? `${data.repo.fullName} Health Score: ${data.healthScore || 'N/A'}/100`
			: 'Repository Health | ShipSense'}
	/>
</svelte:head>

<div class="min-h-screen bg-background">
	{#if isLoading}
		<div class="flex min-h-screen items-center justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
			></div>
		</div>
	{:else if !data}
		<div class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
			<h1 class="text-2xl font-bold text-foreground">Repository Not Found</h1>
			<p class="text-muted-foreground">This repository is not being tracked by ShipSense.</p>
			<a href="https://shipsense.app" class="text-primary hover:underline"
				>Start tracking your repo →</a
			>
		</div>
	{:else}
		<div class="mx-auto max-w-3xl px-4 py-12">
			<!-- Header -->
			<div class="mb-8 text-center">
				<a
					href="https://shipsense.app"
					class="mb-6 inline-flex items-center gap-2 font-mono font-bold tracking-tighter text-foreground hover:opacity-80"
				>
					<div
						class="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
					>
						S
					</div>
					ShipSense
				</a>
			</div>

			<!-- Repo Info -->
			<div class="mb-8 text-center">
				<h1 class="text-3xl font-black text-foreground">{data.repo.fullName}</h1>
				{#if data.repo.description}
					<p class="mt-2 text-lg text-muted-foreground">{data.repo.description}</p>
				{/if}
				{#if data.repo.language}
					<div
						class="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm"
					>
						<span class="h-2 w-2 rounded-full bg-blue-500"></span>
						{data.repo.language}
					</div>
				{/if}
			</div>

			<!-- Health Score -->
			<div class="mb-8 rounded-3xl border bg-card p-8 text-center shadow-sm">
				<p class="mb-2 text-sm font-medium tracking-widest text-muted-foreground uppercase">
					Health Score
				</p>
				<div class="flex items-center justify-center gap-3">
					<span class="text-7xl font-black {getScoreColor(data.healthScore)}">
						{data.healthScore ?? 'N/A'}
					</span>
					{#if data.trend}
						{@const TrendIcon = getTrendIcon(data.trend)}
						<TrendIcon class="h-8 w-8 {getTrendColor(data.trend)}" />
					{/if}
				</div>
				<p class="mt-2 text-sm text-muted-foreground">/ 100</p>
			</div>

			<!-- Metrics Grid -->
			{#if data.metrics}
				<div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
					<div class="rounded-2xl border bg-card p-4 text-center">
						<Star class="mx-auto mb-2 h-5 w-5 text-warning" />
						<p class="text-2xl font-bold text-foreground">{data.metrics.stars}</p>
						<p class="text-xs text-muted-foreground">Stars</p>
					</div>
					<div class="rounded-2xl border bg-card p-4 text-center">
						<GitFork class="mx-auto mb-2 h-5 w-5 text-primary" />
						<p class="text-2xl font-bold text-foreground">{data.metrics.forks}</p>
						<p class="text-xs text-muted-foreground">Forks</p>
					</div>
					<div class="rounded-2xl border bg-card p-4 text-center">
						<Users class="mx-auto mb-2 h-5 w-5 text-purple-500" />
						<p class="text-2xl font-bold text-foreground">{data.metrics.issuesOpen}</p>
						<p class="text-xs text-muted-foreground">Open Issues</p>
					</div>
					<div class="rounded-2xl border bg-card p-4 text-center">
						<GitPullRequest class="mx-auto mb-2 h-5 w-5 text-green-500" />
						<p class="text-2xl font-bold text-foreground">{data.metrics.prsMerged7d}</p>
						<p class="text-xs text-muted-foreground">PRs (7d)</p>
					</div>
				</div>
			{/if}

			<!-- Score Breakdown -->
			{#if data.scoreBreakdown}
				<div class="mb-8 rounded-2xl border bg-card p-6">
					<h2 class="mb-4 text-sm font-bold tracking-widest text-muted-foreground uppercase">
						Score Breakdown
					</h2>
					<div class="space-y-3">
						{#each [{ label: 'Stars', score: data.scoreBreakdown.stars, max: 35, color: 'bg-yellow-500' }, { label: 'Commits', score: data.scoreBreakdown.commits, max: 25, color: 'bg-blue-500' }, { label: 'Issues', score: data.scoreBreakdown.issues, max: 20, color: 'bg-purple-500' }, { label: 'PRs', score: data.scoreBreakdown.prs, max: 10, color: 'bg-green-500' }, { label: 'Contributors', score: data.scoreBreakdown.contributors, max: 10, color: 'bg-orange-500' }] as item}
							<div>
								<div class="mb-1 flex items-center justify-between text-sm">
									<span class="font-medium text-foreground">{item.label}</span>
									<span class="text-muted-foreground">{item.score}/{item.max}</span>
								</div>
								<div class="h-2 overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full {item.color}"
										style="width: {(item.score / item.max) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if data.growthMoments && data.growthMoments.length > 0}
				<div class="mb-8 rounded-2xl border bg-card p-6">
					<h2 class="mb-4 text-sm font-bold tracking-widest text-muted-foreground uppercase">
						Growth Moments
					</h2>
					<div class="space-y-3">
						{#each data.growthMoments as moment}
							<div class="rounded-xl bg-muted/40 p-4">
								<p class="text-sm font-semibold text-foreground">{moment.title}</p>
								<p class="mt-1 text-sm text-muted-foreground">{moment.description}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Embed Badge Section -->
			<div class="mb-8 rounded-2xl border bg-card p-6">
				<h2 class="mb-4 text-sm font-bold tracking-widest text-muted-foreground uppercase">
					Embed This Badge
				</h2>
				<div class="mb-4 flex justify-center">
					<a href={publicUrl}>
						<img src={badgeUrl} alt="ShipSense Health Badge" class="h-5" />
					</a>
				</div>
				<div class="rounded-lg bg-muted p-3">
					<code class="text-xs break-all text-foreground">
						![ShipSense]({badgeUrl})
					</code>
				</div>
			</div>

			<!-- Footer CTA -->
			<div class="text-center">
				<p class="mb-4 text-sm text-muted-foreground">
					Powered by <a href="https://shipsense.app" class="text-primary hover:underline"
						>ShipSense</a
					>
				</p>
				<a
					href="https://shipsense.app"
					class="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Track your repository
				</a>
			</div>
		</div>
	{/if}
</div>
