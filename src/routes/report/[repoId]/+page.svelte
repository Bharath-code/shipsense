<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { TrendingUp, Award, Zap, Calendar, Share2, Download, Lock } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { fade, fly } from 'svelte/transition';

	let { data } = $props<{ data: { repoId: any } }>();

	const reportQuery = useQuery(api.reports.aggregateReportData, { repoId: data.repoId });
	let report = $derived(reportQuery.data);
	let isLoading = $derived(reportQuery.isLoading);

	function getGrade(score: number) {
		if (score >= 90) return { grade: 'A+', color: 'text-success', label: 'Elite' };
		if (score >= 80) return { grade: 'A', color: 'text-success', label: 'Excellent' };
		if (score >= 70) return { grade: 'B', color: 'text-primary', label: 'Very Good' };
		if (score >= 60) return { grade: 'C', color: 'text-warning', label: 'Good' };
		return { grade: 'D', color: 'text-destructive', label: 'Needs Attention' };
	}

	const grade = $derived(report ? getGrade(report.healthScore) : { grade: '—', color: 'text-muted-foreground', label: 'Unknown' });
</script>

<div class="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
	<!-- Top Navigation / Header -->
	<header class="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
		<div class="container mx-auto flex items-center justify-between px-6 py-4">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
					<Zap size={16} />
				</div>
				<span class="text-sm font-bold tracking-tight">ShipSense <span class="text-muted-foreground font-medium">Investor Report</span></span>
			</div>
			<div class="flex items-center gap-3">
				<Button variant="outline" size="sm" class="hidden sm:flex rounded-full gap-2">
					<Share2 size={14} />
					Share Report
				</Button>
				<Button size="sm" class="rounded-full bg-primary gap-2">
					<Download size={14} />
					Export PDF
				</Button>
			</div>
		</div>
	</header>

	<main class="container mx-auto px-6 pt-32 pb-24 max-w-4xl">
		{#if isLoading}
			<div class="flex h-[60vh] items-center justify-center">
				<div class="flex flex-col items-center gap-4">
					<div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
					<p class="text-sm font-medium text-muted-foreground animate-pulse">Analyzing repository momentum...</p>
				</div>
			</div>
		{:else if !report}
			<div class="flex h-[60vh] flex-col items-center justify-center text-center">
				<div class="rounded-full bg-muted p-6 text-muted-foreground/40 mb-4">
					<Award size={48} />
				</div>
				<h1 class="text-2xl font-bold">Report Not Found</h1>
				<p class="text-muted-foreground mt-2">The requested report is unavailable or has expired.</p>
				<Button href="/" variant="outline" class="mt-6 rounded-full">Return Home</Button>
			</div>
		{:else}
			<div class="space-y-12">
				<!-- Hero Section: Identity & Grade -->
				<section class="relative rounded-[3rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-8 md:p-16 text-center overflow-hidden">
					<div class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
					<div class="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>

					<div class="relative z-10">
						<div class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase">
							<Sparkles size={12} />
							Verified Momentum Report
						</div>
						<h1 class="mb-4 text-4xl font-black tracking-tight md:text-6xl">
							{report.repoName}
						</h1>
						<p class="mb-12 text-lg text-muted-foreground">
							Official Health & Traction Analysis for <span class="text-foreground font-medium">{report.owner}</span>
						</p>

						<div class="mx-auto flex max-w-xs flex-col items-center justify-center rounded-3xl border border-white/10 bg-card p-8 shadow-2xl">
							<span class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Overall Grade</span>
							<div class="text-8xl font-black {grade.color} leading-none mb-2">
								{grade.grade}
							</div>
							<div class="text-xl font-bold text-foreground">{report.healthScore}/100</div>
							<div class="mt-4 text-sm font-medium text-muted-foreground">
								{grade.label} — Top {100 - report.percentile}% of similar projects
							</div>
						</div>
					</div>
				</section>

				<!-- Key Metrics Grid -->
				<section class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<div class="rounded-3xl border border-white/10 bg-card p-6 shadow-sm">
						<div class="mb-4 flex items-center gap-3 text-primary">
							<TrendingUp size={20} />
							<span class="text-xs font-bold uppercase tracking-wider">Growth Velocity</span>
						</div>
						<div class="text-3xl font-bold">{report.starVelocity}</div>
						<p class="mt-1 text-xs text-muted-foreground">Net new stars this week</p>
					</div>

					<div class="rounded-3xl border border-white/10 bg-card p-6 shadow-sm">
						<div class="mb-4 flex items-center gap-3 text-success">
							<Zap size={20} />
							<span class="text-xs font-bold uppercase tracking-wider">Health Trend</span>
						</div>
						<div class="text-3xl font-bold capitalize">{report.scoreTrend}</div>
						<p class="mt-1 text-xs text-muted-foreground">Score momentum (30-day window)</p>
					</div>

					<div class="rounded-3xl border border-white/10 bg-card p-6 shadow-sm">
						<div class="mb-4 flex items-center gap-3 text-warning">
							<Award size={20} />
							<span class="text-xs font-bold uppercase tracking-wider">Global Percentile</span>
						</div>
						<div class="text-3xl font-bold">{report.percentile}%</div>
						<p class="mt-1 text-xs text-muted-foreground">Compared to similar ecosystems</p>
					</div>
				</section>

				<!-- Detailed Analysis: Wins & Milestones -->
				<div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
					<!-- Top Wins -->
					<section class="space-y-6">
						<div class="flex items-center gap-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
								<TrendingUp size={18} />
							</div>
							<h2 class="text-xl font-bold">Top Traction Wins</h2>
						</div>
						<div class="space-y-4">
							{#each report.topWins as win}
								<div class="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.05]">
									<h4 class="mb-1 text-sm font-bold text-foreground">{win.title}</h4>
									<p class="text-xs leading-relaxed text-muted-foreground">{win.description}</p>
								</div>
							{/each}
							{#if report.topWins.length === 0}
								<p class="text-sm text-muted-foreground italic">No significant anomalies detected this period.</p>
							{/if}
						</div>
					</section>

					<!-- Momentum Timeline -->
					<section class="space-y-6">
						<div class="flex items-center gap-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Calendar size={18} />
							</div>
							<h2 class="text-xl font-bold">Growth Milestones</h2>
						</div>
						<div class="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
							{#each report.milestones as m}
								<div class="relative pl-10">
									<div class="absolute left-2 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
									<div class="flex flex-col">
										<span class="text-[10px] font-bold text-muted-foreground uppercase">{m.date}</span>
										<p class="text-sm font-medium text-foreground">{m.event}</p>
									</div>
								</div>
							{/each}
							{#if report.milestones.length === 0}
								<p class="text-sm text-muted-foreground italic">Building history... continue shipping to unlock milestones.</p>
							{/if}
						</div>
					</section>
				</div>

				<!-- CTA Footer -->
				<section class="rounded-[3rem] border border-primary/20 bg-primary/10 p-12 text-center">
					<h2 class="mb-4 text-2xl font-bold">Want a real-time version of this report?</h2>
					<p class="mb-8 text-muted-foreground">
						ShipSense provides daily updates, AI-driven tasks, and live tracking for your repo's health.
					</p>
					<Button href="/auth/login" size="lg" class="rounded-full bg-primary px-8 font-bold text-primary-foreground transition-all hover:scale-105">
						Start Tracking for Free
						<ArrowRight class="ml-2 h-4 w-4" />
					</Button>
				</section>
			</div>
		{/if}
	</main>
</div>
