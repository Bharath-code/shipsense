<script lang="ts">
	let {
		children,
		fallback = undefined
	}: {
		children?: import('svelte').Snippet;
		fallback?: import('svelte').Snippet;
	} = $props();

	let hasError = $state(false);
	let errorMessage = $state('');

	function handleError() {
		hasError = true;
		errorMessage = 'Something went wrong. Please try again.';
	}

	function reset() {
		hasError = false;
		errorMessage = '';
	}
</script>

{#if hasError}
	{#if fallback}
		{@render fallback()}
	{:else}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center"
			role="alert"
		>
			<p class="mb-4 font-medium text-destructive">{errorMessage}</p>
			<button
				class="rounded-full bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
				onclick={reset}
			>
				Try Again
			</button>
		</div>
	{/if}
{:else if children}
	{@render children()}
{/if}
