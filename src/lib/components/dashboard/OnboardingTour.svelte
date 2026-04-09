<script lang="ts">
	import { browser } from '$app/environment';
	import {
		ArrowRight,
		X,
		ChevronLeft,
		Sparkles,
		GitBranch,
		BarChart3,
		CheckCircle
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let { open = $bindable(false), currentStep = $bindable(0) } = $props<{
		open?: boolean;
		currentStep?: number;
	}>();

	const TOUR_STORAGE_KEY = 'shipsense_tour_dismissed';

	const steps = [
		{
			title: 'Welcome to ShipSense',
			description:
				'Your AI-powered repository health tracker. Monitor code quality, track commit streaks, and get actionable insights — all in one place.',
			icon: Sparkles,
			cta: 'Get Started'
		},
		{
			title: 'Connect Your Repos',
			description:
				'Link any GitHub repository — public or private. ShipSense pulls metrics like stars, commits, issues, and PRs to build your health profile.',
			icon: GitBranch,
			cta: 'Next'
		},
		{
			title: 'Health Score Breakdown',
			description:
				'Each repo gets a 0-100 health score based on stars (35%), commits (25%), issues (20%), PRs (10%), and contributors (10%). Hover any metric to see the formula.',
			icon: BarChart3,
			cta: 'Next'
		},
		{
			title: 'Tasks & Insights',
			description:
				'AI generates actionable tasks and strategic recommendations to improve your repo health. Check off tasks as you complete them and watch your score climb.',
			icon: CheckCircle,
			cta: 'Start Exploring'
		}
	];

	let modalRef = $state<HTMLDivElement | null>(null);

	function next() {
		if (currentStep < steps.length - 1) {
			currentStep++;
		} else {
			closeTour();
		}
	}

	function prev() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function closeTour() {
		open = false;
		if (browser) {
			localStorage.setItem(TOUR_STORAGE_KEY, 'true');
		}
	}

	function skipTour() {
		closeTour();
	}

	// Focus trap: cycle Tab/Shift+Tab within the modal
	function handleKeydown(e: KeyboardEvent) {
		if (!modalRef) return;
		if (e.key === 'Escape') {
			closeTour();
			return;
		}
		if (e.key === 'ArrowRight') next();
		if (e.key === 'ArrowLeft') prev();

		if (e.key !== 'Tab') return;

		const focusable = modalRef.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onkeydown={handleKeydown}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
		aria-label="Onboarding tour"
	>
		<div
			bind:this={modalRef}
			class="relative mx-4 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-background p-8 shadow-2xl"
		>
			<!-- Close button -->
			<button
				type="button"
				onclick={closeTour}
				class="absolute top-4 right-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
				aria-label="Close tour"
			>
				<X class="h-4 w-4" />
			</button>

			<!-- Progress dots -->
			<div class="mb-6 flex items-center gap-2">
				{#each steps as _, i}
					<button
						type="button"
						onclick={() => (currentStep = i)}
						class="h-1.5 flex-1 rounded-full transition-all {i === currentStep
							? 'bg-primary'
							: i < currentStep
								? 'bg-primary/40'
								: 'bg-muted'}"
						aria-label="Go to step {i + 1}"
					></button>
				{/each}
			</div>

			<!-- Step content -->
			<div class="mb-8">
				<div
					class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
				>
					{#if steps[currentStep].icon}
						{@const Icon = steps[currentStep].icon}
						<Icon class="h-7 w-7" />
					{/if}
				</div>

				<h2 class="mb-3 text-2xl font-bold text-foreground">{steps[currentStep].title}</h2>
				<p class="text-base leading-relaxed text-muted-foreground">
					{steps[currentStep].description}
				</p>
			</div>

			<!-- Navigation -->
			<div class="flex items-center justify-between">
				<button
					type="button"
					onclick={skipTour}
					class="text-sm text-muted-foreground hover:text-foreground"
				>
					Skip tour
				</button>

				<div class="flex items-center gap-3">
					{#if currentStep > 0}
						<Button variant="ghost" size="sm" onclick={prev} class="gap-1">
							<ChevronLeft class="h-4 w-4" />
							Back
						</Button>
					{/if}

					<Button size="lg" onclick={next} class="gap-2">
						{steps[currentStep].cta}
						<ArrowRight class="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
