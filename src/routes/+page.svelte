<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';
	import {
		ArrowRight,
		Sparkles,
		BarChart3,
		LineChart,
		Cpu,
		FileText,
		Package,
		Fingerprint,
		Check,
		Zap,
		Shield,
		Rocket,
		HelpCircle,
		Share2
	} from 'lucide-svelte';
</script>

<svelte:head>
	<title>ShipSense | Daily Repo Clarity</title>
	<style>
		@keyframes float {
			0%,
			100% {
				transform: translateY(0) scale(1);
			}
			50% {
				transform: translateY(-20px) scale(1.05);
			}
		}
		@keyframes float-delayed {
			0%,
			100% {
				transform: translateY(0) scale(1);
			}
			50% {
				transform: translateY(20px) scale(0.95);
			}
		}
		.animate-float {
			animation: float 12s ease-in-out infinite;
		}
		.animate-float-delayed {
			animation: float-delayed 15s ease-in-out infinite;
		}

		@keyframes pulse-soft {
			0%,
			100% {
				opacity: 0.5;
				transform: scale(1);
			}
			50% {
				opacity: 0.8;
				transform: scale(1.02);
			}
		}
		.animate-pulse-soft {
			animation: pulse-soft 4s ease-in-out infinite;
		}

		/* Glassmorphic utilities */
		.glass-panel {
			background: linear-gradient(145deg, hsl(var(--card) / 0.6), hsl(var(--card) / 0.2));
			backdrop-filter: blur(40px);
			-webkit-backdrop-filter: blur(40px);
			border: 1px solid hsl(var(--border) / 0.5);
			box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
		}

		.glass-card {
			background: hsl(var(--card) / 0.4);
			backdrop-filter: blur(20px);
			border: 1px solid hsl(var(--border) / 0.3);
		}

		.glass-nav {
			background: linear-gradient(
				180deg,
				hsl(var(--background) / 0.8),
				hsl(var(--background) / 0.3)
			);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid hsl(var(--border) / 0.4);
		}
	</style>
</svelte:head>

<div
	class="relative min-h-screen overflow-x-hidden bg-background font-mono text-foreground transition-colors duration-500 selection:bg-primary/20 selection:text-primary"
