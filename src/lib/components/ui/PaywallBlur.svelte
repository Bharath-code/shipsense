<script lang="ts">
	import { Lock, Zap } from 'lucide-svelte';

	let {
		plan,
		feature = 'this feature',
		blurAmount = 8,
		children
	}: {
		plan: 'free' | 'indie' | 'builder';
		feature?: string;
		blurAmount?: number;
		children?: import('svelte').Snippet;
	} = $props();

	let isLocked = $derived(plan === 'free');
</script>

<div class="relative overflow-hidden rounded-[2rem]">
	<!-- The actual content (always rendered, blurred if locked) -->
	<div
		class="transition-all duration-300"
		style={isLocked ? `filter: blur(${blurAmount}px); pointer-events: none; user-select: none;` : ''}
		aria-hidden={isLocked}
	>
		{@render children?.()}
	</div>

	<!-- Paywall overlay -->
	{#if isLocked}
		<div
			class="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem] bg-background/60 backdrop-blur-[2px]"
			role="region"
			aria-label="Upgrade required to access {feature}"
		>
			<div class="mx-auto max-w-sm px-6 text-center">
				<div
					class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
				>
					<Lock class="h-6 w-6 text-primary" />
				</div>

				<h3 class="text-lg font-black text-foreground">Upgrade to unlock</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					<span class="font-medium text-foreground capitalize">{feature}</span> is available on the
					<span class="font-semibold text-primary">Indie</span> plan and above.
				</p>

				<a
					href="/dashboard/settings#billing"
					class="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
				>
					<Zap class="h-4 w-4" />
					Upgrade — $9/mo
				</a>

				<p class="mt-3 text-xs text-muted-foreground">Cancel anytime · No setup fees</p>
			</div>
		</div>
	{/if}
</div>
