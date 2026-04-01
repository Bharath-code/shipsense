<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { CheckCircle, X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title = '',
		message = '',
		type = 'success',
		children
	}: {
		open?: boolean;
		title?: string;
		message?: string;
		type?: 'success' | 'info' | 'error';
		children?: Snippet;
	} = $props();

	function close() {
		open = false;
	}
</script>

{#if open}
	<div
		class="fixed right-6 bottom-6 z-50 max-w-sm"
		in:fly={{ y: 20, duration: 300 }}
		out:fade={{ duration: 200 }}
	>
		<div
			class="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f14]/95 p-4 shadow-2xl backdrop-blur-xl"
		>
			<!-- Glow effect -->
			<div
				class="absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl {type === 'success'
					? 'bg-emerald-500/30'
					: 'bg-violet-500/30'}"
			></div>

			<div class="relative flex items-start gap-3">
				<div
					class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl {type ===
					'success'
						? 'bg-emerald-500/20 text-emerald-400'
						: 'bg-violet-500/20 text-violet-400'}"
				>
					<CheckCircle class="h-5 w-5" />
				</div>

				<div class="flex-1">
					<h4 class="text-sm font-bold text-white">{title}</h4>
					<p class="mt-1 text-xs text-white/60">{message}</p>
					{#if children}
						<div class="mt-3">
							{@render children()}
						</div>
					{/if}
				</div>

				<button
					onclick={close}
					class="flex h-6 w-6 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white"
				>
					<X class="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	</div>
{/if}
