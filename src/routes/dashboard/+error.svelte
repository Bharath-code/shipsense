<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';

	let { error } = $props<{ error: App.Error }>();

	let message = $derived(error?.message || 'Dashboard error');
	let status = $derived(error?.status || 500);
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
	<div class="max-w-md space-y-6">
		<div class="space-y-2">
			<h1 class="text-4xl font-black text-foreground">Dashboard Error</h1>
			<p class="text-lg text-muted-foreground">{message}</p>
		</div>

		<div class="flex gap-4">
			<Button href="/dashboard">Back to Dashboard</Button>
			<Button variant="outline" onclick={() => window.location.reload()}>Refresh</Button>
		</div>
	</div>
</div>
