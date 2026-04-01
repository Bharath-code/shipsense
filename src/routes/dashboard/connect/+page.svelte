<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { LABELS } from '$lib/constants/labels';
	import { Star as StarIcon, GitFork as GitForkIcon, Search as SearchIcon } from 'lucide-svelte';

	// Data fetching
	const activeReposQuery = useQuery(api.repos.listMyRepos, {});
	const client = useConvexClient();

	let githubRepos = $state<any[]>([]);
	let loadingGithub = $state(false);
	let searchQuery = $state('');
	let connectError = $state<string | null>(null);
	let connectingRepoId = $state<number | null>(null);

	async function loadGithubRepos() {
		loadingGithub = true;
		connectError = null;
		try {
			githubRepos = (await client.action(api.github.fetchUserReposFromGithub, {})) || [];
		} catch (err: any) {
			console.error(err);
			connectError = err.message || 'Failed to fetch repositories';
		} finally {
			loadingGithub = false;
		}
	}

	async function connectRepo(repo: any) {
		if (connectingRepoId === repo.githubRepoId) return;

		connectingRepoId = repo.githubRepoId;
		connectError = null;
		try {
			const repoId = await client.mutation(api.repos.connectRepo, {
				githubRepoId: repo.githubRepoId,
				owner: repo.owner,
				name: repo.name,
				fullName: repo.fullName,
				description: repo.description,
				language: repo.language,
				starsCount: repo.starsCount,
				forksCount: repo.forksCount,
				isPrivate: repo.isPrivate
			});
			await client.action(api.repos.syncConnectedRepo, { repoId });
		} catch (err: any) {
			console.error(err);
			connectError = err.message;
		} finally {
			connectingRepoId = null;
		}
	}

	// Load right away or let user click
	let hasLoaded = $state(false);

	$effect(() => {
		if (!hasLoaded && githubRepos.length === 0) {
			hasLoaded = true;
			loadGithubRepos();
		}
	});

	let filteredRepos = $derived(
		githubRepos.filter(
			(r) =>
				r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);

	let activeRepoIds = $derived(activeReposQuery.data?.map((r: any) => r.githubRepoId) || []);
</script>

<svelte:head>
	<title>Connect Repo | ShipSense</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Connect Repository</h1>
		<p class="mt-2 text-muted-foreground">
			Select the GitHub repositories you want ShipSense to track and monitor.
		</p>
	</div>

	{#if connectError}
		<div class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
			{connectError}
		</div>
	{/if}

	<div class="flex items-center space-x-2">
		<div class="relative max-w-sm flex-1">
			<SearchIcon
				class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground"
				aria-hidden="true"
			/>
			<input
				type="text"
				placeholder="Filter repositories..."
				aria-label="Filter repositories by name or description"
				bind:value={searchQuery}
				class="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</div>
		<Button variant="outline" onclick={loadGithubRepos} disabled={loadingGithub}>
			{loadingGithub ? LABELS.SYNCING : LABELS.REFRESH_LIST}
		</Button>
	</div>

	<div aria-live="polite" aria-atomic="true" class="sr-only">
		{filteredRepos.length} repositories found{searchQuery ? ` matching "${searchQuery}"` : ''}
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#if loadingGithub && githubRepos.length === 0}
			<div
				class="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/20 py-16 text-center"
			>
				<div
					class="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
				></div>
				<p class="text-lg font-medium text-foreground">Loading your repositories...</p>
				<p class="mt-1 text-sm text-muted-foreground">Fetching from GitHub</p>
			</div>
		{:else if filteredRepos.length === 0}
			<div
				class="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/20 py-16 text-center"
			>
				<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
					<SearchIcon class="h-8 w-8 text-muted-foreground" />
				</div>
				{#if searchQuery}
					<p class="text-lg font-medium text-foreground">No repositories match "{searchQuery}"</p>
					<p class="mt-1 text-sm text-muted-foreground">Try a different search term</p>
				{:else}
					<p class="text-lg font-medium text-foreground">No repositories found</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Make sure you have repositories on GitHub
					</p>
					<Button variant="outline" class="mt-6" onclick={loadGithubRepos} disabled={loadingGithub}>
						Try Again
					</Button>
				{/if}
			</div>
		{:else}
			{#each filteredRepos as repo}
				<Card class="flex flex-col border-border bg-card transition-colors hover:border-primary/50">
					<CardHeader class="pb-2">
						<div class="flex items-start justify-between">
							<CardTitle class="truncate text-base font-semibold text-foreground">
								{repo.name}
							</CardTitle>
							{#if repo.isPrivate}
								<Badge
									variant="outline"
									class="border-border bg-muted text-xs text-muted-foreground">Private</Badge
								>
							{:else}
								<Badge variant="outline" class="border-border text-xs text-muted-foreground"
									>Public</Badge
								>
							{/if}
						</div>
						<CardDescription class="line-clamp-2 min-h-[2rem] text-xs">
							{repo.description || 'No description provided.'}
						</CardDescription>
					</CardHeader>
					<CardContent class="flex-1 pb-4">
						<div class="flex items-center gap-4 text-xs text-muted-foreground/80">
							{#if repo.language}
								<div class="flex items-center gap-1">
									<span class="h-2 w-2 rounded-full bg-blue-500"></span>
									{repo.language}
								</div>
							{/if}
							<div class="flex items-center gap-1">
								<StarIcon class="h-3 w-3" />
								{repo.starsCount}
							</div>
							<div class="flex items-center gap-1">
								<GitForkIcon class="h-3 w-3" />
								{repo.forksCount}
							</div>
						</div>
					</CardContent>
					<div class="mt-auto p-4 pt-0">
						{#if activeRepoIds.includes(repo.githubRepoId)}
							<Button disabled class="w-full bg-muted text-muted-foreground">Connected</Button>
						{:else}
							<Button
								onclick={() => connectRepo(repo)}
								disabled={connectingRepoId === repo.githubRepoId}
								class="w-full bg-primary text-primary-foreground hover:bg-primary/90"
								>{connectingRepoId === repo.githubRepoId ? 'Syncing...' : 'Connect'}</Button
							>
						{/if}
					</div>
				</Card>
			{/each}
		{/if}
	</div>
</div>
