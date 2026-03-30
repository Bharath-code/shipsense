<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Flame, Calendar, Trophy, Zap, AlertCircle } from 'lucide-svelte';
	import { badgeVariants } from '$lib/components/ui/badge';

	let { repoId } = $props<{ repoId: string }>();

	// Use raw context repoId
	const streakQuery = useQuery(api.dashboard.getRepoStreak, () => ({ repoId: repoId as any }));

	let streak = $derived(streakQuery.data);
	let isLoading = $derived(streakQuery.isLoading);

	// Derive status message based on streak
	let streakStatus = $derived(() => {
		if (!streak || streak.currentStreak === 0)
			return {
				text: 'Streak inactive',
				color: 'text-muted-foreground',
				bg: 'bg-muted text-muted-foreground mt-2',
				icon: AlertCircle
			};

		if (streak.currentStreak < 3)
			return {
				text: 'Building momentum',
				color: 'text-warning',
				bg: 'bg-warning/10 text-warning border-warning/20 mt-2',
				icon: Zap
			};

		if (streak.currentStreak >= 3 && streak.currentStreak < 7)
			return {
				text: 'Hot streak!',
				color: 'text-warning',
				bg: 'bg-warning/10 text-warning border-warning/20 mt-2',
				icon: Flame
			};

		return {
			text: 'Unstoppable!',
			color: 'text-destructive',
			bg: 'bg-destructive/10 text-destructive border-destructive/20 mt-2',
			icon: Flame
		};
	});
</script>

<Card class="border-border bg-card shadow-sm transition-colors">
	<CardContent class="p-6">
		{#if isLoading}
			<div class="flex h-full animate-pulse flex-col items-center justify-center space-y-4 py-6">
				<div class="h-16 w-16 rounded-full bg-muted"></div>
				<div class="h-4 w-24 rounded bg-muted"></div>
			</div>
		{:else if !streak}
			<div class="flex flex-col items-center justify-center space-y-3 py-4 text-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground"
				>
					<Flame class="h-6 w-6" />
				</div>
				<div>
					<h3 class="font-medium text-muted-foreground">No streak data</h3>
					<p class="mt-1 text-xs text-muted-foreground/60">Make a commit to start tracking.</p>
				</div>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
				<!-- Main Streak Readout -->
				<div class="flex flex-col items-center justify-center">
					<div class="group relative">
						<div
							class="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
						></div>
						<div
							class={`relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 bg-card shadow-sm transition-colors duration-300 ${streak.currentStreak > 0 ? 'border-primary' : 'border-border'}`}
						>
							<span
								class="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-3xl font-black text-transparent"
								>{streak.currentStreak}</span
							>
							<span
								class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-primary"
								>Days</span
							>
						</div>

						{#if streak.currentStreak > 0}
							<div
								class="absolute -top-2 -right-2 rounded-full border border-border bg-card p-1.5 shadow-lg"
							>
								<Flame
									class={`h-4 w-4 ${streakStatus().color} animate-pulse`}
									fill={streak.currentStreak > 2 ? 'currentColor' : 'none'}
								/>
							</div>
						{/if}
					</div>

					<div
						class={`rounded-full border px-3 py-1 text-xs font-semibold ${streakStatus().bg} inline-flex items-center gap-1.5`}
					>
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
				<div class="hidden h-24 w-px bg-border md:block"></div>
				<div class="h-px w-full bg-border md:hidden"></div>

				<!-- Details -->
				<div class="w-full flex-1 space-y-4">
					<div class="grid grid-cols-2 gap-3 border-b border-border pb-3">
						<div>
							<p
								class="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
							>
								<Trophy class="h-3 w-3 text-primary" />
								Longest
							</p>
							<p class="text-xl font-bold text-foreground">
								{streak.longestStreak}
								<span class="text-xs font-normal text-muted-foreground">days</span>
							</p>
						</div>

						<div>
							<p
								class="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
							>
								<Calendar class="h-3 w-3 text-primary" />
								Last Commit
							</p>
							<p class="truncate text-sm font-medium text-foreground" title={streak.lastCommitDate}>
								{streak.lastCommitDate || 'Never'}
							</p>
						</div>
					</div>

					<div class="pt-1">
						<p class="text-xs leading-relaxed text-muted-foreground">
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
