<script lang="ts">
	import { Loader2, Sparkles, Zap } from 'lucide-svelte';

	interface Props {
		healthScore: number;
		repoName: string;
	}

	let { healthScore, repoName }: Props = $props();

	function scoreTone(score: number): string {
		if (score >= 75) return 'text-emerald-400';
		if (score >= 50) return 'text-amber-400';
		return 'text-rose-400';
	}
</script>

<div class="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
	<!-- Subtle animated gradient behind -->
	<div
		class="pointer-events-none absolute inset-0 opacity-20"
		style="background: radial-gradient(circle at 20% 50%, rgba(59,130,246,0.15), transparent 60%);"
	></div>

	<div class="relative flex items-start justify-between">
		<div>
			<div class="flex items-center gap-2">
				<Zap class="h-4 w-4 text-primary" />
				<p class="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
					Instant Estimate
				</p>
			</div>

			<p class="mt-3 text-4xl font-black {scoreTone(healthScore)}">
				{healthScore}<span class="text-lg font-semibold text-muted-foreground">/100</span>
			</p>

			<p class="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
				Quick scan of <strong class="text-foreground">{repoName}</strong> based on public GitHub
				data. We're now running the full analysis — scores, tasks, and insights will appear in a
				few seconds.
			</p>
		</div>

		<div class="flex flex-col items-end gap-2">
			<span class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
				<Loader2 class="h-3 w-3 animate-spin" />
				Analyzing
			</span>
		</div>
	</div>

	<!-- Progress dots -->
	<div class="relative mt-5 flex items-center gap-3">
		<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
			<div
				class="h-full w-2/3 rounded-full bg-primary/60"
				style="animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"
			></div>
		</div>
		<span class="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
			<Sparkles class="mr-1 inline h-3 w-3" />
			Full sync in progress
		</span>
	</div>
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>
