<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';
	import { ArrowRight, Sparkles, BarChart3, LineChart, Cpu, Fingerprint, Check, Zap, Shield, Rocket, HelpCircle } from 'lucide-svelte';
</script>

<svelte:head>
	<title>ShipSense | Elegant Telemetry</title>
	<style>
		@keyframes float {
			0%, 100% { transform: translateY(0) scale(1); }
			50% { transform: translateY(-20px) scale(1.05); }
		}
		@keyframes float-delayed {
			0%, 100% { transform: translateY(0) scale(1); }
			50% { transform: translateY(20px) scale(0.95); }
		}
		.animate-float {
			animation: float 12s ease-in-out infinite;
		}
		.animate-float-delayed {
			animation: float-delayed 15s ease-in-out infinite;
		}
		
		@keyframes pulse-soft {
			0%, 100% { opacity: 0.5; transform: scale(1); }
			50% { opacity: 0.8; transform: scale(1.02); }
		}
		.animate-pulse-soft {
			animation: pulse-soft 4s ease-in-out infinite;
		}
		
		/* Glassmorphic utilities */
		.glass-panel {
			background: linear-gradient(145deg, hsl(var(--card)/0.6), hsl(var(--card)/0.2));
			backdrop-filter: blur(40px);
			-webkit-backdrop-filter: blur(40px);
			border: 1px solid hsl(var(--border)/0.5);
			box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
		}
		
		.glass-card {
			background: hsl(var(--card)/0.4);
			backdrop-filter: blur(20px);
			border: 1px solid hsl(var(--border)/0.3);
		}

		.glass-nav {
			background: linear-gradient(180deg, hsl(var(--background)/0.8), hsl(var(--background)/0.3));
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid hsl(var(--border)/0.4);
		}
	</style>
</svelte:head>

