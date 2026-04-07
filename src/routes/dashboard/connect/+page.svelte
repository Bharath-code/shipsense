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
	import {
		Star as StarIcon,
		GitFork as GitForkIcon,
		Search as SearchIcon,
		Check,
		Loader2,
		Link
	} from 'lucide-svelte';

	// Data fetching
	const activeReposQuery = useQuery(api.repos.listMyRepos, {});
	const viewerQuery = useQuery(api.users.getMyProfile, {});
	const client = useConvexClient();

	let isAuthed = $derived(viewerQuery.data != null);

	let githubRepos = $state<any[]>([]);
	let loadingGithub = $state(false);
	let searchQuery = $state('');
	let connectError = $state<string | null>(null);
	let connectingRepoId = $state<number | null>(null);

	// Bulk connect state
	let selectedRepos = $state<Set<number>>(new Set());
	let bulkConnecting = $state(false);
	let bulkResults = $state<{ success: number; failed: number } | null>(null);

	async function loadGithubRepos(attempt = 0) {
		loadingGithub = true;
		connectError = null;
		bulkResults = null;
		try {
			githubRepos = (await client.action(api.github.fetchUserReposFromGithub, {})) || [];
			hasLoaded = true;
		} catch (err: any) {
			// JWT propagation can take up to 3s after OAuth — retry with backoff
			if (attempt < 3 && err?.message?.includes('Unauthenticated')) {
				await new Promise((r) => setTimeout(r, 1500));
				return loadGithubRepos(attempt + 1);
			}
			console.error(err);
			connectError = 'Could not connect to GitHub. Please try refreshing.';
		} finally {
			loadingGithub = false;
		}
	}

	// Wrapper for button onclick handlers
	const refreshRepos = () => loadGithubRepos();

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

	async function bulkConnectSelected() {
		if (selectedRepos.size === 0) return;

		bulkConnecting = true;
		connectError = null;
		let success = 0;
		let failed = 0;

		for (const githubId of selectedRepos) {
			const repo = githubRepos.find((r) => r.githubRepoId === githubId);
			if (!repo) {
				failed++;
				continue;
			}
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
				success++;
			} catch (err: any) {
				console.error(`Failed to connect ${repo.name}:`, err);
				failed++;
			}
		}

		bulkResults = { success, failed };
		selectedRepos = new Set();
		bulkConnecting = false;

		// Clear results after 5s
		setTimeout(() => {
			bulkResults = null;
		}, 5000);
	}

	function toggleSelection(repo: any) {
		const newSet = new Set(selectedRepos);
		if (newSet.has(repo.githubRepoId)) {
			newSet.delete(repo.githubRepoId);
		} else {
			newSet.add(repo.githubRepoId);
		}
		selectedRepos = newSet;
	}

	function selectAll() {
		const available = filteredRepos.filter((r) => !activeRepoIds.includes(r.githubRepoId));
		if (selectedRepos.size === available.length) {
			selectedRepos = new Set();
		} else {
			selectedRepos = new Set(available.map((r) => r.githubRepoId));
		}
	}

	// Remove auto-load — connect page is always intentionally visited,
	// so explicit user click avoids the post-OAuth JWT propagation race.
	let hasLoaded = $state(false);

	$effect(() => {
		if (!isAuthed) {
			hasLoaded = false;
			githubRepos = [];
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

	let availableForConnect = $derived(
		filteredRepos.filter((r) => !activeRepoIds.includes(r.githubRepoId))
	);

	let allAvailableSelected = $derived(
		availableForConnect.length > 0 &&
			availableForConnect.every((r) => selectedRepos.has(r.githubRepoId))
	);
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
		<Button variant="outline" onclick={refreshRepos} disabled={loadingGithub}>
			{loadingGithub ? LABELS.SYNCING : LABELS.REFRESH_LIST}
		</Button>
	</div>

	{#if filteredRepos.length > 0 && availableForConnect.length > 0}
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={selectAll}
					class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<div
						class="flex h-5 w-5 items-center justify-center rounded border {allAvailableSelected
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-border'}"
					>
						{#if allAvailableSelected}
							<Check class="h-3 w-3" />
						{/if}
					</div>
					Select all ({availableForConnect.length})
				</button>
				{#if selectedRepos.size > 0}
					<span class="text-sm font-medium text-primary">{selectedRepos.size} selected</span>
				{/if}
			</div>

			{#if selectedRepos.size > 0}
				<Button onclick={bulkConnectSelected} disabled={bulkConnecting} class="gap-2">
					{#if bulkConnecting}
						<Loader2 class="h-4 w-4 animate-spin" />
						Connecting...
					{:else}
						<Link class="h-4 w-4" />
						Connect {selectedRepos.size} Selected
					{/if}
				</Button>
			{/if}
		</div>
	{/if}

	{#if bulkResults}
		<div class="rounded-md border border-success/50 bg-success/10 p-4 text-sm">
			<span class="font-medium text-success">
				Successfully connected {bulkResults.success} repo{bulkResults.success !== 1 ? 's' : ''}
			</span>
			{#if bulkResults.failed > 0}
				<span class="ml-2 text-destructive">
					({bulkResults.failed} failed)
				</span>
			{/if}
		</div>
	{/if}

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
		{:else if !hasLoaded}
			<div
				class="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/20 py-16 text-center"
			>
				<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
					<Link class="h-8 w-8 text-primary" />
				</div>
				<p class="text-lg font-medium text-foreground">Ready to connect your repos</p>
				<p class="mt-1 text-sm text-muted-foreground">Click below to fetch your GitHub repositories</p>
				<Button class="mt-6" onclick={refreshRepos}>Load repositories</Button>
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
					<Button variant="outline" class="mt-6" onclick={refreshRepos} disabled={loadingGithub}>
						Try Again
					</Button>
				{/if}
			</div>
		{:else}
			{#each filteredRepos as repo}
				<Card class="flex flex-col border-border bg-card transition-colors hover:border-primary/50">
					<CardHeader class="pb-2">
						<div class="flex items-start justify-between gap-2">
							<div class="flex items-start gap-2">
								{#if !activeRepoIds.includes(repo.githubRepoId)}
									<button
										type="button"
										onclick={() => toggleSelection(repo)}
										class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border {selectedRepos.has(
											repo.githubRepoId
										)
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-border'}"
										aria-label="Select {repo.name}"
									>
										{#if selectedRepos.has(repo.githubRepoId)}
											<Check class="h-3 w-3" />
										{/if}
									</button>
								{/if}
								<div class="min-w-0">
									<CardTitle class="truncate text-base font-semibold text-foreground">
										{repo.name}
									</CardTitle>
								</div>
							</div>
							{#if repo.isPrivate}
								<Badge
									variant="outline"
									class="shrink-0 border-border bg-muted text-xs text-muted-foreground"
									>Private</Badge
								>
							{:else}
								<Badge
									variant="outline"
									class="shrink-0 border-border text-xs text-muted-foreground">Public</Badge
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
								disabled={connectingRepoId === repo.githubRepoId || bulkConnecting}
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