>
	<!-- Ambient Background Glows -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
		<div
			class="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] animate-float rounded-full bg-primary/20 blur-[120px]"
		></div>
		<div
			class="animate-float-delayed absolute right-[-10%] bottom-[-20%] h-[60%] w-[60%] rounded-full bg-success/20 blur-[150px]"
		></div>
		<div
			class="absolute top-[30%] left-[60%] h-[30%] w-[30%] animate-float rounded-full bg-warning/10 blur-[100px]"
		></div>
	</div>

	<!-- Pill Navigation -->
	<div class="fixed top-4 right-0 left-0 z-50 flex justify-center px-4">
		<header
			class="glass-nav flex w-full max-w-4xl items-center justify-between rounded-full px-4 py-2 shadow-xl transition-all duration-500 sm:px-6 sm:py-3"
		>
			<div class="flex items-center gap-2 text-lg font-bold tracking-tight">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground shadow-lg"
				>
					<Fingerprint size={16} />
				</div>
				<span class="hidden sm:inline-block">ShipSense</span>
			</div>
			<nav class="hidden items-center gap-8 text-sm font-medium tracking-wide md:flex">
				<a
					href="#vision"
					class="text-foreground/70 transition-colors duration-300 hover:text-foreground">Vision</a
				>
				<a
					href="#capabilities"
					class="text-foreground/70 transition-colors duration-300 hover:text-foreground"
					>Capabilities</a
				>
				<a
					href="#pricing"
					class="text-foreground/70 transition-colors duration-300 hover:text-foreground">Pricing</a
				>
			</nav>
			<div class="flex items-center gap-3">
				<ThemeToggle />
				<Button
					href="/auth/login"
					class="rounded-full bg-foreground px-6 font-medium text-background shadow-md transition-all duration-300 hover:scale-105 hover:bg-foreground/90 active:scale-95"
				>
					Sign In
				</Button>
			</div>
		</header>
	</div>

	<main class="relative z-10 pt-24 pb-24">
		<!-- Hero Area -->
		<section
			class="container mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center lg:py-24"
		>
			<div
				class="animate-float-delayed mb-8 inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5"
			>
				<Sparkles size={14} class="text-primary" />
				<span class="text-xs font-semibold tracking-wide text-foreground/80 lowercase"
					>Beta for maintainers, indie builders, and open-source teams</span
				>
			</div>

			<h1
				class="mb-6 max-w-5xl text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl lg:text-6xl"
			>
				Know what changed in your repos <br class="hidden md:block" />
				<span
					class="border-transparent bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent"
					>and what to do next.</span
				>
			</h1>

			<p
				class="mb-12 max-w-3xl text-lg leading-relaxed font-normal tracking-normal text-foreground/60 md:text-2xl"
			>
				ShipSense turns GitHub activity into a calm operating system for your projects. Connect your
				repos, get a daily brief, and know exactly what to do next.
			</p>

			<div
				class="mx-auto flex w-full max-w-md flex-col items-center gap-6 sm:w-auto sm:max-w-none sm:flex-row"
			>
				<Button
					href="/auth/login"
					class="h-14 w-full rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground transition-all duration-500 hover:scale-105 hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] sm:w-auto"
				>
					Check My Repo Health
					<ArrowRight class="ml-2 h-5 w-5" />
				</Button>
				<Button
					href="https://github.com/shipsense"
					target="_blank"
					variant="ghost"
					class="h-14 w-full rounded-full border border-transparent px-8 text-lg font-semibold transition-all duration-300 hover:border-border/50 hover:bg-foreground/5 sm:w-auto"
				>
					View on GitHub
				</Button>
			</div>

			<!-- Hero Dashboard Preview (Enhanced Glass Panel) -->
			<div
				class="group relative mt-16 flex h-[350px] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] glass-panel p-6 transition-all duration-700 hover:shadow-[0_40px_100px_rgba(0,0,0,0.15)]"
			>
				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5"
				></div>

				<!-- Header Mock -->
				<div class="mb-8 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="flex gap-1.5">
							<div class="h-2.5 w-2.5 rounded-full bg-destructive/60"></div>
							<div class="h-2.5 w-2.5 rounded-full bg-warning/60"></div>
							<div class="h-2.5 w-2.5 rounded-full bg-success/60"></div>
						</div>
						<div class="h-6 w-32 rounded-full bg-foreground/10"></div>
					</div>
					<div class="flex gap-2">
						<div class="h-8 w-8 rounded-full border border-foreground/10 bg-foreground/5"></div>
						<div class="h-8 w-24 rounded-full border border-primary/20 bg-primary/20"></div>
					</div>
				</div>

				<!-- Dashboard Content Mock -->
				<div class="grid flex-1 grid-cols-12 gap-6">
					<!-- Left: Growth & Insight -->
					<div class="col-span-8 flex flex-col gap-6">
						<!-- Health Score Large -->
						<div
							class="relative flex flex-1 flex-col justify-between overflow-hidden rounded-3xl border glass-card border-primary/20 p-6"
						>
							<div class="flex items-start justify-between">
								<span class="text-xs font-bold tracking-widest text-primary/60 uppercase"
									>Deterministic Health</span
								>
								<div class="flex items-center gap-1 text-sm font-bold text-success">
									<ArrowRight class="h-3 w-3 -rotate-45" />
									<span>+12.4%</span>
								</div>
							</div>
							<div class="flex items-end gap-4">
								<span class="text-6xl font-bold tracking-tighter">84</span>
								<div class="flex flex-col pb-1">
									<span class="text-xs font-bold text-muted-foreground">OPTIMAL</span>
									<div class="mt-1 flex gap-0.5">
										<div class="h-1 w-4 rounded-full bg-success"></div>
										<div class="h-1 w-4 rounded-full bg-success"></div>
										<div class="h-1 w-4 rounded-full bg-success"></div>
										<div class="h-1 w-4 rounded-full bg-success/20"></div>
									</div>
								</div>
							</div>
						</div>
						<!-- Insight Row -->
						<div
							class="flex h-32 items-center gap-4 rounded-3xl border glass-card border-foreground/5 p-4"
						>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success"
							>
								<Sparkles size={20} />
							</div>
							<div class="flex-1">
								<div class="mb-2 h-4 w-3/4 rounded bg-foreground/10"></div>
								<div class="h-3 w-1/2 rounded bg-foreground/5"></div>
							</div>
						</div>
					</div>
					<!-- Right: Streak & Tasks -->
					<div class="col-span-4 flex flex-col gap-6">
						<div
							class="flex h-48 flex-col justify-between rounded-3xl border glass-card border-warning/20 p-6"
						>
							<span class="text-xs font-bold tracking-widest text-warning/60 uppercase"
								>Ship Streak</span
							>
							<div class="py-2 text-center">
								<span class="text-5xl font-bold">14</span>
								<span class="block text-sm font-bold text-muted-foreground">DAYS</span>
							</div>
							<div class="flex items-center justify-between px-2">
								{#each Array(7) as _, i}
									<div
										class="h-6 w-1.5 rounded-full {i < 5 ? 'bg-warning' : 'bg-warning/20'}"
									></div>
								{/each}
							</div>
						</div>
						<div class="flex-1 rounded-3xl border glass-card border-foreground/5 p-4">
							<div class="flex flex-col gap-3">
								<div class="h-3 w-full rounded bg-foreground/10"></div>
								<div class="h-3 w-full rounded bg-foreground/10"></div>
								<div class="h-3 w-2/3 rounded bg-foreground/10"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Capabilities Framework -->
		<section id="capabilities" class="relative container mx-auto max-w-6xl px-6 py-24">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
					Stay on top of your repos without the noise.
				</h2>
				<p class="mx-auto max-w-2xl text-lg tracking-normal text-foreground/60">
					One dashboard. Daily clarity on what changed, what matters, and what to do next.
				</p>
			</div>

			<div class="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
				<!-- Card 1 -->
				<div
					class="group rounded-3xl glass-panel p-8 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
				>
					<div
						class="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm transition-transform duration-500 group-hover:scale-110"
					>
						<BarChart3 size={24} strokeWidth={1.5} />
					</div>
					<h3 class="mb-3 text-2xl font-semibold tracking-tight">Health Score</h3>
					<p class="leading-relaxed tracking-normal text-foreground/60">
						<strong>See repo health at a glance.</strong> One score combines stars, commits, PRs, issues,
						and contributors into a number you can trust.
					</p>
				</div>

				<!-- Card 2 -->
				<div
					class="group rounded-3xl glass-panel p-8 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
				>
					<div
						class="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-success/20 bg-gradient-to-br from-success/20 to-success/5 text-success shadow-sm transition-transform duration-500 group-hover:scale-110"
					>
						<Cpu size={24} strokeWidth={1.5} />
					</div>
					<h3 class="mb-3 text-2xl font-semibold tracking-tight">Daily Digest and AI Read</h3>
					<p class="leading-relaxed tracking-normal text-foreground/60">
						<strong>Start every session with clarity.</strong> Get a daily brief, change summary, top
						risk, top win, and an AI summary that tells you what deserves attention first.
					</p>
				</div>

				<!-- Card 3 -->
				<div
					class="group rounded-3xl glass-panel p-8 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
				>
					<div
						class="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/20 to-warning/5 text-warning shadow-sm transition-transform duration-500 group-hover:scale-110"
					>
						<LineChart size={24} strokeWidth={1.5} />
					</div>
					<h3 class="mb-3 text-2xl font-semibold tracking-tight">Priority Tasks and Streaks</h3>
					<p class="leading-relaxed tracking-normal text-foreground/60">
						<strong>Keep momentum visible.</strong> Turn repo signals into actionable tasks, then track
						commit streaks so consistency becomes part of your workflow instead of an accident.
					</p>
				</div>

				<!-- Card 4 -->
				<div
					class="group rounded-3xl glass-panel p-8 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
				>
					<div
						class="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/20 to-warning/5 text-warning shadow-sm transition-transform duration-500 group-hover:scale-110"
					>
						<Package size={24} strokeWidth={1.5} />
					</div>
					<h3 class="mb-3 text-2xl font-semibold tracking-tight">Dependency Risk Monitoring</h3>
					<p class="leading-relaxed tracking-normal text-foreground/60">
						<strong>Spot maintenance risk before it piles up.</strong> Review outdated, deprecated, and
						vulnerable dependencies without digging through every manifest by hand.
					</p>
				</div>

				<!-- Card 5 -->
				<div
					class="group rounded-3xl glass-panel p-8 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
				>
					<div
						class="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm transition-transform duration-500 group-hover:scale-110"
					>
						<FileText size={24} strokeWidth={1.5} />
					</div>
					<h3 class="mb-3 text-2xl font-semibold tracking-tight">README and Repo Quality Checks</h3>
					<p class="leading-relaxed tracking-normal text-foreground/60">
						<strong>Tighten the parts contributors actually feel.</strong> Score your README, review documentation
						gaps, and keep repo hygiene visible alongside shipping velocity.
					</p>
				</div>

				<!-- Card 6 -->
				<div
					class="group rounded-3xl glass-panel p-8 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
				>
					<div
						class="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-success/20 bg-gradient-to-br from-success/20 to-success/5 text-success shadow-sm transition-transform duration-500 group-hover:scale-110"
					>
						<Share2 size={24} strokeWidth={1.5} />
					</div>
					<h3 class="mb-3 text-2xl font-semibold tracking-tight">Alerts, Reports, and Sharing</h3>
					<p class="leading-relaxed tracking-normal text-foreground/60">
						<strong>Stay informed and show progress publicly.</strong> Get anomaly alerts, in-app notifications,
						weekly reports, public health pages, badges, and growth cards you can share.
					</p>
				</div>
			</div>
		</section>

		<!-- Vision Section: Scalability with Sanity -->
		<section
			id="vision"
			class="container mx-auto max-w-6xl border-y border-foreground/5 px-6 py-32"
		>
			<div class="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
				<div class="relative">
					<div
						class="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
					></div>
					<h2 class="mb-8 text-4xl leading-tight font-bold tracking-tighter md:text-6xl">
						Operate your repos with <span class="text-primary italic">clarity</span>.
					</h2>
					<p class="mb-8 text-xl leading-relaxed text-foreground/70">
						ShipSense brings scattered GitHub signals back into one calm place.
					</p>
					<div class="space-y-6">
						<div class="flex gap-4">
							<div
								class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground/5"
							>
								<Check size={14} class="text-primary" />
							</div>
							<p class="text-foreground/80">One daily brief instead of checking five tabs.</p>
						</div>
						<div class="flex gap-4">
							<div
								class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground/5"
							>
								<Check size={14} class="text-primary" />
							</div>
							<p class="text-foreground/80">See what needs attention before it becomes a fire.</p>
						</div>
						<div class="flex gap-4">
							<div
								class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground/5"
							>
								<Check size={14} class="text-primary" />
							</div>
							<p class="text-foreground/80">Share progress with public health badges.</p>
						</div>
					</div>
				</div>
				<div
					class="group flex aspect-square flex-col items-center justify-center rounded-[3rem] glass-panel p-12 text-center transition-all duration-700"
				>
					<div
						class="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110"
					>
						<Shield size={48} strokeWidth={1} />
					</div>
					<h3 class="mb-4 text-3xl font-bold italic">A calmer maintainer workflow</h3>
					<p class="max-w-sm text-foreground/50">
						Less time piecing together signals. More time shipping.
					</p>
				</div>
			</div>
		</section>

		<!-- Pricing Section -->
		<section
			id="pricing"
			class="container mx-auto max-w-6xl border-b border-foreground/5 px-6 py-32"
		>
			<div class="mb-20 text-center">
				<h2 class="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
					Start free. Upgrade for more.
				</h2>
				<p class="mx-auto max-w-2xl text-xl text-foreground/60">
					Free plan gives you daily clarity on any repo. Paid plans add reporting and more connected
					repos.
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
				<!-- Free Plan -->
				<div
					class="flex flex-col rounded-[2.5rem] border glass-panel border-foreground/5 p-10 transition-colors hover:border-foreground/10"
				>
					<div class="mb-8">
						<span class="text-sm font-bold tracking-widest text-muted-foreground uppercase"
							>Free</span
						>
						<div class="mt-4 flex items-end gap-1">
							<span class="text-4xl font-bold">$0</span>
							<span class="mb-1 text-sm text-muted-foreground">/mo</span>
						</div>
					</div>
					<div class="mb-10 flex-1 space-y-4">
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">1 Connected Repository</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Health Scores and Momentum Tracking</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Daily Digest, Streaks, and Sync Monitoring</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Public Health Pages and Repo Badges</span>
						</div>
					</div>
					<Button
						href="/auth/login"
						variant="outline"
						class="h-12 w-full rounded-full border-foreground/20 font-semibold hover:bg-foreground/5"
					>
						Start Free
					</Button>
				</div>

				<!-- Indie Plan (Popular) -->
				<div
					class="relative flex flex-col overflow-hidden rounded-[2.5rem] border glass-panel border-primary/30 p-10 ring-4 ring-primary/5"
				>
					<div
						class="absolute top-0 right-0 rounded-bl-2xl bg-primary px-4 py-1.5 text-[10px] font-bold tracking-widest text-primary-foreground uppercase"
					>
						Popular
					</div>
					<div class="mb-8">
						<span class="text-sm font-bold tracking-widest text-primary uppercase">Indie</span>
						<div class="mt-4 flex items-end gap-1">
							<span class="text-4xl font-bold">$12</span>
							<span class="mb-1 text-sm text-muted-foreground">/mo</span>
						</div>
					</div>
					<div class="mb-10 flex-1 space-y-4">
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="font-medium text-foreground/80">5 Connected Repositories</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="font-medium text-foreground/80">AI Insights and Priority Tasks</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="font-medium text-foreground/80">Weekly Email Reports</span>
						</div>
						<div class="flex items-center gap-3">
							<Zap size={16} class="fill-primary/20 text-primary" />
							<span class="text-foreground/80">A tighter weekly operating rhythm</span>
						</div>
					</div>
					<Button
						href="/auth/login"
						class="h-12 w-full rounded-full bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
					>
						Get Started
					</Button>
				</div>

				<!-- Builder Plan -->
				<div
					class="flex flex-col rounded-[2.5rem] border glass-panel border-foreground/5 p-10 transition-colors hover:border-foreground/10"
				>
					<div class="mb-8">
						<span class="text-sm font-bold tracking-widest text-muted-foreground uppercase"
							>Builder</span
						>
						<div class="mt-4 flex items-end gap-1">
							<span class="text-4xl font-bold">$49</span>
							<span class="mb-1 text-sm text-muted-foreground">/mo</span>
						</div>
					</div>
					<div class="mb-10 flex-1 space-y-4">
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">50 Connected Repositories</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Weekly Reports and Priority Tasks</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Portfolio-Scale Monitoring Across Repos</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Best fit for teams and multi-product builders</span>
						</div>
					</div>
					<Button
						href="mailto:hello@shipsense.ai"
						variant="outline"
						class="h-12 w-full rounded-full border-foreground/20 font-semibold hover:bg-foreground/5"
					>
						Contact Sales
					</Button>
				</div>
			</div>

			<div class="mt-16 text-center">
				<div class="inline-flex items-center gap-2 text-sm text-muted-foreground">
					<HelpCircle size={14} />
					<span>Need a custom plan for your organization?</span>
					<a href="mailto:hello@shipsense.ai" class="font-medium text-primary hover:underline"
						>Let's talk</a
					>
				</div>
			</div>
		</section>

		<!-- Final CTA -->
		<section class="container mx-auto max-w-6xl px-6 py-32">
			<div
				class="relative flex flex-col items-center overflow-hidden rounded-[4rem] bg-foreground p-16 text-center text-background shadow-2xl md:p-24"
			>
				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/10"
				></div>
				<div class="relative z-10">
					<Rocket size={48} class="mx-auto mb-8 animate-float text-primary" />
					<h2 class="mb-8 max-w-3xl text-4xl leading-tight font-bold tracking-tighter md:text-7xl">
						Ready for a clearer view of your repos?
					</h2>
					<p class="mx-auto mb-12 max-w-xl text-xl text-background/60">
						One dashboard. Daily clarity. ShipSense helps you see what matters and know what to do
						next.
					</p>
					<Button
						href="/auth/login"
						class="h-16 rounded-full bg-primary px-12 text-xl font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-500 hover:scale-105 hover:bg-primary/90"
					>
						Get Started Free
						<ArrowRight class="ml-2 h-6 w-6" />
					</Button>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer
			class="relative z-10 container mx-auto mt-12 max-w-6xl border-t border-foreground/10 px-6 py-12 text-center text-foreground/40"
		>
			<div class="mb-4 flex items-center justify-center gap-2">
				<Fingerprint size={20} class="opacity-50" />
			</div>
			<p class="text-sm font-medium tracking-wide">
				ShipSense © {new Date().getFullYear()}. Crafted for open source maintainers.
			</p>
		</footer>
	</main>
</div>
