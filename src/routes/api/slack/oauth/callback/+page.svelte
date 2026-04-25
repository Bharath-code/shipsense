<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Loader2, Check, XCircle } from 'lucide-svelte';
	import { useAuth } from '@mmailaender/convex-auth-svelte/svelte';

	const client = useConvexClient();
	const auth = useAuth();

	let status = $state<'connecting' | 'success' | 'error'>('connecting');
	let message = $state('');

	onMount(async () => {
		const code = $page.url.searchParams.get('code');
		const state = $page.url.searchParams.get('state');
		const error = $page.url.searchParams.get('error');

		if (error) {
			status = 'error';
			message = `Slack authorization failed: ${error}`;
			return;
		}

		if (!code || !state) {
			status = 'error';
			message = 'Missing authorization parameters.';
			return;
		}

		// Wait for auth to be ready
		if (!auth.isAuthenticated) {
			// If not authenticated, we need to handle this case
			status = 'error';
			message = 'You must be signed in to connect Slack.';
			return;
		}

		try {
			const result = await client.mutation(api.slack.exchangeSlackCode, {
				code,
				userId: state as any
			});

			if (result.success) {
				status = 'success';
				message = `Connected to Slack${result.workspaceName ? ` — ${result.workspaceName}` : ''}`;
			} else {
				status = 'error';
				message = 'Failed to connect Slack.';
			}
		} catch (err: any) {
			status = 'error';
			message = err.message || 'Connection failed.';
		}
	});
</script>

<svelte:head>
	<title>Slack Connection — ShipSense</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
		{#if status === 'connecting'}
			<Loader2 class="mx-auto h-10 w-10 animate-spin text-primary" />
			<h1 class="mt-4 text-xl font-bold text-foreground">Connecting Slack...</h1>
			<p class="mt-2 text-sm text-muted-foreground">Hang tight — authorizing your workspace.</p>
		{:else if status === 'success'}
			<Check class="mx-auto h-10 w-10 text-emerald-500" />
			<h1 class="mt-4 text-xl font-bold text-emerald-500">Connected!</h1>
			<p class="mt-2 text-sm text-muted-foreground">{message}</p>
			<div class="mt-6 flex justify-center gap-3">
				<a href="/dashboard/settings" class="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
					Back to Settings
				</a>
				<a href="/dashboard" class="rounded-full border border-border px-6 py-2 text-sm font-semibold text-foreground hover:bg-muted">
					Go to Dashboard
				</a>
			</div>
		{:else}
			<XCircle class="mx-auto h-10 w-10 text-destructive" />
			<h1 class="mt-4 text-xl font-bold text-destructive">Connection Failed</h1>
			<p class="mt-2 text-sm text-muted-foreground">{message}</p>
			<div class="mt-6 flex justify-center gap-3">
				<a href="/dashboard/settings" class="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
					Back to Settings
				</a>
			</div>
		{/if}
	</div>
</div>
