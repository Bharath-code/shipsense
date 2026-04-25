<script lang="ts">
	import { Sparkles, X, Check, BarChart3, GitCommit, MessageSquare, GitPullRequest, Users } from 'lucide-svelte';

	interface ScoreAxis {
		name: string;
		weight: string;
		icon: typeof BarChart3;
		description: string;
	}

	const scoreAxes: ScoreAxis[] = [
		{
			name: 'Stars',
			weight: '35%',
			icon: Sparkles,
			description: 'Growth rate and total stars. Logarithmic scale — each additional star matters less.'
		},
		{
			name: 'Commits',
			weight: '25%',
			icon: GitCommit,
			description: 'Recent commit activity and consistency. Rewards steady shipping.'
		},
		{
			name: 'Issues',
			weight: '20%',
			icon: MessageSquare,
			description: 'Issue resolution rate and open/closed ratio. Active triage boosts score.'
		},
		{
			name: 'Pull Requests',
			weight: '10%',
			icon: GitPullRequest,
			description: 'PR velocity and merge rate. Shows collaboration health.'
		},
		{
			name: 'Contributors',
			weight: '10%',
			icon: Users,
			description: 'Number of active contributors. Community growth signal.'
		}
	];

	let { open = false } = $props();
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		onclick={() => open = false}
		role="dialog"
		aria-modal="true"
		aria-label="How health score is calculated"
	>
		<!-- Modal -->
		<div
			class="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
				<h2 class="text-xl font-bold tracking-tight">How Health Score Works</h2>
				<button
					type="button"
					onclick={() => open = false}
					class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Content -->
			<div class="px-6 py-6">
				<p class="mb-6 text-muted-foreground">
					ShipScore combines 5 signals into a single 0–100 score. Each axis uses a carefully tuned curve so repos of all sizes get meaningful scores — not just popular ones.
				</p>

				<!-- Score Axes -->
				<div class="space-y-4">
					{#each scoreAxes as axis}
						<div class="rounded-2xl border border-border bg-muted/30 p-4">
							<div class="mb-2 flex items-center gap-3">
								<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<axis.icon size={18} />
								</div>
								<div class="flex flex-1 items-center justify-between">
									<h3 class="font-semibold">{axis.name}</h3>
									<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{axis.weight}</span>
								</div>
							</div>
							<p class="text-sm text-muted-foreground">{axis.description}</p>
						</div>
					{/each}
				</div>

				<!-- Trend & Momentum -->
				<div class="mt-8 rounded-2xl border border-border bg-muted/30 p-4">
					<h3 class="mb-2 font-semibold">Trend Detection</h3>
					<p class="text-sm text-muted-foreground">
						Scores are compared week-over-week using actual time windows (not record counts). A repo that went from 40 → 55 is "Accelerating." One that went from 70 → 65 is "Coasting."
					</p>
				</div>

				<div class="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
					<h3 class="mb-2 font-semibold">Letter Grades</h3>
					<p class="text-sm text-muted-foreground">
						Scores map to familiar letter grades: A (90–100), B (80–89), C (70–79), D (60–69), F (below 60). Plus/minus modifiers provide finer granularity.
					</p>
				</div>

				<!-- Transparency Note -->
				<div class="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
					<div class="flex items-start gap-2">
						<Check size={16} class="mt-0.5 shrink-0 text-primary" />
						<div>
							<p class="text-sm font-semibold text-foreground">Transparent & Reproducible</p>
							<p class="text-sm text-muted-foreground">
								No black-box AI scoring. Every point is calculated from public GitHub data using deterministic formulas. You can audit exactly how your score is computed.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
