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
		Fingerprint,
		Check,
		Zap,
		Shield,
		Rocket,
		HelpCircle,
		Share2,
		Menu,
		X,
		ChevronDown,
		ChevronUp
	} from 'lucide-svelte';

	let mobileMenuOpen = $state(false);

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	// FAQ accordion state
	const faqData = [
		{
			q: "What is ShipSense?",
			a: "ShipSense is a daily repo health intelligence platform for GitHub. Connect your repositories and get one-page briefs showing what changed, what matters, and what to do next — with health scores, anomaly detection, and growth forecasting."
		},
		{
			q: "What data do you access?",
			a: "We only read public repository metadata and activity data from GitHub — stars, commits, issues, PRs, and contributors. We never access your source code, secrets, or private repositories unless you explicitly grant permission."
		},
		{
			q: "Is it free?",
			a: "Yes — the Free plan covers 1 repository with full health scores, daily briefs, and anomaly detection. Paid plans ($9/mo Indie, $49/mo Builder) unlock traffic intelligence, conversion funnels, star forecasts, and more repos."
		},
		{
			q: "Do I need to install anything?",
			a: "No. ShipSense is a web app. Sign in with GitHub, connect your repos, and your first health brief appears in under 30 seconds. No CLI, no config files, no setup."
		},
		{
			q: "Can I use it for private repos?",
			a: "Yes. When you authorize ShipSense via GitHub OAuth, you can choose to grant access to private repositories. We treat private repo data with the same encryption and storage standards as public data."
		}
	];
	let openFaq = $state(-1);

	// Pricing toggle
	let annual = $state(false);
	const monthlyIndie = 9;
	const annualTotalIndie = 84; // $7/mo × 12
	const monthlyBuilder = 49;
	const annualTotalBuilder = 468; // $39/mo × 12

	// Floating CTA
	let showFloatingCta = $state(false);
	$effect(() => {
		if (typeof window === 'undefined') return;
		const heroBottom = document.querySelector('#hero-area')?.getBoundingClientRect()?.bottom ?? 400;
		const observer = new IntersectionObserver(
			([entry]) => {
				showFloatingCta = !entry.isIntersecting && entry.boundingClientRect.top < 0;
			},
			{ threshold: 0 }
		);
		const hero = document.querySelector('#hero-area');
		if (hero) observer.observe(hero);
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>ShipSense — Daily Repo Health Intelligence</title>
	<meta name="description" content="ShipSense turns GitHub activity into a daily health brief. Connect your repos, see what changed, and know exactly what to do next." />
	<meta name="author" content="ShipSense" />
	<meta name="theme-color" content="#0a0a0a" />
	<meta property="og:title" content="ShipSense — Daily Repo Health Intelligence" />
	<meta property="og:description" content="ShipSense turns GitHub activity into a daily health brief. Connect your repos, see what changed, and know exactly what to do next." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://shipsense.app/" />
	<meta property="og:site_name" content="ShipSense" />
	<meta property="og:image" content="https://shipsense.app/api/og" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@shipsense" />
	<meta name="twitter:image" content="https://shipsense.app/api/og" />
	<link rel="canonical" href="https://shipsense.app/" />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			"name": "ShipSense",
			"description": "Daily repository health intelligence for GitHub — health scores, anomaly detection, growth forecasting, and daily action briefs.",
			"url": "https://shipsense.app/",
			"applicationCategory": "DeveloperApplication",
			"operatingSystem": "Web",
			"offers": [
				{
					"@type": "Offer",
					"name": "Free",
					"price": "0",
					"priceCurrency": "USD",
					"description": "1 repository, health scores, daily briefs, anomaly detection"
				},
				{
					"@type": "Offer",
					"name": "Indie",
					"price": "9",
					"priceCurrency": "USD",
					"billingIncrement": "P1M",
					"description": "5 repositories, traffic intelligence, conversion funnels, star forecasts"
				},
				{
					"@type": "Offer",
					"name": "Builder",
					"price": "49",
					"priceCurrency": "USD",
					"billingIncrement": "P1M",
					"description": "50 repositories, team collaboration, Slack/Discord integrations"
				}
			]
		}
	</script>
	<style>
		@keyframes float {
			0%,
			100% {
				transform: translateY(0) scale(1);
			}
			50% {
				transform: translateY(-12px) scale(1.02);
			}
		}
		.animate-float {
			animation: float 10s ease-in-out infinite;
		}

		@keyframes pulse-soft {
			0%,
			100% {
				opacity: 0.4;
			}
			50% {
				opacity: 0.6;
			}
		}
		.animate-pulse-soft {
			animation: pulse-soft 6s ease-in-out infinite;
		}

		@media (prefers-reduced-motion: reduce) {
			.animate-float,
			.animate-pulse-soft {
				animation: none;
			}
		}

		.glass-nav {
			background: linear-gradient(
				180deg,
				hsl(var(--background) / 0.85),
				hsl(var(--background) / 0.5)
			);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid hsl(var(--border) / 0.4);
		}
	</style>
</svelte:head>

<div
	class="relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-500 selection:bg-primary/20 selection:text-primary font-sans"
>
	<!-- Ambient Background -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
		<div
			class="absolute top-[-20%] left-[-10%] h-[50%] w-[50%] animate-pulse-soft rounded-full bg-primary/10 blur-[140px]"
		></div>
		<div
			class="absolute right-[-15%] bottom-[-20%] h-[50%] w-[50%] animate-pulse-soft rounded-full bg-primary/10 blur-[140px]"
			style="animation-delay: 3s;"
		></div>
	</div>

	<!-- Pill Navigation -->
	<div class="fixed top-4 right-0 left-0 z-50 flex justify-center px-4">
		<header
			class="glass-nav flex w-full max-w-4xl items-center justify-between rounded-full px-4 py-2 shadow-xl transition-all duration-500 sm:px-6 sm:py-3"
		>
			<div class="flex items-center gap-2 text-lg font-bold tracking-tight font-mono">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground shadow-lg"
				>
					<Fingerprint size={16} aria-hidden="true" />
				</div>
				<span class="hidden sm:inline-block">ShipSense</span>
			</div>
			<nav class="hidden items-center gap-8 text-sm font-medium tracking-wide md:flex font-mono">
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
				<a
					href="#faq"
					class="text-foreground/70 transition-colors duration-300 hover:text-foreground">FAQ</a
				>
			</nav>
			<div class="flex items-center gap-3">
				<ThemeToggle />
				<!-- Hamburger (mobile only) -->
				<button
					type="button"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
					aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
					aria-expanded={mobileMenuOpen}
				>
					{#if mobileMenuOpen}
						<X size={20} aria-hidden="true" />
					{:else}
						<Menu size={20} aria-hidden="true" />
					{/if}
				</button>
				<Button
					href="/auth/login"
					class="hidden rounded-full bg-foreground px-6 font-medium text-background shadow-md transition-all duration-300 hover:scale-105 hover:bg-foreground/90 active:scale-95 sm:inline-flex"
				>
					Sign In
				</Button>
			</div>
		</header>
	</div>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="fixed inset-0 z-40 bg-background pt-20 md:hidden" role="dialog" aria-label="Mobile navigation" aria-modal="true">
			<nav class="flex flex-col items-center gap-6 pt-12 text-lg font-medium font-mono">
				<a href="#vision" onclick={closeMobileMenu} class="text-foreground/80 transition-colors hover:text-foreground">Vision</a>
				<a href="#capabilities" onclick={closeMobileMenu} class="text-foreground/80 transition-colors hover:text-foreground">Capabilities</a>
				<a href="#pricing" onclick={closeMobileMenu} class="text-foreground/80 transition-colors hover:text-foreground">Pricing</a>
				<a href="#faq" onclick={closeMobileMenu} class="text-foreground/80 transition-colors hover:text-foreground">FAQ</a>
				<Button
					href="/auth/login"
					onclick={closeMobileMenu}
					class="mt-4 rounded-full bg-foreground px-8 font-medium text-background shadow-md"
				>
					Sign In
				</Button>
			</nav>
		</div>
	{/if}

	<main class="relative z-10 pt-24 pb-24">
		<!-- Hero Area -->
		<section
			id="hero-area"
			class="container mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center lg:py-24"
		>
			<div
				class="mb-8 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5"
			>
				<Sparkles size={14} class="text-primary" />
				<span class="text-xs font-semibold tracking-wide text-foreground/80 lowercase"
				>Beta for maintainers, indie builders, and open-source teams</span
				>
			</div>

			<h1
				class="mb-6 max-w-5xl text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl lg:text-6xl"
			>
				Daily health briefs for your
				<br class="hidden md:block" />
				<span class="text-primary">GitHub repositories.</span>
			</h1>

			<p
				class="mb-12 max-w-2xl text-lg leading-relaxed font-normal tracking-normal text-muted-foreground md:text-xl"
			>
				Connect your repos. Get one daily page that tells you what changed, what matters, and what to do next. No tab-hopping.
			</p>

			<div
				class="mx-auto flex w-full max-w-md flex-col items-center gap-4 sm:w-auto sm:max-w-none sm:flex-row sm:gap-3"
			>
				<Button
					href="/auth/login"
					class="h-14 w-full rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 sm:w-auto"
				>
					Check My Repo Health
					<ArrowRight class="ml-2 h-4 w-4" aria-hidden="true" />
				</Button>
				<a
					href="#capabilities"
					class="h-14 w-full rounded-full border border-foreground/15 bg-transparent px-8 text-center text-base font-semibold text-foreground/70 transition-all duration-300 hover:bg-foreground/5 hover:text-foreground sm:w-auto flex items-center justify-center"
				>
					See how it works
					<ArrowRight class="ml-2 h-4 w-4" aria-hidden="true" />
				</a>
			</div>
			<p class="mt-5 text-center text-sm">
				Or{' '}
				<a href="https://shipsense.app/p/example" class="text-primary underline decoration-primary/30 transition-colors hover:decoration-primary">
					see a live demo with a pre-seeded repo
				</a>
				{' '}— no sign-up needed.
			</p>

			<!-- Hero Dashboard Preview -->
			<div
				class="group relative mt-16 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl transition-shadow duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)]"
			>
				<!-- Mini mock of the actual Brief tab -->
				<div class="p-6 sm:p-8">
					<!-- Mock Brief header -->
					<div class="mb-6 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Fingerprint size={16} aria-hidden="true" />
							</div>
							<div>
								<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase font-mono">Today's Brief</p>
								<p class="text-sm font-bold text-foreground font-mono">my-awesome-repo</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<div class="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-bold text-success font-mono">
								<Zap size={12} />
								Accelerating
							</div>
							<div class="rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning font-mono">
								🔥 14d
							</div>
						</div>
					</div>
					<!-- Mock stats + narrative -->
					<div class="mb-4 flex flex-wrap gap-2 font-mono">
						<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Score 72/100</span>
						<span class="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">+18 stars this week</span>
						<span class="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">4 contributors active</span>
					</div>
					<p class="mb-6 text-sm text-foreground/70">
						Your repo gained +18 stars this week — best week yet. Reddit drove 67% of the traffic.
					</p>
					<!-- Mock One Thing card -->
					<div class="rounded-2xl border border-primary/20 bg-primary/5 p-4">
						<div class="mb-2 flex items-center gap-2">
							<Zap size={14} class="text-primary" />
							<p class="text-[10px] font-bold tracking-widest text-primary uppercase">One thing to do</p>
						</div>
						<p class="text-sm font-semibold text-foreground">Reply to issue #42 — high-intent user who also cloned the repo.</p>
						<div class="mt-2 flex items-center gap-2">
							<div class="h-6 w-20 rounded-full bg-primary text-center text-[10px] font-bold leading-6 text-primary-foreground">Mark done</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Capabilities Section -->
		<section id="capabilities" class="relative container mx-auto max-w-6xl px-6 py-24">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
					Stay on top of your repos without the noise.
				</h2>
				<p class="mx-auto max-w-2xl text-lg tracking-normal text-muted-foreground">
					One dashboard. Daily clarity on what changed, what matters, and what to do next.
				</p>
			</div>

			<div class="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				<!-- Card 1: Health Score -->
				<div
					class="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
				>
					<div
						class="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105"
					>
						<BarChart3 size={22} strokeWidth={1.5} />
					</div>
					<h3 class="mb-2 text-lg font-bold tracking-tight">Health Score</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">
						One number that combines stars, commits, PRs, issues, and contributors into a score you can trust. See trends across multiple repos at a glance.
					</p>
				</div>

				<!-- Card 2: Daily Brief -->
				<div
					class="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
				>
					<div
						class="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success transition-transform duration-300 group-hover:scale-105"
					>
						<Cpu size={22} strokeWidth={1.5} />
					</div>
					<h3 class="mb-2 text-lg font-bold tracking-tight">Daily Brief</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">
						Open one page every morning. See what changed overnight, your top action item, and whether momentum is accelerating or stalling.
					</p>
				</div>

				<!-- Card 3: Tasks & Streaks -->
				<div
					class="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
				>
					<div
						class="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/10 text-warning transition-transform duration-300 group-hover:scale-105"
					>
						<LineChart size={22} strokeWidth={1.5} />
					</div>
					<h3 class="mb-2 text-lg font-bold tracking-tight">Tasks & Streaks</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">
						Signals become tasks. Mark them done and watch your shipping streak grow. Consistency becomes visible.
					</p>
				</div>

				<!-- Card 4: Risk Stack -->
				<div
					class="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
				>
					<div
						class="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive transition-transform duration-300 group-hover:scale-105"
					>
						<Shield size={22} strokeWidth={1.5} />
					</div>
					<h3 class="mb-2 text-lg font-bold tracking-tight">Risk Stack</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">
						Vulnerabilities, outdated dependencies, anomalies, and README gaps combined into a single priority list. Fix what matters first.
					</p>
				</div>

				<!-- Card 5: Growth Intelligence -->
				<div
					class="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
				>
					<div
						class="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105"
					>
						<FileText size={22} strokeWidth={1.5} />
					</div>
					<h3 class="mb-2 text-lg font-bold tracking-tight">Growth Intelligence</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">
						Conversion funnel from views to contributors. Star velocity forecasts. External reach scores showing where your traffic actually comes from.
					</p>
				</div>

				<!-- Card 6: Share & Alerts -->
				<div
					class="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
				>
					<div
						class="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success transition-transform duration-300 group-hover:scale-105"
					>
						<Share2 size={22} strokeWidth={1.5} />
					</div>
					<h3 class="mb-2 text-lg font-bold tracking-tight">Share & Alerts</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">
						Public health pages and repo badges to share momentum. Anomaly alerts when something spikes or drops. Weekly email digests.
					</p>
				</div>
			</div>
		</section>

		<!-- Vision Section -->
		<section
			id="vision"
			class="container mx-auto max-w-6xl px-6 py-24"
		>
			<div class="mx-auto max-w-3xl text-center">
				<h2 class="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
					GitHub has everything. Context has nowhere to live.
				</h2>
				<p class="mb-10 text-lg leading-relaxed text-muted-foreground">
					You check PRs. Then issues. Then Insights. Then traffic. Then dependencies. Five tabs to understand one repo.
					ShipSense pulls it all into one page so you can decide in 20 seconds instead of 20 minutes.
				</p>
			</div>
			<div class="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="rounded-2xl border border-border bg-card p-6 text-center">
					<p class="text-3xl font-black text-primary">1</p>
					<p class="mt-2 text-sm font-medium text-foreground">page to open</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-6 text-center">
					<p class="text-3xl font-black text-success">20s</p>
					<p class="mt-2 text-sm font-medium text-foreground">to get the full picture</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-6 text-center">
					<p class="text-3xl font-black text-warning">1</p>
					<p class="mt-2 text-sm font-medium text-foreground">action to take next</p>
				</div>
			</div>
		</section>

		<!-- Pricing Section -->
		<section
			id="pricing"
			class="container mx-auto max-w-6xl px-6 py-24"
		>
			<div class="mb-16 text-center">
				<h2 class="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
					Start free. Scale when you need intelligence.
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
					Every plan includes a real health score and daily brief. Higher tiers unlock predictive signals, traffic intelligence, and portfolio management.
				</p>

				<!-- Billing toggle -->
				<div class="mt-6 flex items-center justify-center gap-3">
					<span class="text-sm font-medium {!annual ? 'text-foreground' : 'text-muted-foreground'}">Monthly</span>
					<button
						type="button"
						onclick={() => (annual = !annual)}
						class="relative h-7 w-12 rounded-full bg-muted transition-colors hover:bg-muted/80 {annual ? 'bg-primary/20' : ''}"
						role="switch"
						aria-checked={annual}
						aria-label="Toggle annual billing"
					>
						<div
							class="absolute top-0.5 h-6 w-6 rounded-full bg-foreground shadow-md transition-transform duration-200 {annual ? 'translate-x-5' : 'translate-x-0.5'}"
						></div>
					</button>
					<span class="text-sm font-medium {annual ? 'text-foreground' : 'text-muted-foreground'}">
						Annual
						<span class="ml-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">Save 20%</span>
					</span>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Free -->
				<div
					class="flex flex-col rounded-[2rem] border border-border bg-card p-8 shadow-sm transition-colors hover:border-foreground/10"
				>
					<div class="mb-2">
						<span class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase"
							>Free</span
						>
						<h3 class="mt-1 text-xl font-bold tracking-tight">Health Clarity</h3>
						<div class="mt-4 flex items-end gap-1">
							<span class="text-4xl font-bold">$0</span>
							<span class="mb-1 text-sm text-muted-foreground">/mo</span>
						</div>
					</div>

					<div class="my-6 flex-1 space-y-3 border-t border-border pt-6">
						<div class="flex items-start gap-3">
							<Check size={15} class="mt-0.5 shrink-0 text-success" />
							<span class="text-sm text-muted-foreground">Health score + trend</span>
						</div>
						<div class="flex items-start gap-3">
							<Check size={15} class="mt-0.5 shrink-0 text-success" />
							<span class="text-sm text-muted-foreground">Daily brief + change summary</span>
						</div>
						<div class="flex items-start gap-3">
							<Check size={15} class="mt-0.5 shrink-0 text-success" />
							<span class="text-sm text-muted-foreground">Shipping streak + task engine</span>
						</div>
						<div class="flex items-start gap-3">
							<Check size={15} class="mt-0.5 shrink-0 text-success" />
							<span class="text-sm text-muted-foreground">Public health page + repo badge</span>
						</div>
						<div class="flex items-start gap-3">
							<Check size={15} class="mt-0.5 shrink-0 text-success" />
							<span class="text-sm text-muted-foreground">1 repository</span>
						</div>
					</div>

					<Button
						href="/auth/login"
						variant="outline"
						class="h-12 w-full rounded-full font-semibold"
					>
						Start Free
					</Button>
				</div>

				<!-- Indie -->
				<div
					class="relative flex flex-col overflow-hidden rounded-[2rem] border border-primary/30 bg-card p-8 shadow-lg ring-1 ring-primary/10"
				>
					<div
						class="absolute top-0 right-0 rounded-bl-2xl bg-primary px-3 py-1 text-[10px] font-bold tracking-widest text-primary-foreground uppercase"
					>
						Recommended
					</div>
					<div class="mb-2">
						<span class="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Indie</span>
						<h3 class="mt-1 text-xl font-bold tracking-tight">Growth Intelligence</h3>
						<div class="mt-4 flex items-end gap-1.5">
							<span class="text-4xl font-bold">${annual ? annualTotalIndie : monthlyIndie}</span>
							<span class="mb-1 text-sm text-muted-foreground">/{annual ? 'yr' : 'mo'}</span>
							{#if annual}
								<span class="mb-1 text-xs text-muted-foreground">≈ $7/mo</span>
							{/if}
						</div>
					</div>

					<!-- Intelligence preview -->
					<div
						class="my-5 rounded-xl border border-primary/15 bg-primary/5 p-3"
					>
						<p class="text-[10px] font-bold tracking-widest text-primary/70 uppercase">
							Intelligence unlocked
						</p>
						<p class="mt-1.5 text-xs font-medium text-foreground">
							📈 On track for 1,000 stars by June · growing 3.2 stars/day
						</p>
					</div>

					<div class="flex-1 space-y-3 border-t border-border pt-5">
						<div class="flex items-start gap-3">
							<Zap size={15} class="mt-0.5 shrink-0 text-primary" />
							<span class="text-sm text-muted-foreground">Star forecast + conversion funnel</span>
						</div>
						<div class="flex items-start gap-3">
							<Zap size={15} class="mt-0.5 shrink-0 text-primary" />
							<span class="text-sm text-muted-foreground">Anomaly detection + traffic intelligence</span>
						</div>
						<div class="flex items-start gap-3">
							<Zap size={15} class="mt-0.5 shrink-0 text-primary" />
							<span class="text-sm text-muted-foreground">Risk stack + external reach score</span>
						</div>
						<div class="flex items-start gap-3">
							<Check size={15} class="mt-0.5 shrink-0 text-success" />
							<span class="text-sm text-muted-foreground">Weekly email digest</span>
						</div>
						<div class="flex items-start gap-3">
							<Check size={15} class="mt-0.5 shrink-0 text-success" />
							<span class="text-sm text-muted-foreground">5 repositories</span>
						</div>
					</div>

					<Button
						href="/auth/login"
						class="mt-6 h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
					>
						Get Started
					</Button>
				</div>

				<!-- Builder -->
				<div
					class="flex flex-col rounded-[2rem] border border-border bg-card p-8 shadow-sm transition-colors hover:border-foreground/10"
				>
					<div class="mb-2">
						<span class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase"
							>Builder</span
						>
						<h3 class="mt-1 text-xl font-bold tracking-tight">Portfolio Ops</h3>
						<div class="mt-4 flex items-end gap-1.5">
							<span class="text-4xl font-bold">${annual ? annualTotalBuilder : monthlyBuilder}</span>
							<span class="mb-1 text-sm text-muted-foreground">/{annual ? 'yr' : 'mo'}</span>
							{#if annual}
								<span class="mb-1 text-xs text-muted-foreground">≈ $39/mo</span>
							{/if}
						</div>
					</div>

					<div class="my-6 flex-1 space-y-3 border-t border-border pt-6">
						<div class="flex items-start gap-3">
							<Rocket size={15} class="mt-0.5 shrink-0 text-warning" />
							<span class="text-sm text-muted-foreground">Everything in Indie — 50 repos</span>
						</div>
						<div class="flex items-start gap-3">
							<Rocket size={15} class="mt-0.5 shrink-0 text-warning" />
							<span class="text-sm text-muted-foreground">Portfolio-level health overview</span>
						</div>
						<div class="flex items-start gap-3">
							<Rocket size={15} class="mt-0.5 shrink-0 text-warning" />
							<span class="text-sm text-muted-foreground">Dependency monitoring across all manifests</span>
						</div>
						<div class="flex items-start gap-3">
							<Rocket size={15} class="mt-0.5 shrink-0 text-warning" />
							<span class="text-sm text-muted-foreground">Proactive anomaly + score drop alerts</span>
						</div>
						<div class="flex items-start gap-3">
							<Rocket size={15} class="mt-0.5 shrink-0 text-warning" />
							<span class="text-sm text-muted-foreground">Best for teams and agencies</span>
						</div>
					</div>

					<Button
						href="mailto:hello@shipsense.ai"
						variant="outline"
						class="h-12 w-full rounded-full font-semibold"
					>
						Contact Sales
					</Button>
				</div>
			</div>

			<!-- Feature comparison row -->
			<div class="mt-12 overflow-hidden rounded-[2rem] border border-border bg-card">
				<div class="grid grid-cols-4 border-b border-border px-8 py-4">
					<p class="text-xs font-bold tracking-widest text-muted-foreground uppercase">Feature</p>
					<p class="text-center text-xs font-bold tracking-widest text-muted-foreground uppercase">Free</p>
					<p class="text-center text-xs font-bold tracking-widest text-primary uppercase">Indie</p>
					<p class="text-center text-xs font-bold tracking-widest text-muted-foreground uppercase">Builder</p>
				</div>
				{#each [
					{ label: 'Health score + trend', free: true, indie: true, builder: true },
					{ label: 'Daily brief + digest', free: true, indie: true, builder: true },
					{ label: 'Task engine + streaks', free: true, indie: true, builder: true },
					{ label: 'Risk stack', free: true, indie: true, builder: true },
					{ label: 'Star forecast', free: false, indie: true, builder: true },
					{ label: 'Conversion funnel', free: false, indie: true, builder: true },
					{ label: 'Anomaly detection', free: false, indie: true, builder: true },
					{ label: 'Traffic intelligence', free: false, indie: true, builder: true },
					{ label: 'External reach score', free: false, indie: true, builder: true },
					{ label: 'Portfolio overview', free: false, indie: false, builder: true },
					{ label: 'Dependency monitoring', free: false, indie: false, builder: true },
				] as row}
					<div class="grid grid-cols-4 border-b border-border px-8 py-3.5 last:border-0">
						<p class="text-sm text-muted-foreground">{row.label}</p>
						<p class="text-center">
							{#if row.free}
								<Check size={15} class="mx-auto text-success" />
							{:else}
								<span class="text-muted-foreground/30">—</span>
							{/if}
						</p>
						<p class="text-center">
							{#if row.indie}
								<Check size={15} class="mx-auto text-primary" />
							{:else}
								<span class="text-muted-foreground/30">—</span>
							{/if}
						</p>
						<p class="text-center">
							{#if row.builder}
								<Check size={15} class="mx-auto text-warning" />
							{:else}
								<span class="text-muted-foreground/30">—</span>
							{/if}
						</p>
					</div>
				{/each}
			</div>

			<div class="mt-12 text-center">
				<div class="inline-flex items-center gap-2 text-sm text-muted-foreground">
					<HelpCircle size={14} />
					<span>Need a custom plan for your organization?</span>
					<a href="mailto:hello@shipsense.ai" class="font-medium text-primary hover:underline"
						>Let's talk</a
					>
				</div>
			</div>
		</section>

		<!-- FAQ -->
		<section id="faq" class="container mx-auto max-w-3xl px-6 py-24" aria-label="Frequently asked questions">
			<div class="mb-12 text-center">
				<h2 class="text-3xl font-bold tracking-tight md:text-4xl">Questions? Answers.</h2>
				<p class="mt-3 text-lg text-muted-foreground">Everything you need to know before getting started.</p>
			</div>
			<div class="divide-y divide-border/40">
				{#each faqData as faq, i}
					<div>
						<button
							type="button"
							onclick={() => (openFaq = openFaq === i ? -1 : i)}
							class="group flex w-full cursor-pointer items-center justify-between py-5 text-left"
							aria-expanded={openFaq === i}
							aria-controls="faq-panel-{i}"
						>
							<span class="pr-4 text-base font-semibold text-foreground">{faq.q}</span>
							{#if openFaq === i}
								<ChevronUp class="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground" aria-hidden="true" />
							{:else}
								<ChevronDown class="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground" aria-hidden="true" />
							{/if}
						</button>
						{#if openFaq === i}
							<div id="faq-panel-{i}" class="pb-5">
								<p class="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "FAQPage",
				"mainEntity": [
					{
						"@type": "Question",
						"name": "What is ShipSense?",
						"acceptedAnswer": {
							"@type": "Answer",
							"text": "ShipSense is a daily repo health intelligence platform for GitHub. Connect your repositories and get one-page briefs showing what changed, what matters, and what to do next — with health scores, anomaly detection, and growth forecasting."
						}
					},
					{
						"@type": "Question",
						"name": "What data do you access?",
						"acceptedAnswer": {
							"@type": "Answer",
							"text": "We only read public repository metadata and activity data from GitHub — stars, commits, issues, PRs, and contributors. We never access your source code, secrets, or private repositories unless you explicitly grant permission."
						}
					},
					{
						"@type": "Question",
						"name": "Is it free?",
						"acceptedAnswer": {
							"@type": "Answer",
							"text": "Yes — the Free plan covers 1 repository with full health scores, daily briefs, and anomaly detection. Paid plans ($9/mo Indie, $49/mo Builder) unlock traffic intelligence, conversion funnels, star forecasts, and more repos."
						}
					},
					{
						"@type": "Question",
						"name": "Do I need to install anything?",
						"acceptedAnswer": {
							"@type": "Answer",
							"text": "No. ShipSense is a web app. Sign in with GitHub, connect your repos, and your first health brief appears in under 30 seconds. No CLI, no config files, no setup."
						}
					},
					{
						"@type": "Question",
						"name": "Can I use it for private repos?",
						"acceptedAnswer": {
							"@type": "Answer",
							"text": "Yes. When you authorize ShipSense via GitHub OAuth, you can choose to grant access to private repositories. We treat private repo data with the same encryption and storage standards as public data."
						}
					}
				]
			}
		</script>

		<!-- Final CTA -->
		<section class="container mx-auto max-w-6xl px-6 py-24">
			<div
				class="relative flex flex-col items-center overflow-hidden rounded-[3rem] bg-foreground p-12 text-center text-background shadow-2xl md:p-20"
			>
				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-primary/10"
				></div>
				<div class="relative z-10">
					<h2 class="mb-4 max-w-3xl text-3xl leading-tight font-bold tracking-tight md:text-5xl">
						One dashboard. Daily clarity.
					</h2>
					<p class="mx-auto mb-10 max-w-xl text-lg text-background/60">
						Stop checking five tabs to understand one repo. Connect GitHub, get your first brief in 30 seconds.
					</p>
					<Button
						href="/auth/login"
						class="h-14 rounded-full bg-primary px-10 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-300 hover:bg-primary/90"
					>
						Get Started Free
						<ArrowRight class="ml-2 h-4 w-4" aria-hidden="true" />
					</Button>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer
			class="relative z-10 container mx-auto mt-12 max-w-6xl border-t border-border px-6 py-12 text-center text-muted-foreground"
		>
			<div class="mb-4 flex items-center justify-center gap-2">
				<Fingerprint size={20} class="opacity-40" aria-hidden="true" />
				<span class="text-sm font-medium">ShipSense</span>
			</div>
			<p class="text-sm">
				ShipSense © {new Date().getFullYear()}. Built for maintainers and open-source teams.
			</p>
			<nav class="mt-4 flex justify-center gap-6 text-sm" aria-label="Legal links">
				<a href="/legal/privacy" class="text-muted-foreground underline decoration-transparent transition-colors hover:decoration-current">Privacy</a>
				<a href="/legal/terms" class="text-muted-foreground underline decoration-transparent transition-colors hover:decoration-current">Terms</a>
			</nav>
		</footer>

		<!-- Floating CTA -->
		{#if showFloatingCta}
			<div class="fixed bottom-6 right-6 z-50 animate-float">
				<Button
					href="/auth/login"
					class="h-12 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-300 hover:scale-105 hover:bg-primary/90 active:scale-95"
				>
					<Zap size={16} class="mr-1.5" aria-hidden="true" />
					Get Started Free
				</Button>
			</div>
		{/if}
	</main>
</div>
