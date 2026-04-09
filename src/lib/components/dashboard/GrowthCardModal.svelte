<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';
	import { LABELS } from '$lib/constants/labels';
	import {
		Share2,
		Download,
		Flame,
		Star,
		GitFork,
		CheckCircle,
		TrendingUp,
		Activity
	} from 'lucide-svelte';
	import { toPng } from 'html-to-image';

	let { repoId, open = $bindable(false) } = $props<{ repoId: string; open?: boolean }>();

	const repoQuery = useQuery(api.dashboard.getRepoDetails, () => ({ repoId }));
	const scoreHistoryQuery = useQuery(api.dashboard.getRepoScoreHistory, () => ({ repoId }));
	const streakQuery = useQuery(api.dashboard.getRepoStreak, () => ({ repoId }));
	const growthMomentsQuery = useQuery(api.dashboard.getRepoGrowthMoments, () => ({ repoId }));

	let repo = $derived(repoQuery.data);
	let latestScore = $derived(
		scoreHistoryQuery.data?.[scoreHistoryQuery.data.length - 1]?.healthScore || 0
	);
	let streak = $derived(streakQuery.data?.currentStreak || 0);
	let starsLast7d = $derived(repo?.starsLast7d || 0);
	let lastCommit = $derived(repo?.lastCommitAt ? getDaysAgo(repo.lastCommitAt) : null);
	let growthMoments = $derived(growthMomentsQuery.data || []);

	let downloading = $state(false);
	let shareSuccess = $state(false);
	let downloadSuccess = $state(false);

	function getDaysAgo(timestamp: number): string {
		const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
		if (days === 0) return 'today';
		if (days === 1) return 'yesterday';
		return `${days} days ago`;
	}

	function getShareMessage(): string {
		const topMoment = growthMoments[0];
		if (topMoment?.kind === 'best_week') {
			return `📈 ${repo?.name} just hit its best week for stars on ShipSense. ${topMoment.description} 🚀`;
		}
		if (topMoment?.kind === 'momentum_recovered') {
			return `⚡ ${repo?.name} just recovered momentum on ShipSense. ${topMoment.description} 🚀`;
		}
		if (streak >= 7) {
			return `🔥 ${streak} day commit streak on ${repo?.name}! My repo health is ${latestScore}/100. Ship with me 🚀 #OpenSource #DevCommunity`;
		}
		if (latestScore >= 80) {
			return `🎯 My ${repo?.name} repo hit ${latestScore}/100 health score on ShipSense! Time to ship more 🚀`;
		}
		if (starsLast7d > 0) {
			return `📈 ${repo?.name} grew to ${repo?.starsCount} stars (+${starsLast7d} this week!) - tracking with @ShipSense`;
		}
		return `📊 Tracking ${repo?.name} on ShipSense: health score ${latestScore}/100. Watching momentum, contributors, and what to improve next.`;
	}

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
				backgroundColor: '#0a0a0f',
				pixelRatio: 2
			});

			const link = document.createElement('a');
			link.download = `${repo?.name || 'repo'}-shipsense-card.png`;
			link.href = dataUrl;
			link.click();

			downloadSuccess = true;
			setTimeout(() => (downloadSuccess = false), 3000);
		} catch (err) {
			console.error('Download failed:', err);
		} finally {
			downloading = false;
		}
	}

	function shareToTwitter() {
		const text = getShareMessage();
		const url = 'https://shipsense.dev';
		window.open(
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
			'_blank'
		);
		shareSuccess = true;
		setTimeout(() => (shareSuccess = false), 3000);
	}

	function getScoreColor(score: number): string {
		if (score >= 80) return 'from-emerald-500 to-cyan-500';
		if (score >= 60) return 'from-amber-500 to-orange-500';
		return 'from-rose-500 to-red-500';
	}

	function getScoreLabel(score: number): string {
		if (score >= 80) return 'ELITE';
		if (score >= 60) return 'HEALTHY';
		if (score >= 40) return 'FAIR';
		return 'NEEDS LOVE';
	}
</script>

<Button
	variant="outline"
	class="border-primary/30 font-medium text-primary transition-all hover:bg-primary/10 hover:text-primary/80"
	onclick={() => (open = true)}
	aria-label={LABELS.SHARE_GROWTH_CARD}
>
	<Share2 class="mr-2 h-4 w-4" />
	{LABELS.SHARE_GROWTH_CARD}
</Button>

