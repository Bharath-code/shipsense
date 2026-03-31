<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Share2, Download, Flame, Star, GitFork, CheckCircle } from 'lucide-svelte';
	import { toPng } from 'html-to-image';

	let { repoId, open = $bindable(false) } = $props<{ repoId: string; open?: boolean }>();

	// Convex accepts string directly - no need for Id type casting
	const repoQuery = useQuery(api.dashboard.getRepoDetails, () => ({ repoId }));
	const scoreHistoryQuery = useQuery(api.dashboard.getRepoScoreHistory, () => ({ repoId }));
	const streakQuery = useQuery(api.dashboard.getRepoStreak, () => ({ repoId }));

	let repo = $derived(repoQuery.data);
	let latestScore = $derived(
		scoreHistoryQuery.data?.[scoreHistoryQuery.data.length - 1]?.healthScore || 0
	);
	let streak = $derived(streakQuery.data?.currentStreak || 0);

	let downloading = $state(false);
	let shareSuccess = $state(false);
	let downloadSuccess = $state(false);

	async function downloadCard() {
		downloading = true;
		downloadSuccess = false;
		try {
			const cardElement = document.getElementById('growth-card-canvas');
			if (!cardElement) {
				alert('Card not found');
				return;
			}

			const dataUrl = await toPng(cardElement, {
				backgroundColor: '#020617',
				pixelRatio: 2
			});

			const link = document.createElement('a');
			link.download = `${repo?.name || 'repo'}-growth-card.png`;
			link.href = dataUrl;
			link.click();

			downloadSuccess = true;
			setTimeout(() => (downloadSuccess = false), 3000);
		} catch (err) {
			console.error('Download failed:', err);
			alert('Failed to download card');
		} finally {
			downloading = false;
		}
	}

	function shareToTwitter() {
		const text = `Just hit a ${streak} day commit streak on ${repo?.name}! My repo Health Score is ${latestScore}/100 🚀`;
		const url = 'https://shipsense.dev';
		window.open(
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
			'_blank'
		);
		shareSuccess = true;
		setTimeout(() => (shareSuccess = false), 3000);
	}
</script>

<Button
	variant="outline"
	class="border-primary/30 font-medium text-primary transition-all hover:bg-primary/10 hover:text-primary/80"
	onclick={() => (open = true)}
>
	<Share2 class="mr-2 h-4 w-4" />
	Share Growth Card
</Button>

<Dialog.Root bind:open>
	<Dialog.Content
		class="overflow-hidden border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-md"
	>
		<!-- Growth Card Canvas (The part that gets shared) -->
		<div
			id="growth-card-canvas"
			class="relative overflow-hidden glass-panel bg-slate-950 p-10 select-none"
		>
			<!-- Advanced background architecture -->
			<div
				class="pointer-events-none absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-primary/20 blur-[100px]"
			></div>
			<div
				class="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]"
			></div>
			<div
				class="pointer-events-none absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 opacity-10"
				style="background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 24px 24px;"
			></div>

			<!-- Card Content -->
			<div class="relative z-10 flex h-full flex-col">
				<!-- Brand Header -->
				<div class="mb-10 flex items-center justify-between opacity-60">
					<div class="flex items-center gap-3">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10"
						>
							<span class="text-xs font-black tracking-tighter text-white">SS</span>
						</div>
						<span class="text-[10px] font-black tracking-[0.3em] text-white uppercase"
							>ShipSense Intelligence</span
						>
					</div>
					<span class="font-mono text-[10px] tracking-widest text-white/40 uppercase"
						>Snapshot // {new Date().getFullYear()}</span
					>
				</div>

				<!-- Repo Info -->
				<div class="mb-12 space-y-2">
					<div
						class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1"
					>
						<Star class="h-3 w-3 fill-primary text-primary" />
						<span class="text-[10px] font-black tracking-widest text-primary uppercase"
							>ELITE REPOSITORY</span
						>
					</div>
					<h2 class="text-4xl leading-none font-black tracking-tighter text-white">
						{repo?.name || 'Loading...'}
					</h2>
					<p class="text-lg font-medium text-white/40">{repo?.owner}</p>
				</div>

				<!-- Metrics Grid -->
				<div class="mb-6 grid grid-cols-2 gap-6">
					<div
						class="group/m relative flex flex-col items-center justify-center space-y-2 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity group-hover/m:opacity-100"
						></div>
						<span
							class="relative z-10 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							>Health Index</span
						>
						<div class="relative z-10 flex items-baseline gap-1">
							<span class="text-5xl font-black text-white">{latestScore}</span>
							<span class="text-xs font-bold text-primary/60">/ 100</span>
						</div>
					</div>

					<div
						class="group/s relative flex flex-col items-center justify-center space-y-2 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 transition-opacity group-hover/s:opacity-100"
						></div>
						<span
							class="relative z-10 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase"
							><Flame class="h-3 w-3 text-rose-500" /> Ship Streak</span
						>
						<div class="relative z-10 flex items-baseline gap-2">
							<span class="text-5xl font-black text-white">{streak}</span>
							<span class="text-xs font-bold text-rose-500/60 uppercase">Days</span>
						</div>
					</div>
				</div>

				<!-- Lower Footer -->
				<div class="mt-6 flex items-center justify-between border-t border-white/10 px-2 pt-8">
					<div class="flex items-center gap-8">
						<div class="flex items-center gap-3">
							<Star class="h-5 w-5 text-white/20" />
							<span class="text-lg font-black text-white/80">{repo?.starsCount || 0}</span>
						</div>
						<div class="flex items-center gap-3">
							<GitFork class="h-5 w-5 text-white/20" />
							<span class="text-lg font-black text-white/80">{repo?.forksCount || 0}</span>
						</div>
					</div>
					<div class="font-mono text-[10px] tracking-widest text-white/20 uppercase">
						verified by shipsense
					</div>
				</div>
			</div>
		</div>

		<!-- Modal Actions -->
		<div class="grid grid-cols-1 gap-4 border-t border-white/10 bg-black/40 p-10 sm:grid-cols-2">
			<Button
				variant="default"
				class="h-14 rounded-2xl bg-white text-base font-black text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50"
				onclick={downloadCard}
				disabled={downloading}
			>
				{#if downloadSuccess}
					<CheckCircle class="mr-3 h-5 w-5 text-green-500" />
					DOWNLOADED!
				{:else if downloading}
					<Download class="mr-3 h-5 w-5 animate-pulse" />
					GENERATING...
				{:else}
					<Download class="mr-3 h-5 w-5" />
					DOWNLOAD PNG
				{/if}
			</Button>
			<Button
				variant="outline"
				class="h-14 rounded-2xl border-white/10 bg-white/5 text-base font-black text-white transition-all hover:bg-white/10 active:scale-95"
				onclick={shareToTwitter}
			>
				{#if shareSuccess}
					<CheckCircle class="mr-3 h-5 w-5 text-green-500" />
					SHARED!
				{:else}
					<svg class="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
						/>
					</svg>
					SHARE ON X
				{/if}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
