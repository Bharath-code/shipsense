<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Flame, Calendar, Trophy, Zap, AlertCircle, Snowflake } from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	// Use raw context repoId
	const streakQuery = useQuery(api.dashboard.getRepoStreak, () => ({ repoId: repoId as any }));

	let streak = $derived(streakQuery.data);
	let isLoading = $derived(streakQuery.isLoading);
	let hasHistory = $derived(!!streak?.lastCommitDate);
	let currentStreak = $derived(streak?.currentStreak ?? 0);
	let longestStreak = $derived(streak?.longestStreak ?? 0);
	let lastCommitDate = $derived(streak?.lastCommitDate ?? null);

	function getDaysSince(dateString: string | undefined) {
		if (!dateString) return null;

		const today = new Date();
		const targetDate = new Date(dateString);

		today.setUTCHours(0, 0, 0, 0);
		targetDate.setUTCHours(0, 0, 0, 0);

		return Math.round((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
	}

	let daysSinceLastShip = $derived(getDaysSince(lastCommitDate ?? undefined));
	let streakHeadline = $derived(() => {
		if (!hasHistory) return 'No commitment history';
		if (currentStreak > 0) return 'Shipping streak active';
		return 'Streak cooled off';
	});

	// Derive status message based on streak
	let streakStatus = $derived(() => {
		if (!streak || !hasHistory)
			return {
				text: 'No streak yet',
				color: 'text-muted-foreground',
				bg: 'bg-muted text-muted-foreground mt-2',
				icon: AlertCircle
			};

		if (currentStreak === 0)
			return {
				text:
					daysSinceLastShip === null
						? 'Inactive'
						: daysSinceLastShip === 0
							? 'Awaiting next sync'
							: `Last shipped ${daysSinceLastShip}d ago`,
				color: 'text-muted-foreground',
				bg: 'bg-muted text-muted-foreground mt-2',
				icon: Snowflake
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

<div class="group overflow-hidden rounded-[2rem] glass-panel border-white/10 p-8 shadow-2xl">
	{#if isLoading}
		<div class="flex h-full animate-pulse flex-col items-center justify-center space-y-6 py-8">
			<div class="h-24 w-24 rounded-full bg-white/10"></div>
			<div class="h-4 w-32 rounded-full bg-white/10"></div>
		</div>
	{:else if !hasHistory}
		<div class="flex flex-col items-center justify-center space-y-4 py-8 text-center">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-muted text-muted-foreground"
			>
				<Flame class="h-8 w-8" />
			</div>
			<div>
				<h3 class="text-xl font-bold text-foreground">{streakHeadline()}</h3>
				<p class="mt-1 text-sm text-muted-foreground">Push code to ignite your streak.</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-between gap-10 lg:flex-row">
			<!-- Main Streak Readout -->
			<div class="flex flex-col items-center justify-center space-y-4">
				<div class="relative">
					<!-- Radial Glow -->
					<div
						class="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100"
					></div>

					<div
						class={`relative z-10 flex h-32 w-32 scale-100 flex-col items-center justify-center rounded-full border-4 bg-muted shadow-2xl transition-all duration-500 group-hover:scale-105 ${
							currentStreak > 0
								? 'border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]'
								: 'border-white/10 opacity-75'
						}`}
					>
						<span
							class="bg-gradient-to-br from-white to-white/40 bg-clip-text text-5xl leading-none font-black text-transparent"
						>
							{currentStreak}
						</span>
						<span
							class="mt-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
						>
							Days
						</span>
					</div>

					{#if currentStreak > 0}
						<div
							class="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-background shadow-xl"
						>
							<Flame
								class={`h-6 w-6 ${streakStatus().color} animate-pulse`}
								fill={currentStreak > 2 ? 'currentColor' : 'none'}
							/>
						</div>
					{:else}
						<div
							class="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-background shadow-xl"
						>
							<Snowflake class={`h-5 w-5 ${streakStatus().color}`} />
						</div>
					{/if}
				</div>

				<h3 class="text-lg font-bold text-foreground">{streakHeadline()}</h3>

				<div
					class={`rounded-full border px-4 py-1.5 text-xs font-bold tracking-tight shadow-lg ${
						streakStatus().bg
					} flex items-center gap-2`}
				>
					{#if streakStatus().icon}
						{@const StatusIcon = streakStatus().icon}
						<StatusIcon class="h-3.5 w-3.5 shrink-0" />
					{/if}
					{streakStatus().text}
				</div>
			</div>

			<!-- Divider -->
			<div class="hidden h-32 w-px bg-white/10 lg:block"></div>
			<div class="h-px w-full bg-white/10 lg:hidden"></div>

			<!-- Details -->
			<div class="w-full flex-1 space-y-6 text-center lg:text-left">
				<div class="grid grid-cols-2 gap-6">
					<div class="space-y-2">
						<p
							class="flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase lg:justify-start"
						>
							<Trophy class="h-3 w-3 text-warning/60" /> Hall of Fame
						</p>
						<p class="text-3xl font-black text-foreground">
							{longestStreak}
							<span class="text-sm font-medium tracking-normal text-muted-foreground">days</span>
						</p>
					</div>

					<div class="space-y-2">
						<p
							class="flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase lg:justify-start"
						>
							<Calendar class="h-3 w-3 text-primary/60" /> Last Ship
						</p>
						<p
							class="truncate text-base font-bold text-foreground"
							title={lastCommitDate || 'Never'}
						>
							{lastCommitDate || 'Never'}
						</p>
					</div>
				</div>

				<p class="text-sm leading-relaxed text-muted-foreground/80 italic">
					{#if currentStreak > 0}
						"The momentum is real. Every commit is a brick in your legacy."
					{:else if daysSinceLastShip === 0}
						"Your latest ship is in. The next sync will relight the streak."
					{:else if daysSinceLastShip === 1}
						"You're one ship away from getting the streak back on track."
					{:else}
						"A fresh start is just an opportunity to build something stronger."
					{/if}
				</p>
			</div>
		</div>
	{/if}
</div>
