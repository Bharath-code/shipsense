<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { FunnelStage } from '$convex/trafficIntelligence';
	import { TrendingUp, TrendingDown, Eye, Star, GitFork, Users, ArrowRight, Sparkles, Bug } from 'lucide-svelte';

	let { repoId }: { repoId: string } = $props();

	const funnelQuery = useQuery(api.trafficIntelligence.getConversionFunnel, () => ({
		repoId: repoId as any
	}));

	const diagnosticQuery = useQuery(api.diagnostics.diagnoseFunnelData, () => ({
		repoId: repoId as any
	}));

	let funnel = $derived(funnelQuery.data);
	let diagnostic = $derived(diagnosticQuery.data);
	let isLoading = $derived(funnelQuery.isLoading);
	let showDiagnostic = $state(false);

	let activeTab: 'cumulative' | 'weekly' = $state('weekly');
	let currentView = $derived(activeTab === 'weekly' ? funnel?.weekly : funnel?.cumulative);

	function sentimentClass(s: 'excellent' | 'good' | 'weak' | 'none') {
		if (s === 'excellent') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
		if (s === 'good') return 'text-primary bg-primary/10 border-primary/20';
		if (s === 'weak') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
		return 'text-muted-foreground bg-white/5 border-white/10';
	}

	function valueColor(s: 'excellent' | 'good' | 'weak' | 'none') {
		if (s === 'excellent') return 'text-emerald-400';
		if (s === 'good') return 'text-primary';
		if (s === 'weak') return 'text-amber-400';
		return 'text-muted-foreground';
	}

	function momentumConfig(v: 'accelerating' | 'coasting' | 'stalling') {
		if (v === 'accelerating')
			return { label: 'Accelerating', icon: TrendingUp, cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
		if (v === 'stalling')
			return { label: 'Stalling', icon: TrendingDown, cls: 'text-red-400 bg-red-400/10 border-red-400/20' };
		return { label: 'Coasting', icon: ArrowRight, cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
	}

	function formatRate(r: number | null): string {
		if (r === null) return '—';
		if (r >= 10) return `${r.toFixed(0)}%`;
		return `${r.toFixed(1)}%`;
	}

	function stageIcon(label: string) {
		if (label === 'Views') return Eye;
		if (label === 'Stars') return Star;
		if (label === 'Clones') return GitFork;
		return Users;
	}
</script>

<div class="rounded-[2rem] border glass-panel border-white/10 p-6 shadow-2xl overflow-hidden relative">
	<!-- subtle bg glow -->
	<div class="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>

	<div class="relative mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
				Growth Intelligence
			</p>
			<h2 class="mt-1 text-2xl font-black text-foreground">Conversion Funnel</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				{#if currentView}{currentView.description}{:else}How visitors become stars, cloners, and contributors{/if}
			</p>
		</div>

		{#if funnel}
			{@const cfg = momentumConfig(funnel.momentumVector)}
			<div class="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold {cfg.cls}">
				{#if funnel.momentumVector === 'accelerating'}
					<TrendingUp class="h-4 w-4" />
				{:else if funnel.momentumVector === 'stalling'}
					<TrendingDown class="h-4 w-4" />
				{:else}
					<ArrowRight class="h-4 w-4" />
				{/if}
				{cfg.label}
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="space-y-3">
			{#each Array(4) as _}
				<div class="h-24 animate-pulse rounded-2xl bg-white/5"></div>
			{/each}
		</div>
	{:else if !funnel}
		<p class="text-sm text-muted-foreground">Unable to load funnel data.</p>
	{:else}
		<!-- Tab switcher -->
		<div class="mb-4 flex gap-2">
			<button
				type="button"
				onclick={() => activeTab = 'weekly'}
				class="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors {activeTab === 'weekly' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}"
				style="min-height: 44px;"
			>
				Weekly
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'cumulative'}
				class="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors {activeTab === 'cumulative' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}"
				style="min-height: 44px;"
			>
				Cumulative
			</button>
		</div>

		<!-- Funnel pipeline -->
		{#if currentView}
		<div class="relative space-y-2">
			{#each currentView.stages as stage, i}
				{@const Icon = stageIcon(stage.label)}
				<div class="group">
					<!-- Stage card -->
					<div class="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]">
						<!-- Icon -->
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 {valueColor(stage.sentiment)}">
							<Icon class="h-5 w-5" />
						</div>

						<!-- Label + sub -->
						<div class="min-w-[6rem] shrink-0">
							<p class="text-sm font-semibold text-foreground">{stage.label}</p>
							<p class="text-xs text-muted-foreground">{stage.subLabel}</p>
						</div>

						<!-- Value -->
						<div class="flex-1 text-right sm:text-left">
							<p class="text-2xl font-black {valueColor(stage.sentiment)}">
								{stage.value.toLocaleString()}
							</p>
						</div>

						<!-- Conversion badge — only for stages 2-4 -->
						{#if stage.conversionRate !== null}
							<div class="shrink-0">
								<span class="inline-flex flex-col items-end gap-0.5 rounded-xl border px-3 py-1.5 text-right {sentimentClass(stage.sentiment)}">
									<span class="text-base font-bold leading-tight">{formatRate(stage.conversionRate)}</span>
									<span class="text-[10px] font-medium leading-tight opacity-80">{stage.conversionLabel}</span>
								</span>
							</div>
						{:else}
							<div class="shrink-0">
								<span class="inline-flex flex-col items-end gap-0.5 rounded-xl border px-3 py-1.5 text-right {sentimentClass(stage.sentiment)}">
									<span class="text-[10px] font-medium leading-tight opacity-80">{stage.conversionLabel}</span>
								</span>
							</div>
						{/if}
					</div>

					<!-- Arrow connector (not on last stage) -->
					{#if i < currentView.stages.length - 1}
						<div class="flex justify-center py-1">
							<ArrowRight class="h-4 w-4 rotate-90 text-white/20" />
						</div>
					{/if}
				</div>
			{/each}
		</div>
		{/if}

		<!-- Momentum reason -->
		<div class="mt-4 rounded-xl bg-white/5 px-4 py-2.5">
			<p class="text-xs text-muted-foreground">
				<span class="font-semibold text-foreground">Momentum signal:</span>
				{funnel.momentumReason}
			</p>
		</div>

		<!-- One Thing -->
		<div class="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
			<div class="mb-2 flex items-center gap-2">
				<Sparkles class="h-4 w-4 text-primary" />
				<p class="text-xs font-bold tracking-widest text-primary uppercase">One Thing</p>
			</div>
			<p class="text-sm leading-relaxed text-foreground">{funnel.oneThing}</p>
		</div>

		<!-- No traffic data nudge -->
		{#if !funnel.hasData}
			<div class="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
				<p class="text-sm text-muted-foreground">
					Traffic data hasn't been collected yet. Run a sync and check back in 24 hours to see
					your full funnel.
				</p>
			</div>
		{/if}

		<!-- Diagnostic toggle button -->
		<button
			type="button"
			onclick={() => showDiagnostic = !showDiagnostic}
			class="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
		>
			<Bug class="h-3 w-3" />
			{showDiagnostic ? 'Hide' : 'Show'} Raw Data
		</button>

		<!-- Diagnostic panel -->
		{#if showDiagnostic}
			<div class="mt-2 rounded-xl bg-black/30 p-4 text-xs font-mono space-y-3">
				<h3 class="text-sm font-bold text-foreground">🔍 Funnel Diagnostics</h3>

				{#if diagnostic && !('error' in diagnostic) && diagnostic.latestSnapshot}
					<div>
						<p class="text-muted-foreground mb-1">Repo: {diagnostic.repo.fullName}</p>
						<p class="text-muted-foreground mb-1">Snapshots: {diagnostic.snapshotCount}</p>
					</div>

					<div class="border-t border-white/10 pt-3">
						<p class="font-bold text-foreground mb-2">Latest Snapshot</p>
						<p>Captured: {diagnostic.latestSnapshot.capturedAt}</p>
						<p>stars: <span class="text-amber-400">{diagnostic.latestSnapshot.stars}</span></p>
						<p>starsLast7d: <span class="text-amber-400">{diagnostic.latestSnapshot.starsLast7d}</span></p>
						<p>views: <span class="text-blue-400">{diagnostic.latestSnapshot.views ?? 0}</span></p>
						<p>clones: <span class="text-purple-400">{diagnostic.latestSnapshot.clones ?? 0}</span></p>
						<p>contributors14d: <span class="text-green-400">{diagnostic.latestSnapshot.contributors14d}</span></p>
						<p>totalContributors: <span class="text-green-400">{diagnostic.latestSnapshot.totalContributors ?? 'undefined'}</span></p>
					</div>

					{#if diagnostic.previousSnapshot}
						<div class="border-t border-white/10 pt-3">
							<p class="font-bold text-foreground mb-2">Previous Snapshot</p>
							<p>Captured: {diagnostic.previousSnapshot.capturedAt}</p>
							<p>stars: {diagnostic.previousSnapshot.stars}</p>
							<p>starsLast7d: {diagnostic.previousSnapshot.starsLast7d}</p>
							<p>views: {diagnostic.previousSnapshot.views ?? 0}</p>
							<p>clones: {diagnostic.previousSnapshot.clones ?? 0}</p>
						</div>
					{:else}
						<div class="border-t border-white/10 pt-3">
							<p class="font-bold text-amber-400">⚠️ No previous snapshot - this is first sync</p>
						</div>
					{/if}

					{#if diagnostic.weeklyFunnel}
						<div class="border-t border-white/10 pt-3">
							<p class="font-bold text-foreground mb-2">Weekly Funnel (Computed)</p>
							<p>Views: <span class="text-blue-400">{diagnostic.weeklyFunnel.viewsThisPeriod}</span></p>
							<p>Stars: <span class="text-amber-400">{diagnostic.weeklyFunnel.starsThisPeriod}</span></p>
							<p>Clones: <span class="text-purple-400">{diagnostic.weeklyFunnel.clonesThisPeriod}</span></p>
							<p>Contributors: <span class="text-green-400">{diagnostic.weeklyFunnel.contributorsThisPeriod}</span></p>
							<p class="text-muted-foreground mt-1">{diagnostic.weeklyFunnel.explanation}</p>
						</div>
					{/if}

					<div class="border-t border-white/10 pt-3">
						<p class="font-bold text-foreground mb-2">Cumulative Traffic (Tracked from first sync)</p>
						<p>Cumulative Views: <span class="text-blue-400">{diagnostic.repoCumulativeTraffic.cumulativeViews}</span></p>
						<p>Cumulative Clones: <span class="text-purple-400">{diagnostic.repoCumulativeTraffic.cumulativeClones}</span></p>
					</div>

					<div class="border-t border-white/10 pt-3">
						<p class="font-bold text-foreground mb-2">Diagnosis</p>
						<p class="text-amber-400">⭐ {diagnostic.diagnosis.starsIssue}</p>
						<p class="text-blue-400">👁️ {diagnostic.diagnosis.viewsIssue}</p>
						<p class="text-purple-400">📦 {diagnostic.diagnosis.clonesIssue}</p>
						<p class="text-green-400">👥 {diagnostic.diagnosis.contributorsIssue}</p>
					</div>

					{#if diagnostic.trafficDetails}
						<div class="border-t border-white/10 pt-3">
							<p class="font-bold text-foreground mb-2">Traffic Details (from GitHub API)</p>
							<p>Total Views: <span class="text-blue-400">{diagnostic.trafficDetails.totalViews}</span></p>
							<p>Unique Visitors: <span class="text-blue-400">{diagnostic.trafficDetails.totalUniques}</span></p>
							<p>Total Clones: <span class="text-purple-400">{diagnostic.trafficDetails.totalClones}</span></p>
							<p>Unique Cloners: <span class="text-purple-400">{diagnostic.trafficDetails.totalCloners}</span></p>
							{#if diagnostic.trafficDetails.hasReferrerData}
								<p class="text-emerald-400 mt-2">✅ Referrer data available:</p>
								{#each diagnostic.trafficDetails.topReferrers as ref}
									<p class="ml-2">• {ref.source}: {ref.views} views, {ref.uniques} uniques</p>
								{/each}
							{:else}
								<p class="text-amber-400 mt-2">⚠️ No referrer data - GitHub may not be tracking this repo yet</p>
							{/if}
						</div>
					{/if}

					<div class="border-t border-white/10 pt-3">
						<p class="font-bold text-emerald-400">✅ Recommendation</p>
						<p>{diagnostic.recommendation}</p>
					</div>
				{:else if diagnostic && 'error' in diagnostic}
					<p class="text-red-400">Error: {(diagnostic as any).error}</p>
				{:else}
					<p class="text-muted-foreground">Loading diagnostic...</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>
