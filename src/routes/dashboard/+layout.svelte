<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "$lib/convex/_generated/api";
  import { useAuthActions } from "@convex-dev/auth/svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import GithubIcon from "lucide-svelte/icons/github";
  import LogOutIcon from "lucide-svelte/icons/log-out";

  const { signOut } = useAuthActions();

  let { children } = $props();
</script>

<div class="flex flex-col min-h-screen bg-black text-white">
  <header class="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/50 backdrop-blur-xl">
    <div class="container flex h-14 items-center px-4 max-w-7xl mx-auto">
      <div class="flex items-center gap-2 font-bold font-mono tracking-tighter">
        <div class="h-6 w-6 rounded-md bg-white text-black flex items-center justify-center">S</div>
        ShipSense
      </div>
      
      <div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <nav class="flex items-center space-x-4">
          <a href="/dashboard" class="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Dashboard</a>
          <a href="/dashboard/connect" class="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Connect</a>
          <a href="/dashboard/settings" class="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Settings</a>
        </nav>
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" onclick={() => signOut({ redirectTo: "/" })} title="Log out">
            <LogOutIcon class="h-4 w-4 text-zinc-500 hover:text-white" />
          </Button>
        </div>
      </div>
    </div>
  </header>

  <main class="flex-1 container mx-auto p-4 max-w-7xl">
    {@render children()}
  </main>
</div>
