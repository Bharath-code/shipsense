<script lang="ts">
  import { useAuthActions } from "@convex-dev/auth/svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "$lib/components/ui/card";
  import GithubIcon from "lucide-svelte/icons/github";

  const { signIn } = useAuthActions();

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
        <GithubIcon class="mr-2 h-4 w-4" />
        {loading ? "Connecting..." : "Continue with GitHub"}
      </Button>
      <p class="mt-4 text-xs text-center text-zinc-500">
        By continuing, you grant read access to your public repositories.
      </p>
    </CardContent>
  </Card>
</div>
