<script lang="ts">
	import { useAuth } from '@mmailaender/convex-auth-svelte/svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';

	const { signIn } = useAuth();
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleLogin() {
		if (loading) return;
		loading = true;
		error = null;

		try {
			await signIn('github', { redirectTo: '/dashboard' });
		} catch (err) {
			console.error('Sign in error:', err);
			const msg = err instanceof Error ? err.message : String(err);
			// Show a user-friendly error
			if (msg.toLowerCase().includes('popup')) {
				error = 'Popup was blocked. Please allow popups and try again.';
			} else {
				error = 'Sign in failed. Please try again.';
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login | ShipSense</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-background p-4 transition-colors duration-300"
>
	<Card class="w-full max-w-sm border-border bg-card/50 backdrop-blur-xl">
		<CardHeader class="text-center">
			<div
				class="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground"
			>
				S
			</div>
			<CardTitle class="text-2xl font-bold tracking-tight text-foreground">ShipSense</CardTitle>
			<CardDescription class="text-muted-foreground"
				>Sign in to track your repo growth</CardDescription
			>
		</CardHeader>
		<CardContent class="space-y-3">
			{#if error}
				<div
					class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{error}
				</div>
			{/if}

			<Button
				onclick={handleLogin}
				disabled={loading}
				class="w-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
			>
				{#if loading}
					<svg
						class="mr-2 h-4 w-4 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						></path>
					</svg>
					Connecting...
				{:else}
					<svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.696 1.027 1.59 1.027 2.683 0 3.842-2.337 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
							clip-rule="evenodd"
						/>
					</svg>
					Continue with GitHub
				{/if}
			</Button>

			<div class="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-left">
				<p class="text-[11px] font-semibold tracking-wide text-foreground/80 uppercase">
					GitHub Access
				</p>
				<div class="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
					<p>Profile and email</p>
					<p>Repository metadata for connected repositories</p>
					<p>Private repository access only if you choose to connect private repos</p>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
