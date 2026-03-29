<script lang="ts">
  import { useAuth } from "@mmailaender/convex-auth-svelte/svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "$lib/components/ui/card";

  const { signIn } = useAuth();
  let loading = $state(false);

  async function handleLogin() {
    loading = true;
    try {
      await signIn("github", { redirectTo: "/dashboard" });
    } catch (err) {
      console.error(err);
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login | ShipSense</title>
</svelte:head>

<div class="flex items-center justify-center min-h-screen p-4 bg-black">
  <Card class="w-full max-w-sm border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
    <CardHeader class="text-center">
      <CardTitle class="text-2xl font-bold tracking-tight text-white">ShipSense</CardTitle>
      <CardDescription class="text-zinc-400">Sign in to track your repo growth</CardDescription>
    </CardHeader>
    <CardContent>
      <Button 
        onclick={handleLogin}
        disabled={loading}
        class="w-full bg-white text-black hover:bg-zinc-200 transition-colors"
      >
        <svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.696 1.027 1.59 1.027 2.683 0 3.842-2.337 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
        </svg>
        {loading ? "Connecting..." : "Continue with GitHub"}
      </Button>
      <p class="mt-4 text-xs text-center text-zinc-500">
        By continuing, you grant read access to your public repositories.
      </p>
    </CardContent>
  </Card>
</div>
