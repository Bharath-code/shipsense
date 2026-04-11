<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Star, TrendingUp, Users, GitPullRequest, Plus, Trash2, Eye } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let showAddForm = $state(false);
	let watchOwner = $state('');
	let watchName = $state('');
	let formError = $state('');

	const client = useConvexClient();

	const watchlistQuery = useQuery(api.watchlist.getMyWatchlist, {});
	const limitQuery = useQuery(api.watchlist.getWatchlistLimit, {});

	let watchlist = $derived(watchlistQuery.data ?? []);
	let limit = $derived(limitQuery.data ?? { limit: 0, used: 0 });
	let isLoading = $derived(watchlistQuery.isLoading);

	function openForm() {
		if (limit.used >= limit.limit) return;
		showAddForm = true;
		formError = '';
		watchOwner = '';
		watchName = '';
	}

	function closeForm() {
		showAddForm = false;
		formError = '';
	}

	async function addRepo() {
		formError = '';

		// Parse full URL or just owner/name
		let owner = watchOwner.trim();
		let name = watchName.trim();

		// If they pasted a full URL in owner field
		if (owner.includes('github.com') && !name) {
			const match = owner.match(/github\.com\/([^/]+)\/([^/]+)/);
			if (match) {
				owner = match[1];
				name = match[2];
			}
		}

		// If they pasted owner/name in owner field
		if (owner.includes('/') && !name) {
			const parts = owner.split('/');
			owner = parts[0];
			name = parts[1];
		}

		if (!owner || !name) {
			formError = 'Enter owner/repo or a full GitHub URL.';
			return;
		}

		// Clean name (remove trailing slash, .git)
		name = name.replace(/\.git$/, '').replace(/\/$/, '');
		owner = owner.replace(/^@/, '').replace(/^\//, '');

		try {
			await client.mutation(api.watchlist.addToWatchlist, { owner, name });
			closeForm();
		} catch (err: any) {
			formError = err.message || 'Failed to add repo.';
		}
	}

	async function removeRepo(id: string) {
		await client.mutation(api.watchlist.removeFromWatchlist, { watchlistId: id as any });
	}

	function formatStars(n: number | null | undefined): string {
		if (n == null) return '—';
		if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
		return n.toString();
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Eye class="h-5 w-5 text-primary" />
			<h3 class="text-lg font-bold text-foreground">Competitor Watch</h3>
		</div>

		{#if limit.limit > 0 && !showAddForm}
			<div class="flex items-center gap-2">
				<span class="text-xs text-muted-foreground">{limit.used}/{limit.limit} watching</span>
				{#if limit.used < limit.limit}
					<button
						type="button"
						onclick={openForm}
						class="flex h-8 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
					>
						<Plus class="h-3.5 w-3.5" />
						Add
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="h-24 animate-pulse rounded-2xl bg-white/5"></div>
	{:else if watchlist.length === 0}
		<!-- Empty state -->
		<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
			<Eye class="mx-auto h-10 w-10 text-muted-foreground/40" />
			<p class="mt-3 text-sm font-semibold text-foreground">No repos being watched yet</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Add a competitor or inspiration repo to track their growth alongside yours.
			</p>
			{#if limit.used < limit.limit}
				<button
					type="button"
					onclick={openForm}
					class="mt-4 flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus class="h-4 w-4" />
					Add your first competitor
				</button>
			{/if}
		</div>
	{:else}
		<!-- Watchlist cards -->
		<div class="space-y-3">
			{#each watchlist as entry}
				<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<p class="truncate text-sm font-semibold text-foreground">{entry.fullName}</p>
								<button
									type="button"
									onclick={() => removeRepo(entry._id)}
									class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
									title="Stop watching"
								>
									<Trash2 class="h-3.5 w-3.5" />
								</button>
							</div>

							<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
								<span class="flex items-center gap-1.5">
									<Star class="h-3.5 w-3.5 text-warning" />
									{formatStars(entry.starsCount)} total
								</span>
								{#if entry.starsLast7d && entry.starsLast7d > 0}
									<span class="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-success">
										<TrendingUp class="h-3 w-3" />
										+{entry.starsLast7d} this week
									</span>
								{/if}
								{#if entry.contributors14d}
									<span class="flex items-center gap-1.5">
										<Users class="h-3.5 w-3.5" />
										{entry.contributors14d} active
									</span>
								{/if}
								{#if entry.prsMerged7d}
									<span class="flex items-center gap-1.5">
										<GitPullRequest class="h-3.5 w-3.5" />
										{entry.prsMerged7d} merged
									</span>
								{/if}
								{#if !entry.lastSyncedAt}
									<span class="text-muted-foreground/60">Syncing...</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add form modal/inline -->
	{#if showAddForm}
		<div class="rounded-2xl border border-primary/20 bg-primary/5 p-5">
			<p class="mb-3 text-sm font-semibold text-foreground">Add a repo to watch</p>
			<p class="mb-3 text-xs text-muted-foreground">
				Enter the owner/name (e.g., `vercel/next.js`) or paste a full GitHub URL.
			</p>

			{#if formError}
				<p class="mb-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{formError}</p>
			{/if}

			<div class="flex flex-col gap-3 sm:flex-row">
				<input
					type="text"
					placeholder="owner/repo or https://github.com/..."
					bind:value={watchOwner}
					onkeydown={(e) => e.key === 'Enter' && addRepo()}
					class="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
					aria-label="GitHub repository URL"
				/>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={addRepo}
						class="h-11 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Watch
					</button>
					<button
						type="button"
						onclick={closeForm}
						class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-muted-foreground transition-colors hover:bg-white/10"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
