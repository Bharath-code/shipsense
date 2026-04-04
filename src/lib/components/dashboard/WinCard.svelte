<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { PartyPopper, Trophy, Flame, TrendingUp, Users, Star } from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	const growthMomentsQuery = useQuery(api.dashboard.getRepoGrowthMoments, () => ({ repoId }));
	let growthMoments = $derived(growthMomentsQuery.data ?? []);
	let isLoading = $derived(growthMomentsQuery.isLoading);

	function iconFor(kind: string) {
		if (kind === 'streak_milestone' || kind === 'longest_streak') return Flame;
		if (kind === 'best_week' || kind === 'best_month') return TrendingUp;
		if (kind === 'contributor_milestone') return Users;
		if (kind === 'momentum_recovered') return Trophy;
		return Star;
	}

	function colorFor(kind: string): string {
		if (kind.includes('streak')) return 'from-orange-500/20 to-amber-500/20';
		if (kind === 'best_week' || kind === 'best_month') return 'from-green-500/20 to-emerald-500/20';
		if (kind === 'contributor_milestone') return 'from-purple-500/20 to-pink-500/20';
		return 'from-yellow-500/20 to-amber-500/20';
	}
</script>

{#if !isLoading && growthMoments.length > 0}
	<div class="overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm">
		<div class="relative overflow-hidden">
			<div
				class="absolute inset-0 bg-gradient-to-br {colorFor(growthMoments[0].kind)} opacity-50"
			></div>
			<div class="relative p-6">
				<div class="mb-4 flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
						<PartyPopper class="h-5 w-5 text-success" />
					</div>
					<div>
						<h3 class="font-semibold text-foreground">Recent Wins</h3>
						<p class="text-xs text-muted-foreground">Milestones and achievements</p>
					</div>
				</div>

				<div class="space-y-3">
					{#each growthMoments.slice(0, 3) as moment}
						{@const Icon = iconFor(moment.kind)}
						<div
							class="flex items-start gap-3 rounded-lg border border-border/30 bg-background/40 p-3"
						>
							<div
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10"
							>
								<Icon class="h-4 w-4 text-success" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-foreground">{moment.title}</p>
								<p class="mt-1 text-xs text-muted-foreground">{moment.description}</p>
							</div>
							{#if moment.metric}
								<span
									class="shrink-0 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success"
								>
									{moment.metric}
									{#if moment.kind.includes('streak')}d{/if}
									{#if moment.kind === 'contributor_milestone'}👥{/if}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
