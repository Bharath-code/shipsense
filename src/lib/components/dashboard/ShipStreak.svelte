<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { Card, CardHeader, CardTitle, CardContent } from "$lib/components/ui/card";
  import { Flame, Calendar, Trophy, Zap, AlertCircle } from "lucide-svelte";
  import { badgeVariants } from "$lib/components/ui/badge";

  let { repoId } = $props<{ repoId: string }>();

  // Use raw context repoId
  const streakQuery = useQuery(api.dashboard.getRepoStreak, () => ({ repoId: repoId as any }));
  
  let streak = $derived(streakQuery.data);
  let isLoading = $derived(streakQuery.isLoading);

  // Derive status message based on streak
  let streakStatus = $derived(() => {
    if (!streak || streak.currentStreak === 0) return {
      text: "Streak inactive",
      color: "text-zinc-500",
      bg: "bg-zinc-900/50 text-zinc-400 mt-2",
      icon: AlertCircle
    };
    
    if (streak.currentStreak < 3) return {
      text: "Building momentum",
      color: "text-amber-500",
      bg: "bg-amber-500/10 text-amber-500 border-amber-500/20 mt-2",
      icon: Zap
    };
    
    if (streak.currentStreak >= 3 && streak.currentStreak < 7) return {
      text: "Hot streak!",
      color: "text-orange-500",
      bg: "bg-orange-500/10 text-orange-500 border-orange-500/20 mt-2",
      icon: Flame
    };
    
    return {
      text: "Unstoppable!",
      color: "text-rose-500",
      bg: "bg-rose-500/10 text-rose-500 border-rose-500/20 mt-2",
      icon: Flame
    };
  });
</script>

<Card class="border-zinc-800 bg-zinc-950 shadow-md">
  <CardContent class="p-6">
    {#if isLoading}
      <div class="h-full flex items-center justify-center py-6 animate-pulse space-y-4 flex-col">
        <div class="h-16 w-16 rounded-full bg-zinc-800/50"></div>
        <div class="h-4 w-24 bg-zinc-800/50 rounded"></div>
      </div>
    {:else if !streak}
      <div class="flex flex-col items-center justify-center text-center py-4 space-y-3">
        <div class="h-14 w-14 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-600">
          <Flame class="h-6 w-6" />
        </div>
        <div>
          <h3 class="font-medium text-zinc-400">No streak data</h3>
          <p class="text-xs text-zinc-500 mt-1">Make a commit to start tracking.</p>
        </div>
      </div>
    {:else}
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        
        <!-- Main Streak Readout -->
        <div class="flex flex-col items-center justify-center">
          <div class="relative group">
            <div class="absolute inset-0 bg-rose-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class={`h-24 w-24 rounded-full border-4 flex flex-col items-center justify-center z-10 relative bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors duration-300 ${streak.currentStreak > 0 ? 'border-rose-500' : 'border-zinc-800'}`}>
              <span class="text-3xl font-black bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">{streak.currentStreak}</span>
              <span class="text-[10px] text-zinc-500 font-semibold tracking-wider hover:text-rose-400 transition-colors uppercase">Days</span>
            </div>
            
            {#if streak.currentStreak > 0}
              <div class="absolute -top-2 -right-2 bg-zinc-900 rounded-full border border-zinc-800 p-1.5 shadow-lg">
                <Flame class={`h-4 w-4 ${streakStatus().color} animate-pulse`} fill={streak.currentStreak > 2 ? 'currentColor' : 'none'} />
              </div>
            {/if}
          </div>
          
          <div class={`px-3 py-1 text-xs font-semibold rounded-full border ${streakStatus().bg} inline-flex items-center gap-1.5`}>
            {#if streakStatus().text === 'Streak inactive'}
              <AlertCircle class="h-3 w-3" />
            {:else if streakStatus().text === 'Building momentum'}
              <Zap class="h-3 w-3" />
            {:else}
              <Flame class="h-3 w-3" />
            {/if}
            {streakStatus().text}
          </div>
        </div>
        
        <!-- Vertical Divider -->
        <div class="hidden md:block w-px h-24 bg-zinc-800/80"></div>
        <div class="md:hidden h-px w-full bg-zinc-800/80"></div>
        
        <!-- Details -->
        <div class="flex-1 w-full space-y-4">
          <div class="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-800/50">
            <div>
              <p class="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 mb-1">
                <Trophy class="h-3 w-3 text-amber-500" />
                Longest
              </p>
              <p class="text-xl font-bold text-zinc-200">{streak.longestStreak} <span class="text-xs font-normal text-zinc-500">days</span></p>
            </div>
            
            <div>
              <p class="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 mb-1">
                <Calendar class="h-3 w-3 text-indigo-400" />
                Last Commit
              </p>
              <p class="text-sm font-medium text-zinc-300 truncate" title={streak.lastCommitDate}>{streak.lastCommitDate || 'Never'}</p>
            </div>
          </div>
          
          <div class="pt-1">
            <p class="text-xs text-zinc-400 leading-relaxed">
              {#if streak.currentStreak > 0}
                You're building momentum! Keep pushing daily to maintain your active streak.
              {:else}
                Your streak has reset. Don't worry, every legendary developer starts from day one.
              {/if}
            </p>
          </div>
        </div>
        
      </div>
    {/if}
  </CardContent>
</Card>