<Dialog.Root bind:open>
	<Dialog.Content
		class="overflow-hidden border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-md"
	>
		<!-- Growth Card Canvas -->
		<div id="growth-card-canvas" class="relative overflow-hidden bg-[#0a0a0f] p-8 select-none">
			<!-- Animated Background -->
			<div class="absolute inset-0 overflow-hidden">
				<div
					class="absolute -top-1/2 -right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-600/30 to-transparent blur-3xl"
				></div>
				<div
					class="absolute -bottom-1/2 -left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-cyan-500/20 to-transparent blur-3xl"
				></div>
				<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<div
						class="h-[800px] w-[800px] animate-spin rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
						style="animation-duration: 20s;"
					></div>
				</div>
			</div>

			<!-- Grid Pattern -->
			<div
				class="absolute inset-0 opacity-[0.03]"
				style="background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 40px 40px;"
			></div>

			<!-- Card Content -->
			<div class="relative z-10 flex h-full flex-col">
				<!-- Top Bar -->
				<div class="mb-6 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500"
						>
							<Activity class="h-4 w-4 text-white" />
						</div>
						<div>
							<span class="block text-xs font-bold tracking-wider text-white">ShipSense</span>
							<span class="text-[10px] text-white/40">Repo Health Tracker</span>
						</div>
					</div>
					<div
						class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
					>
						{#if repo?.language}
							<span class="text-[10px] font-medium text-white/80">{repo.language}</span>
						{/if}
						<span class="text-[10px] font-medium text-white/40">•</span>
						<span class="text-[10px] text-white/40">{lastCommit || 'New'}</span>
					</div>
				</div>

				<!-- Repo Name & Badge -->
				<div class="mb-8">
					<div
						class="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1"
					>
						<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
						<span class="text-[10px] font-bold tracking-widest text-emerald-400 uppercase"
							>{getScoreLabel(latestScore)}</span
						>
					</div>
					<h2 class="text-4xl font-black tracking-tight text-white">
						{repo?.name || 'Loading...'}
					</h2>
					<p class="text-sm font-medium text-white/40">{repo?.owner}</p>
					{#if growthMoments[0]}
						<div class="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
							<TrendingUp class="h-3 w-3 text-emerald-400" />
							<span class="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
								{growthMoments[0].title}
							</span>
						</div>
					{/if}
				</div>

				<!-- Main Score Display -->
				<div class="mb-8 flex items-center gap-8">
					<!-- Health Score Ring -->
					<div class="relative flex-shrink-0">
						<svg class="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
							<circle
								cx="50"
								cy="50"
								r="42"
								fill="none"
								stroke="rgba(255,255,255,0.1)"
								stroke-width="8"
							/>
							<circle
								cx="50"
								cy="50"
								r="42"
								fill="none"
								stroke="url(#scoreGradient)"
								stroke-width="8"
								stroke-linecap="round"
								stroke-dasharray={264}
								stroke-dashoffset={264 - (264 * latestScore) / 100}
								class="transition-all duration-1000 ease-out"
							/>
							<defs>
								<linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
									<stop offset="0%" class="stop-color: rgb(16, 185, 129)" />
									<stop offset="100%" class="stop-color: rgb(6, 182, 212)" />
								</linearGradient>
							</defs>
						</svg>
						<div class="absolute inset-0 flex items-center justify-center">
							<div class="text-center">
								<span class="block text-4xl font-black text-white">{latestScore}</span>
								<span class="text-[10px] text-white/40">HEALTH</span>
							</div>
						</div>
					</div>

					<!-- Stats Grid -->
					<div class="grid grid-cols-2 gap-4">
						<!-- Streak -->
						<div class="rounded-2xl border border-white/10 bg-white/5 p-4">
							<div class="mb-1 flex items-center gap-1">
								<Flame class="h-3 w-3 text-orange-500" />
								<span class="text-[10px] font-medium text-white/40">STREAK</span>
							</div>
							<div class="flex items-baseline gap-1">
								<span class="text-2xl font-black text-white">{streak}</span>
								<span class="text-xs text-orange-500">days</span>
							</div>
						</div>

						<!-- Stars -->
						<div class="rounded-2xl border border-white/10 bg-white/5 p-4">
							<div class="mb-1 flex items-center gap-1">
								<Star class="h-3 w-3 text-amber-400" />
								<span class="text-[10px] font-medium text-white/40">STARS</span>
							</div>
							<div class="flex items-center gap-1">
								<span class="text-2xl font-black text-white">{repo?.starsCount || 0}</span>
								{#if starsLast7d > 0}
									<span class="flex items-center text-xs font-bold text-emerald-400">
										<TrendingUp class="h-2 w-2" />
										+{starsLast7d}
									</span>
								{/if}
							</div>
						</div>

						<!-- Forks -->
						<div class="rounded-2xl border border-white/10 bg-white/5 p-4">
							<div class="mb-1 flex items-center gap-1">
								<GitFork class="h-3 w-3 text-blue-400" />
								<span class="text-[10px] font-medium text-white/40">FORKS</span>
							</div>
							<span class="text-2xl font-black text-white">{repo?.forksCount || 0}</span>
						</div>

						<!-- Description -->
						<div class="rounded-2xl border border-white/10 bg-white/5 p-4">
							<div class="mb-1">
								<span class="text-[10px] font-medium text-white/40">STATUS</span>
							</div>
							<span class="block truncate text-sm font-medium text-white/80">
								{repo?.description?.slice(0, 20) || 'No description'}
							</span>
						</div>
					</div>
				</div>

				<!-- Bottom Footer -->
				<div class="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
					<div class="text-[10px] text-white/30">
						Track your OSS journey at <span class="text-white/50">shipsense.dev</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
						<span class="text-[10px] text-white/40">LIVE</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Action Buttons - Share Primary -->
		<div class="grid grid-cols-1 gap-3 border-t border-white/10 bg-black/60 p-6">
			<Button
				size="lg"
				class="w-full rounded-xl bg-[#000000] text-base font-bold text-white transition-all hover:bg-[#1a1a1a] active:scale-[0.98]"
				onclick={shareToTwitter}
				aria-label="Share on X"
			>
				{#if shareSuccess}
					<CheckCircle class="mr-2 h-5 w-5 text-emerald-400" />
					{LABELS.SHARED}
				{:else}
					<svg class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
						/>
					</svg>
					Share on X
				{/if}
			</Button>
			<Button
				variant="outline"
				size="default"
				class="w-full rounded-xl border-white/20 bg-white/5 font-medium text-white/80 hover:bg-white/10"
				onclick={downloadCard}
				disabled={downloading}
				aria-label={LABELS.DOWNLOAD_IMAGE}
			>
				{#if downloadSuccess}
					<CheckCircle class="mr-2 h-4 w-4 text-emerald-400" />
					{LABELS.DOWNLOADED}
				{:else if downloading}
					<Download class="mr-2 h-4 w-4 animate-pulse" />
					Generating...
				{:else}
					<Download class="mr-2 h-4 w-4" />
					{LABELS.DOWNLOAD_IMAGE}
				{/if}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
