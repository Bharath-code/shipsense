<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';

	let { error } = $props<{ error: App.Error }>();

	let message = $derived(error?.message || 'Authentication error');
	let status = $derived(error?.status || 500);
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
	<div class="max-w-md space-y-6">
		<div class="space-y-2">
			<h1 class="text-4xl font-black text-foreground">Auth Error</h1>
			<p class="text-lg text-muted-foreground">{message}</p>
		</div>

		<Button href="/auth/login">Go to Login</Button>
	</div>
</div>
