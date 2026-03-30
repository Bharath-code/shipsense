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
	import { Activity, Rocket, Zap, Clock } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import ArrowRightIcon from 'lucide-svelte/icons/arrow-right';

	const activeReposQuery = useQuery(api.repos.listMyRepos, {});

	let repos = $derived(activeReposQuery.data || []);
	let isLoading = $derived(activeReposQuery.isLoading);
</script>

<svelte:head>
	<title>Dashboard | ShipSense</title>
</svelte:head>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
			<p class="mt-2 text-muted-foreground">
				Overview of your active repositories and growth scores.
			</p>
		</div>

		<Button
			href="/dashboard/connect"
			class="bg-primary text-primary-foreground hover:bg-primary/90"
		>
			<span class="mr-2">Connect Repository</span>
			<ArrowRightIcon class="h-4 w-4" />
		</Button>
	</div>

	{#if isLoading}
		<div class="flex justify-center p-12 text-muted-foreground italic">
			Loading your repositories...
		</div>
	{:else if repos.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-12"
		>
			<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<svg
					class="h-6 w-6 text-muted-foreground"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
			</div>
			<h3 class="mb-2 text-lg font-medium text-foreground">No repositories connected</h3>
			<p class="mb-6 max-w-sm text-center text-muted-foreground">
				Get started by connecting a GitHub repository to track its health score and unlock growth
				insights.
			</p>
			<Button
				href="/dashboard/connect"
				class="bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Connect your first repo
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each repos as repo}
				<a
					href={`/dashboard/${repo._id}`}
					class="block rounded-xl focus:ring-2 focus:ring-primary/50 focus:outline-none"
				>
					<Card class="h-full border-border bg-card transition-colors hover:border-primary/50">
						<CardHeader>
							<div class="flex items-center justify-between">
								<CardTitle class="text-lg">{repo.name}</CardTitle>
								<!-- Placeholder for health score badge to be added in Phase 3 -->
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full border border-success/20 bg-success/10 text-xs font-bold text-success"
								>
									--
								</div>
							</div>
							<CardDescription>{repo.owner}</CardDescription>
						</CardHeader>
						<CardContent>
							<div class="mt-4 grid grid-cols-2 gap-4 text-sm">
								<div>
									<span class="block text-xs text-muted-foreground">Stars</span>
									<span class="font-medium text-foreground">{repo.starsCount}</span>
								</div>
								<div>
									<span class="block text-xs text-muted-foreground">Forks</span>
									<span class="font-medium text-foreground">{repo.forksCount}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>
