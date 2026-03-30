<script lang="ts">
  import { useAuth } from "@mmailaender/convex-auth-svelte/svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/button/button.svelte";
  import { LogOut as LogOutIcon } from "lucide-svelte";
  import ThemeToggle from "$lib/components/dashboard/ThemeToggle.svelte";

  const auth = useAuth();
  // ... rest of logic remains same ...
  let wasAuthenticated = $state(false);

  $effect(() => {
    if (auth.isAuthenticated) {
      wasAuthenticated = true;
    }
  });

  $effect(() => {
    const url = $page.url;
    const inOAuthCallback = url.searchParams.has("code") || url.searchParams.has("state");

    if (!auth.isLoading && !auth.isAuthenticated && !inOAuthCallback && !wasAuthenticated) {
      goto("/auth/login");
    }
  });

  async function handleSignOut() {
    wasAuthenticated = false;
    await auth.signOut();
    window.location.href = "/auth/login";
  }

  let { children } = $props();
</script>


<div class="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
  <header class="sticky top-0 z-50 w-full border-b border-border bg-background/50 backdrop-blur-xl">
    <div class="container flex h-14 items-center px-4 max-w-7xl mx-auto">
      <div class="flex items-center gap-2 font-bold font-mono tracking-tighter">
        <div class="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">S</div>
        ShipSense
      </div>
      
      <div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <nav class="flex items-center space-x-4">
          <a href="/dashboard" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
          <a href="/dashboard/connect" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Connect</a>
          <a href="/dashboard/settings" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Settings</a>
        </nav>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onclick={handleSignOut} title="Log out">
            <LogOutIcon class="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      </div>
    </div>
  </header>

  <main class="flex-1 container mx-auto p-4 max-w-7xl">
    {@render children()}
  </main>
</div>
