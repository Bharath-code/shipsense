<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { ArrowRight as ArrowRightIcon } from "lucide-svelte";
  import ThemeToggle from "$lib/components/dashboard/ThemeToggle.svelte";
</script>

<svelte:head>
  <title>ShipSense | The Growth Engine for Indie Hackers</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground transition-colors duration-300 selection:bg-primary/20">
  <!-- Navigation -->
  <header class="sticky top-0 z-50 w-full border-b border-border bg-background/50 backdrop-blur-xl">
    <div class="container mx-auto px-4 h-14 flex items-center justify-between max-w-7xl">
      <div class="flex items-center gap-2 font-bold font-mono tracking-tighter">
        <div class="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">S</div>
        ShipSense
      </div>
      <nav class="flex items-center gap-4">
        <a href="#features" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
        <a href="#pricing" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        <Button href="/auth/login" variant="ghost" class="text-muted-foreground hover:text-foreground">Sign In</Button>
        <ThemeToggle />
        <Button href="/auth/login" class="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
      </nav>
    </div>
  </header>

  <main>
    <!-- Hero Section -->
    <section class="py-24 md:py-32 lg:py-40 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--color-primary)_/_10%,_transparent_70%)] opacity-50"></div>
      
      <div class="container mx-auto px-4 max-w-5xl relative z-10 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground mb-8 tracking-wide uppercase">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Currently in Beta
        </div>
        
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
          Intelligence for <br class="hidden md:block"/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">Open Source Founders</span>
        </h1>
        
        <p class="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Monitor your GitHub repo health, track shipping streaks, and get AI-driven workflows to grow your developer ecosystem.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/auth/login" size="lg" class="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base h-12 px-8">
            Start Tracking Free
            <ArrowRightIcon class="ml-2 h-4 w-4" />
          </Button>
          <Button href="https://github.com/shipsense" target="_blank" variant="outline" size="lg" class="w-full sm:w-auto h-12 px-8 border-border hover:bg-muted">
            <svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.696 1.027 1.59 1.027 2.683 0 3.842-2.337 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
            </svg>
            View our GitHub
          </Button>
        </div>
      </div>
    </section>

    <!-- Value Prop / Workflow -->
    <section id="features" class="py-24 border-t border-border bg-muted/20">
      <div class="container mx-auto px-4 max-w-7xl">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div class="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2">Health Scores</h3>
            <p class="text-muted-foreground text-sm leading-relaxed">
              We aggregate stars, issues, PR velocity, and active contributors into one deterministic health score.
            </p>
          </div>
          <div class="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div class="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2">AI Action Plans</h3>
            <p class="text-muted-foreground text-sm leading-relaxed">
              Google Gemini powers our AI agent to read your metrics and suggest exact actions to grow your repo.
            </p>
          </div>
          <div class="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div class="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2">Shipping Streaks</h3>
            <p class="text-muted-foreground text-sm leading-relaxed">
              Gamify your open source journey. Build long commit streaks and get beautiful shareable momentum charts.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
