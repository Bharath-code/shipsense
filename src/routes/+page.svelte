<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import ArrowRightIcon from "lucide-svelte/icons/arrow-right";
  import GithubIcon from "lucide-svelte/icons/github";
</script>

<svelte:head>
  <title>ShipSense | The Growth Engine for Indie Hackers</title>
</svelte:head>

<div class="min-h-screen bg-black text-white selection:bg-zinc-800">
  <!-- Navigation -->
  <header class="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/50 backdrop-blur-xl">
    <div class="container mx-auto px-4 h-14 flex items-center justify-between max-w-7xl">
      <div class="flex items-center gap-2 font-bold font-mono tracking-tighter">
        <div class="h-6 w-6 rounded-md bg-white text-black flex items-center justify-center">S</div>
        ShipSense
      </div>
      <nav class="flex items-center gap-4">
        <a href="#features" class="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
        <a href="#pricing" class="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Pricing</a>
        <Button href="/auth/login" variant="ghost" class="text-zinc-300 hover:text-white">Sign In</Button>
        <Button href="/auth/login" class="bg-white text-black hover:bg-zinc-200">Get Started</Button>
      </nav>
    </div>
  </header>

  <main>
    <!-- Hero Section -->
    <section class="py-24 md:py-32 lg:py-40 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/30 via-black to-black"></div>
      
      <div class="container mx-auto px-4 max-w-5xl relative z-10 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 mb-8 tracking-wide uppercase">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Currently in Beta
        </div>
        
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
          Intelligence for <br class="hidden md:block"/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600">Open Source Founders</span>
        </h1>
        
        <p class="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Monitor your GitHub repo health, track shipping streaks, and get AI-driven workflows to grow your developer ecosystem.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/auth/login" size="lg" class="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 text-base h-12 px-8">
            Start Tracking Free
            <ArrowRightIcon class="ml-2 h-4 w-4" />
          </Button>
          <Button href="https://github.com/shipsense" target="_blank" variant="outline" size="lg" class="w-full sm:w-auto h-12 px-8 border-zinc-800 hover:bg-zinc-900">
            <GithubIcon class="mr-2 h-4 w-4" />
            View our GitHub
          </Button>
        </div>
      </div>
    </section>

    <!-- Value Prop / Workflow -->
    <section id="features" class="py-24 border-t border-zinc-900 bg-zinc-950/20">
      <div class="container mx-auto px-4 max-w-7xl">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div class="h-10 w-10 rounded-lg bg-black border border-zinc-800 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-zinc-100">Health Scores</h3>
            <p class="text-zinc-500 text-sm leading-relaxed">
              We aggregate stars, issues, PR velocity, and active contributors into one deterministic health score.
            </p>
          </div>
          <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div class="h-10 w-10 rounded-lg bg-black border border-zinc-800 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-zinc-100">AI Action Plans</h3>
            <p class="text-zinc-500 text-sm leading-relaxed">
              Google Gemini 2.5 powers our AI agent to read your metrics and suggest exact actions to grow your repo.
            </p>
          </div>
          <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div class="h-10 w-10 rounded-lg bg-black border border-zinc-800 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-zinc-100">Shipping Streaks</h3>
            <p class="text-zinc-500 text-sm leading-relaxed">
              Gamify your open source journey. Build long commit streaks and get beautiful shareable momentum charts.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
