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
    <p class="text-muted-foreground mt-2">Select the GitHub repositories you want ShipSense to track and monitor.</p>
  </div>

  {#if connectError}
    <div class="bg-destructive/10 border border-destructive/50 text-destructive p-4 rounded-md">
      {connectError}
    </div>
  {/if}

  <div class="flex items-center space-x-2">
    <div class="relative flex-1 max-w-sm">
      <SearchIcon class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Filter repositories..."
        bind:value={searchQuery}
        class="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
    <Button variant="outline" onclick={loadGithubRepos} disabled={loadingGithub}>
      {loadingGithub ? "Refreshing..." : "Refresh list"}
    </Button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#if loadingGithub && githubRepos.length === 0}
      <Card class="border-border bg-muted/20">
        <CardContent class="p-6 flex justify-center text-muted-foreground italic">
          Loading repositories from GitHub...
        </CardContent>
      </Card>
    {:else if filteredRepos.length === 0}
      <Card class="border-border bg-muted/20">
        <CardContent class="p-6 flex justify-center text-muted-foreground italic">
          No repositories found.
        </CardContent>
      </Card>
    {:else}
      {#each filteredRepos as repo}
        <Card class="border-border bg-card flex flex-col hover:border-primary/50 transition-colors">
          <CardHeader class="pb-2">
            <div class="flex justify-between items-start">
              <CardTitle class="text-base font-semibold truncate text-foreground">
                {repo.name}
              </CardTitle>
              {#if repo.isPrivate}
                <Badge variant="outline" class="text-xs border-border bg-muted text-muted-foreground">Private</Badge>
              {:else}
                <Badge variant="outline" class="text-xs border-border text-muted-foreground">Public</Badge>
              {/if}
            </div>
            <CardDescription class="text-xs line-clamp-2 min-h-[2rem]">
              {repo.description || "No description provided."}
            </CardDescription>
          </CardHeader>
          <CardContent class="pb-4 flex-1">
            <div class="flex items-center gap-4 text-xs text-muted-foreground/80">
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
              <Button disabled class="w-full bg-muted text-muted-foreground">Connected</Button>
            {:else}
              <Button onclick={() => connectRepo(repo)} class="w-full bg-primary text-primary-foreground hover:bg-primary/90">Connect</Button>
            {/if}
          </div>
        </Card>
      {/each}
    {/if}
  </div>
</div>
