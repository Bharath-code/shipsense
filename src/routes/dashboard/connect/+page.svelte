<script lang="ts">
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Star as StarIcon, GitFork as GitForkIcon, Search as SearchIcon } from "lucide-svelte";

  // Data fetching
  const activeReposQuery = useQuery(api.repos.listMyRepos, {});
  const client = useConvexClient();

  let githubRepos = $state<any[]>([]);
  let loadingGithub = $state(false);
  let searchQuery = $state("");
  let connectError = $state<string | null>(null);

  async function loadGithubRepos() {
    loadingGithub = true;
    connectError = null;
    try {
      githubRepos = (await client.action(api.github.fetchUserReposFromGithub, {})) || [];
    } catch (err: any) {
      console.error(err);
      connectError = err.message || "Failed to fetch repositories";
    } finally {
      loadingGithub = false;
    }
  }

  async function connectRepo(repo: any) {
    try {
      await client.mutation(api.repos.connectRepo, {
        githubRepoId: repo.githubRepoId,
        owner: repo.owner,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        language: repo.language,
        starsCount: repo.starsCount,
        forksCount: repo.forksCount,
        isPrivate: repo.isPrivate,
      });
      // Optionally show a success toast here
    } catch (err: any) {
      console.error(err);
      connectError = err.message;
    }
  }

  // Load right away or let user click
  $effect(() => {
    loadGithubRepos();
  });

  let filteredRepos = $derived(
    githubRepos.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  let activeRepoIds = $derived(activeReposQuery.data?.map((r: any) => r.githubRepoId) || []);
</script>

<svelte:head>
  <title>Connect Repo | ShipSense</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Connect Repository</h1>
    <p class="text-zinc-400 mt-2">Select the GitHub repositories you want ShipSense to track and monitor.</p>
  </div>

  {#if connectError}
    <div class="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-md">
      {connectError}
    </div>
  {/if}

  <div class="flex items-center space-x-2">
    <div class="relative flex-1 max-w-sm">
      <SearchIcon class="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
      <Input
        type="text"
        placeholder="Filter repositories..."
        bind:value={searchQuery}
        class="pl-9 bg-zinc-900 border-zinc-800"
      />
    </div>
    <Button variant="outline" onclick={loadGithubRepos} disabled={loadingGithub}>
      {loadingGithub ? "Refreshing..." : "Refresh list"}
    </Button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#if loadingGithub && githubRepos.length === 0}
      <Card class="border-zinc-800 bg-zinc-900/50">
        <CardContent class="p-6 flex justify-center text-zinc-500">
          Loading repositories from GitHub...
        </CardContent>
      </Card>
    {:else if filteredRepos.length === 0}
      <Card class="border-zinc-800 bg-zinc-900/50">
        <CardContent class="p-6 flex justify-center text-zinc-500">
          No repositories found.
        </CardContent>
      </Card>
    {:else}
      {#each filteredRepos as repo}
        <Card class="border-zinc-800 bg-zinc-950 flex flex-col">
          <CardHeader class="pb-2">
            <div class="flex justify-between items-start">
              <CardTitle class="text-base font-semibold truncate hover:text-white text-zinc-200">
                {repo.name}
              </CardTitle>
              {#if repo.isPrivate}
                <Badge variant="outline" class="text-xs border-zinc-700 bg-zinc-800 text-zinc-300">Private</Badge>
              {:else}
                <Badge variant="outline" class="text-xs border-zinc-700 text-zinc-400">Public</Badge>
              {/if}
            </div>
            <CardDescription class="text-xs line-clamp-2 min-h-[2rem]">
              {repo.description || "No description provided."}
            </CardDescription>
          </CardHeader>
          <CardContent class="pb-4 flex-1">
            <div class="flex items-center gap-4 text-xs text-zinc-500">
              {#if repo.language}
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                  {repo.language}
                </div>
              {/if}
              <div class="flex items-center gap-1"><StarIcon class="w-3 h-3" /> {repo.starsCount}</div>
              <div class="flex items-center gap-1"><GitForkIcon class="w-3 h-3" /> {repo.forksCount}</div>
            </div>
          </CardContent>
          <div class="p-4 pt-0 mt-auto">
            {#if activeRepoIds.includes(repo.githubRepoId)}
              <Button disabled class="w-full bg-zinc-800 text-zinc-400">Connected</Button>
            {:else}
              <Button onclick={() => connectRepo(repo)} class="w-full bg-white text-black hover:bg-zinc-200">Connect</Button>
            {/if}
          </div>
        </Card>
      {/each}
    {/if}
  </div>
</div>