<div class="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary transition-colors duration-500 font-mono">
	
	<!-- Ambient Background Glows -->
	<div class="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
		<div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-float"></div>
		<div class="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-success/20 blur-[150px] animate-float-delayed"></div>
		<div class="absolute top-[30%] left-[60%] w-[30%] h-[30%] rounded-full bg-warning/10 blur-[100px] animate-float"></div>
	</div>

	<!-- Pill Navigation -->
	<div class="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
		<header class="glass-nav rounded-full px-4 sm:px-6 py-3 flex items-center justify-between w-full max-w-4xl shadow-xl transition-all duration-500">
			<div class="flex items-center gap-2 font-bold tracking-tight text-lg">
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground shadow-lg">
					<Fingerprint size={16} />
				</div>
				<span class="hidden sm:inline-block">ShipSense</span>
			</div>
			<nav class="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
				<a href="#vision" class="text-foreground/70 hover:text-foreground transition-colors duration-300">Vision</a>
				<a href="#capabilities" class="text-foreground/70 hover:text-foreground transition-colors duration-300">Capabilities</a>
				<a href="#pricing" class="text-foreground/70 hover:text-foreground transition-colors duration-300">Pricing</a>
			</nav>
			<div class="flex items-center gap-3">
				<ThemeToggle />
				<Button href="/auth/login" class="rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 active:scale-95 transition-all duration-300 px-6 font-medium shadow-md">
					Sign In
				</Button>
			</div>
		</header>
	</div>

	<main class="relative z-10 pt-32 pb-24">
		<!-- Hero Area -->
		<section class="container mx-auto px-6 max-w-6xl py-20 lg:py-32 flex flex-col items-center text-center">
			
			<div class="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 mb-8 animate-float-delayed">
				<Sparkles size={14} class="text-primary" />
				<span class="text-xs font-semibold tracking-wide text-foreground/80 lowercase">ShipSense 1.0 is now in Beta</span>
			</div>
			
			<h1 class="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.05] mb-8 max-w-5xl">
				Grow your open-source ecosystem <br class="hidden md:block"/>
				<span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary border-transparent">without the guesswork.</span>
			</h1>

			<p class="text-lg md:text-2xl font-normal text-foreground/60 max-w-3xl mb-12 leading-relaxed tracking-normal">
				Stop drowning in GitHub notifications. ShipSense translates your repository data into clear health scores and uses AI to tell you exactly what to ship next.
			</p>

			<div class="flex flex-col sm:flex-row items-center gap-6 w-full max-w-md mx-auto sm:max-w-none sm:w-auto">
				<Button href="/auth/login" class="rounded-full w-full sm:w-auto h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] transition-all duration-500 hover:scale-105 font-semibold">
					Get My Repo Health Score
					<ArrowRight class="ml-2 w-5 h-5" />
				</Button>
				<Button href="https://github.com/shipsense" target="_blank" variant="ghost" class="rounded-full w-full sm:w-auto h-14 px-8 text-lg hover:bg-foreground/5 transition-all duration-300 font-semibold border border-transparent hover:border-border/50">
					View Documentation
				</Button>
			</div>
			
			<!-- Hero Dashboard Preview (Enhanced Glass Panel) -->
			<div class="mt-24 w-full max-w-5xl h-[450px] glass-panel rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group hover:shadow-[0_40px_100px_rgba(0,0,0,0.15)] transition-all duration-700">
				<div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 pointer-events-none"></div>
				
				<!-- Header Mock -->
				<div class="flex items-center justify-between mb-8">
					<div class="flex items-center gap-3">
						<div class="flex gap-1.5">
							<div class="w-2.5 h-2.5 rounded-full bg-destructive/60"></div>
							<div class="w-2.5 h-2.5 rounded-full bg-warning/60"></div>
							<div class="w-2.5 h-2.5 rounded-full bg-success/60"></div>
						</div>
						<div class="h-6 w-32 rounded-full bg-foreground/10"></div>
					</div>
					<div class="flex gap-2">
						<div class="h-8 w-8 rounded-full bg-foreground/5 border border-foreground/10"></div>
						<div class="h-8 w-24 rounded-full bg-primary/20 border border-primary/20"></div>
					</div>
				</div>

				<!-- Dashboard Content Mock -->
				<div class="grid grid-cols-12 gap-6 flex-1">
					<!-- Left: Growth & Insight -->
					<div class="col-span-8 flex flex-col gap-6">
						<!-- Health Score Large -->
						<div class="flex-1 rounded-3xl glass-card p-6 border border-primary/20 relative overflow-hidden flex flex-col justify-between">
							<div class="flex justify-between items-start">
								<span class="text-xs font-bold uppercase tracking-widest text-primary/60">Deterministic Health</span>
								<div class="flex items-center gap-1 text-success text-sm font-bold">
									<ArrowRight class="-rotate-45 w-3 h-3" />
									<span>+12.4%</span>
								</div>
							</div>
							<div class="flex items-end gap-4">
								<span class="text-6xl font-bold tracking-tighter">84</span>
								<div class="flex flex-col pb-1">
									<span class="text-xs text-foreground/40 font-bold">OPTIMAL</span>
									<div class="flex gap-0.5 mt-1">
										<div class="h-1 w-4 rounded-full bg-success"></div>
										<div class="h-1 w-4 rounded-full bg-success"></div>
										<div class="h-1 w-4 rounded-full bg-success"></div>
										<div class="h-1 w-4 rounded-full bg-success/20"></div>
									</div>
								</div>
							</div>
						</div>
						<!-- Insight Row -->
						<div class="h-32 rounded-3xl glass-card p-4 border border-foreground/5 flex items-center gap-4">
							<div class="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
								<Sparkles size={20} />
							</div>
							<div class="flex-1">
								<div class="h-4 w-3/4 rounded bg-foreground/10 mb-2"></div>
								<div class="h-3 w-1/2 rounded bg-foreground/5"></div>
							</div>
						</div>
					</div>
					<!-- Right: Streak & Tasks -->
					<div class="col-span-4 flex flex-col gap-6">
						<div class="h-48 rounded-3xl glass-card p-6 border border-warning/20 flex flex-col justify-between">
							<span class="text-xs font-bold uppercase tracking-widest text-warning/60">Ship Streak</span>
							<div class="text-center py-2">
								<span class="text-5xl font-bold">14</span>
								<span class="text-sm text-foreground/40 block font-bold">DAYS</span>
							</div>
							<div class="flex justify-between items-center px-2">
								{#each Array(7) as _, i}
									<div class="w-1.5 h-6 rounded-full {i < 5 ? 'bg-warning' : 'bg-warning/20'}"></div>
								{/each}
							</div>
						</div>
						<div class="flex-1 rounded-3xl glass-card p-4 border border-foreground/5">
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
		<section id="capabilities" class="container mx-auto px-6 max-w-6xl py-24 relative">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to scale your open source project.</h2>
				<p class="text-lg text-foreground/60 max-w-2xl mx-auto tracking-normal">Connect your repository and let ShipSense handle the analytics.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
				
				<!-- Card 1 -->
				<div class="glass-panel rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] group">
					<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 text-primary shadow-sm border border-primary/20 group-hover:scale-110 transition-transform duration-500">
						<BarChart3 size={24} strokeWidth={1.5} />
					</div>
					<h3 class="text-2xl font-semibold mb-3 tracking-tight">Repository Growth Cards</h3>
					<p class="text-foreground/60 leading-relaxed tracking-normal">
						<strong>Measure what actually matters.</strong> Vanity metrics don't equal growth. Growth Cards distill your stars, PR velocity, and contributor dynamics into one definitive health score.
					</p>
				</div>

				<!-- Card 2 -->
				<div class="glass-panel rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] group">
					<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-6 text-success shadow-sm border border-success/20 group-hover:scale-110 transition-transform duration-500">
						<Cpu size={24} strokeWidth={1.5} />
					</div>
					<h3 class="text-2xl font-semibold mb-3 tracking-tight">AI Insight Cards</h3>
					<p class="text-foreground/60 leading-relaxed tracking-normal">
						<strong>Never wonder what to do next.</strong> Powered by Gemini, AI Insight Cards analyze your codebase telemetry and hand you the highest-leverage tasks to merge, close, or review today.
					</p>
				</div>

				<!-- Card 3 -->
				<div class="glass-panel rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] group">
					<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center mb-6 text-warning shadow-sm border border-warning/20 group-hover:scale-110 transition-transform duration-500">
						<LineChart size={24} strokeWidth={1.5} />
					</div>
					<h3 class="text-2xl font-semibold mb-3 tracking-tight">Ship Streaks</h3>
					<p class="text-foreground/60 leading-relaxed tracking-normal">
						<strong>Build unstoppable momentum.</strong> Consistency is the hardest part of open source. The Ship Streak engine gamifies your daily output, helping you build unbreakable commit chains.
					</p>
				</div>

			</div>
		</section>

		<!-- Vision Section: Scalability with Sanity -->
		<section id="vision" class="container mx-auto px-6 max-w-6xl py-32 border-y border-foreground/5">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
				<div class="relative">
					<div class="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
					<h2 class="text-4xl md:text-6xl font-bold tracking-tighter leading-tight mb-8">
						Scaling with <span class="text-primary italic">sanity</span>.
					</h2>
					<p class="text-xl text-foreground/70 leading-relaxed mb-8">
						Building open source shouldn't be synonymous with burnout. ShipSense was founded on the idea that maintainers deserve better than just "more data."
					</p>
					<div class="space-y-6">
						<div class="flex gap-4">
							<div class="mt-1 h-6 w-6 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0">
								<Check size={14} class="text-primary" />
							</div>
							<p class="text-foreground/80">Move from "reactionary" maintenance to "intentional" shipping.</p>
						</div>
						<div class="flex gap-4">
							<div class="mt-1 h-6 w-6 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0">
								<Check size={14} class="text-primary" />
							</div>
							<p class="text-foreground/80">Protect your contributor energy with focused health analytics.</p>
						</div>
						<div class="flex gap-4">
							<div class="mt-1 h-6 w-6 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0">
								<Check size={14} class="text-primary" />
							</div>
							<p class="text-foreground/80">Build a sustainable rhythm that creates long-term value.</p>
						</div>
					</div>
				</div>
				<div class="glass-panel rounded-[3rem] p-12 aspect-square flex flex-col items-center justify-center text-center group transition-all duration-700">
					<div class="mb-8 w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
						<Shield size={48} strokeWidth={1} />
					</div>
					<h3 class="text-3xl font-bold mb-4 italic">Maintainer's Peace of Mind</h3>
					<p class="text-foreground/50 max-w-sm">We handle the noise, metrics, and prioritization so you can focus on the code that matters most.</p>
				</div>
			</div>
		</section>

		<!-- Pricing Section -->
		<section id="pricing" class="container mx-auto px-6 max-w-6xl py-32 border-b border-foreground/5">
			<div class="text-center mb-20">
				<h2 class="text-4xl md:text-6xl font-bold tracking-tight mb-6">Built for every stage of growth.</h2>
				<p class="text-xl text-foreground/60 max-w-2xl mx-auto">Choose a plan that fits your repository ecosystem.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<!-- Free Plan -->
				<div class="glass-panel rounded-[2.5rem] p-10 flex flex-col border border-foreground/5 hover:border-foreground/10 transition-colors">
					<div class="mb-8">
						<span class="text-sm font-bold uppercase tracking-widest text-foreground/40">Free</span>
						<div class="mt-4 flex items-end gap-1">
							<span class="text-4xl font-bold">$0</span>
							<span class="text-foreground/40 mb-1">/mo</span>
						</div>
					</div>
					<div class="flex-1 space-y-4 mb-10">
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">1 Connected Repository</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Daily Health Monitoring</span>
						</div>
						<div class="flex items-center gap-3 opacity-30">
							<Check size={16} class="text-foreground/40" />
							<span class="text-foreground/40 line-through">Gemini Deep Insights</span>
						</div>
					</div>
					<Button variant="outline" class="rounded-full h-12 w-full border-foreground/20 hover:bg-foreground/5 font-semibold">
						Start Free
					</Button>
				</div>

				<!-- Indie Plan (Popular) -->
				<div class="glass-panel rounded-[2.5rem] p-10 flex flex-col border border-primary/30 relative overflow-hidden ring-4 ring-primary/5">
					<div class="absolute top-0 right-0 py-1.5 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-bl-2xl">
						Popular
					</div>
					<div class="mb-8">
						<span class="text-sm font-bold uppercase tracking-widest text-primary">Indie</span>
						<div class="mt-4 flex items-end gap-1">
							<span class="text-4xl font-bold">$12</span>
							<span class="text-foreground/40 mb-1">/mo</span>
						</div>
					</div>
					<div class="flex-1 space-y-4 mb-10">
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/80 font-medium">5 Connected Repositories</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/80 font-medium">Gemini Pro Insights</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/80 font-medium">Weekly Email Reports</span>
						</div>
						<div class="flex items-center gap-3">
							<Zap size={16} class="text-primary fill-primary/20" />
							<span class="text-foreground/80">Priority Task Generation</span>
						</div>
					</div>
					<Button class="rounded-full h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
						Get Started
					</Button>
				</div>

				<!-- Builder Plan -->
				<div class="glass-panel rounded-[2.5rem] p-10 flex flex-col border border-foreground/5 hover:border-foreground/10 transition-colors">
					<div class="mb-8">
						<span class="text-sm font-bold uppercase tracking-widest text-foreground/40">Builder</span>
						<div class="mt-4 flex items-end gap-1">
							<span class="text-4xl font-bold">$49</span>
							<span class="text-foreground/40 mb-1">/mo</span>
						</div>
					</div>
					<div class="flex-1 space-y-4 mb-10">
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Unlimited Repositories</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Gemini 1.5 Flash Speed</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Team Collaboration</span>
						</div>
						<div class="flex items-center gap-3">
							<Check size={16} class="text-success" />
							<span class="text-foreground/70">Custom Task Protocols</span>
						</div>
					</div>
					<Button variant="outline" class="rounded-full h-12 w-full border-foreground/20 hover:bg-foreground/5 font-semibold">
						Contact Sales
					</Button>
				</div>
			</div>
			
			<div class="mt-16 text-center">
				<div class="inline-flex items-center gap-2 text-foreground/40 text-sm">
					<HelpCircle size={14} />
					<span>Need a custom plan for your organization?</span>
					<a href="mailto:hello@shipsense.ai" class="text-primary hover:underline font-medium">Let's talk</a>
				</div>
			</div>
		</section>

		<!-- Final CTA -->
		<section class="container mx-auto px-6 max-w-6xl py-32">
			<div class="relative rounded-[4rem] bg-foreground text-background overflow-hidden p-16 md:p-24 flex flex-col items-center text-center shadow-2xl">
				<div class="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/10 pointer-events-none"></div>
				<div class="relative z-10">
					<Rocket size={48} class="text-primary mb-8 animate-float mx-auto" />
					<h2 class="text-4xl md:text-7xl font-bold tracking-tighter mb-8 leading-tight max-w-3xl">
						Ready to ship with <br /> unstoppable clarify?
					</h2>
					<p class="text-xl text-background/60 max-w-xl mx-auto mb-12">
						Join 1,000+ maintainers who use ShipSense to reclaim their focus and scale their ecosystems with data.
					</p>
					<Button href="/auth/login" class="rounded-full h-16 px-12 text-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500 hover:scale-105 font-bold shadow-xl shadow-primary/20">
						Launch My Command Center
						<ArrowRight class="ml-2 w-6 h-6" />
					</Button>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer class="container mx-auto px-6 max-w-6xl py-12 text-center text-foreground/40 mt-12 border-t border-foreground/10 relative z-10">
			<div class="flex items-center justify-center gap-2 mb-4">
				<Fingerprint size={20} class="opacity-50" />
			</div>
			<p class="text-sm font-medium tracking-wide">ShipSense © {new Date().getFullYear()}. Crafted for open source maintainers.</p>
		</footer>

	</main>
</div>
