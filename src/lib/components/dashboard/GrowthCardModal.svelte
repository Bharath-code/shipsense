<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Share2, Download, Flame, Star, GitFork } from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	// Fetch real data
	const repoQuery = useQuery(api.dashboard.getRepoDetails, () => ({ repoId: repoId as any }));
	const scoreHistoryQuery = useQuery(api.dashboard.getRepoScoreHistory, () => ({
		repoId: repoId as any
	}));
	const streakQuery = useQuery(api.dashboard.getRepoStreak, () => ({ repoId: repoId as any }));

	let repo = $derived(repoQuery.data);
	let latestScore = $derived(
		scoreHistoryQuery.data?.[scoreHistoryQuery.data.length - 1]?.healthScore || 0
	);
	let streak = $derived(streakQuery.data?.currentStreak || 0);

	let isOpen = $state(false);

	function downloadCard() {
		// In a real implementation this would use html2canvas to save the card div
		alert('This would download the card as a PNG image in production.');
	}
</script>

<Button
	variant="outline"
	class="border-primary/30 font-medium text-primary transition-all hover:bg-primary/10 hover:text-primary/80"
	onclick={() => (isOpen = true)}
>
	<Share2 class="mr-2 h-4 w-4" />
	Share Growth Card
</Button>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Content
		class="overflow-hidden border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-md"
	>
		<!-- Growth Card Canvas (The part that gets shared) -->
		<div id="growth-card" class="relative overflow-hidden bg-zinc-950 p-8">
			<!-- Avant-garde background elements -->
			<div
				class="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-indigo-500/20 blur-[64px]"
			></div>
			<div
				class="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-[64px]"
			></div>

			<!-- Card Content -->
			<div class="relative z-10 flex h-full flex-col">
				<!-- Brand Header -->
				<div class="mb-8 flex items-center justify-between opacity-80">
					<div class="flex items-center gap-2">
						<div
							class="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-purple-600"
						>
							<span class="text-[10px] font-black tracking-tighter text-white">SS</span>
						</div>
						<span class="text-xs font-bold tracking-widest text-zinc-400 uppercase"
							>ShipSense.dev</span
						>
					</div>
					<span class="font-mono text-[10px] text-zinc-500">#{new Date().getFullYear()}</span>
				</div>

				<!-- Repo Info -->
				<div class="mb-8 space-y-1">
					<p class="flex items-center gap-1.5 text-sm font-medium text-indigo-400">
						<Star class="h-3 w-3 fill-indigo-400" /> TOP REPOSITORY
					</p>
					<h2
						class="px-0.5 text-3xl leading-tight font-black tracking-tight break-words text-white"
					>
						{repo?.name || 'Loading...'}
					</h2>
					<p class="mt-1 text-sm text-zinc-400">{repo?.owner}</p>
				</div>

				<!-- Metrics Grid -->
				<div class="mb-4 grid grid-cols-2 gap-4">
					<div
						class="group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-4"
					>
						<div class="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
						<span class="mb-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase"
							>Health Score</span
						>
						<div class="relative z-10 flex items-end gap-1">
							<span class="text-4xl font-black tracking-tighter text-white">{latestScore}</span>
							<span class="mb-1 text-sm font-bold text-blue-400">/100</span>
						</div>
					</div>

					<div
						class="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-4"
					>
						<div class="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent"></div>
						<span
							class="mb-2 flex items-center gap-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase"
							><Flame class="h-3 w-3 text-rose-500" /> Active Streak</span
						>
						<div class="relative z-10 flex items-end gap-1">
							<span class="text-4xl font-black tracking-tighter text-white">{streak}</span>
							<span class="mb-1 text-sm font-bold tracking-wider text-rose-500 uppercase">Days</span
							>
						</div>
					</div>
				</div>

				<!-- Lower Metrics -->
				<div class="mt-4 flex items-center justify-center gap-6 border-t border-zinc-800/50 pt-4">
					<div class="flex items-center gap-1.5 text-zinc-400">
						<Star class="h-4 w-4" />
						<span class="font-bold text-zinc-200">{repo?.starsCount || 0}</span>
					</div>
					<div class="flex items-center gap-1.5 text-zinc-400">
						<GitFork class="h-4 w-4" />
						<span class="font-bold text-zinc-200">{repo?.forksCount || 0}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Modal Actions -->
		<div class="flex flex-col gap-3 border-t border-border bg-muted/50 p-6 sm:flex-row">
			<Button
				variant="default"
				class="w-full bg-primary text-primary-foreground hover:bg-primary/90"
				onclick={downloadCard}
			>
				<Download class="mr-2 h-4 w-4" />
				Save PNG
			</Button>
			<Button
				variant="outline"
				class="w-full border-border bg-background text-foreground hover:bg-muted"
				onclick={() => {
					window.open(
						`https://twitter.com/intent/tweet?text=Just hit a ${streak} day commit streak on ${repo?.name}! My repo Health Score is ${latestScore}/100 🚀&url=https://shipsense.dev`,
						'_blank'
					);
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="mr-2 h-4 w-4"
				>
					<path
						d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
					/>
				</svg>
				Post to X
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
