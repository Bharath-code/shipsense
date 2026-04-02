<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	let { repoId } = $props<{ repoId: string }>();

	const repoQuery = useQuery(api.dashboard.getRepoDetails, () => ({ repoId: repoId as any }));
	let repo = $derived(repoQuery.data);

	let isSyncing = $derived(repo?.lastSyncedAt ? Date.now() - repo.lastSyncedAt < 30000 : false);
</script>

{#if repo}
	<div class="flex items-center gap-2">
		<div class="relative flex h-2.5 w-2.5 items-center justify-center">
			{#if isSyncing}
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
				></span>
			{/if}
			<span
				class="relative inline-flex h-2.5 w-2.5 rounded-full {isSyncing
					? 'bg-primary'
					: 'bg-success'}"
			></span>
		</div>
		<span
			class="text-xs font-medium tracking-widest uppercase {isSyncing
				? 'text-primary'
				: 'text-muted-foreground'}"
		>
			{isSyncing ? 'Syncing' : 'Live'}
		</span>
	</div>
{/if}
