<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';
	import { ArrowRight, Sparkles, BarChart3, LineChart, Cpu, Fingerprint } from 'lucide-svelte';
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
		
		/* Glassmorphic utilities */
		.glass-panel {
			background: linear-gradient(145deg, hsl(var(--card)/0.6), hsl(var(--card)/0.2));
			backdrop-filter: blur(40px);
			-webkit-backdrop-filter: blur(40px);
			border: 1px solid hsl(var(--border)/0.5);
			box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
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
				Effortless intelligence for your <br class="hidden md:block"/>
				<span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary border-transparent">open-source ecosystem.</span>
			</h1>

			<p class="text-lg md:text-2xl font-normal text-foreground/60 max-w-3xl mb-12 leading-relaxed tracking-normal">
				Understand your repository health. Nurture your active contributors. Build infinite shipping streaks with deeply integrated telemetry and AI orchestration.
			</p>

			<div class="flex flex-col sm:flex-row items-center gap-6 w-full max-w-md mx-auto sm:max-w-none sm:w-auto">
				<Button href="/auth/login" class="rounded-full w-full sm:w-auto h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] transition-all duration-500 hover:scale-105 font-semibold">
					Start Tracking Free
					<ArrowRight class="ml-2 w-5 h-5" />
				</Button>
				<Button href="https://github.com/shipsense" target="_blank" variant="ghost" class="rounded-full w-full sm:w-auto h-14 px-8 text-lg hover:bg-foreground/5 transition-all duration-300 font-semibold border border-transparent hover:border-border/50">
					View Documentation
				</Button>
			</div>
			
			<!-- Hero Dashboard Preview (Glass Panel) -->
			<div class="mt-24 w-full max-w-5xl h-[400px] glass-panel rounded-[2rem] p-4 flex flex-col relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] transition-all duration-700">
				<div class="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 mix-blend-overlay"></div>
				<!-- Top Bar -->
				<div class="flex items-center gap-2 mb-6 px-4 pt-2">
					<div class="w-2.5 h-2.5 rounded-full bg-destructive/80"></div>
					<div class="w-2.5 h-2.5 rounded-full bg-warning/80"></div>
					<div class="w-2.5 h-2.5 rounded-full bg-success/80"></div>
					<div class="ml-4 h-6 w-48 rounded-full bg-foreground/10 backdrop-blur-sm"></div>
				</div>
				<!-- Content Grid Mock -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 px-4 pb-2">
					<div class="col-span-2 rounded-2xl bg-gradient-to-br from-foreground/5 to-transparent border border-foreground/10 p-6 flex flex-col">
						<div class="h-6 w-32 rounded-lg bg-foreground/10 mb-4"></div>
						<div class="flex-1 rounded-xl bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent border border-primary/20"></div>
					</div>
					<div class="col-span-1 rounded-2xl bg-gradient-to-br from-foreground/5 to-transparent border border-foreground/10 p-6 flex flex-col gap-4">
						<div class="h-6 w-24 rounded-lg bg-foreground/10 mb-2"></div>
						<div class="h-12 rounded-xl bg-foreground/5 border border-foreground/5"></div>
						<div class="h-12 rounded-xl bg-foreground/5 border border-foreground/5"></div>
						<div class="h-12 rounded-xl bg-foreground/5 border border-foreground/5"></div>
					</div>
				</div>
			</div>
			
		</section>

		<!-- Capabilities Framework -->
		<section id="capabilities" class="container mx-auto px-6 max-w-6xl py-24 relative">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-5xl font-bold tracking-tight mb-4">Core Capabilities</h2>
				<p class="text-lg text-foreground/60 max-w-2xl mx-auto tracking-normal">A unified engine designed specifically for modern open-source maintenance.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
				
				<!-- Card 1 -->
				<div class="glass-panel rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] group">
					<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 text-primary shadow-sm border border-primary/20 group-hover:scale-110 transition-transform duration-500">
						<BarChart3 size={24} strokeWidth={1.5} />
					</div>
					<h3 class="text-2xl font-semibold mb-3 tracking-tight">Repository Growth Cards</h3>
					<p class="text-foreground/60 leading-relaxed tracking-normal">
						Instantly parse your repository's pulse. Growth Cards aggregate stars, PR velocity, and active contributors into a focused, deterministic health score without the noise.
					</p>
				</div>

				<!-- Card 2 -->
				<div class="glass-panel rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] group">
					<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-6 text-success shadow-sm border border-success/20 group-hover:scale-110 transition-transform duration-500">
						<Cpu size={24} strokeWidth={1.5} />
					</div>
					<h3 class="text-2xl font-semibold mb-3 tracking-tight">AI Insight Cards</h3>
					<p class="text-foreground/60 leading-relaxed tracking-normal">
						Stop guessing what to ship next. Powered by Google Gemini, Insight Cards analyze your telemetry to suggest exact, high-leverage workflows tailored to your ecosystem.
					</p>
				</div>

				<!-- Card 3 -->
				<div class="glass-panel rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] group">
					<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center mb-6 text-warning shadow-sm border border-warning/20 group-hover:scale-110 transition-transform duration-500">
						<LineChart size={24} strokeWidth={1.5} />
					</div>
					<h3 class="text-2xl font-semibold mb-3 tracking-tight">Ship Streaks</h3>
					<p class="text-foreground/60 leading-relaxed tracking-normal">
						Gamify your open-source journey. The Ship Streak engine tracks your daily operational output, building unbroken commit chains and cementing your shipping momentum.
					</p>
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
