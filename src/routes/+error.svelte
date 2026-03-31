<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';

	let { error } = $props<{ error: App.Error }>();

	let message = $derived(error?.message || 'Something went wrong');
	let status = $derived(error?.status || 500);
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
	<div class="max-w-md space-y-6">
		<div class="space-y-2">
			<h1 class="text-6xl font-black text-foreground">{status}</h1>
			<h2 class="text-2xl font-bold text-foreground">{message}</h2>
		</div>

		<p class="text-muted-foreground">
			{#if status === 404}
				The page you're looking for doesn't exist or has been moved.
			{:else if status === 403}
				You don't have permission to access this resource.
			{:else if status === 500}
				Something went wrong on our end. Please try again later.
			{:else}
				An error occurred while loading this page.
			{/if}
		</p>

		<div class="flex gap-4">
			<Button href="/dashboard">Go to Dashboard</Button>
			<Button variant="outline" onclick={() => window.history.back()}>Go Back</Button>
		</div>
	</div>
</div>
