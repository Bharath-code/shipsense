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
	<style>
		@keyframes auth-drift {
			0%,
			100% {
				transform: translate3d(0, 0, 0) scale(1);
			}
			50% {
				transform: translate3d(0, -18px, 0) scale(1.03);
			}
		}

		@keyframes auth-pulse {
			0%,
			100% {
				opacity: 0.35;
			}
			50% {
				opacity: 0.7;
			}
		}

		.auth-drift {
			animation: auth-drift 14s ease-in-out infinite;
		}

		.auth-pulse {
			animation: auth-pulse 5s ease-in-out infinite;
		}
	</style>
</svelte:head>

<div class="relative min-h-screen overflow-hidden bg-background text-foreground">
	<div class="pointer-events-none absolute inset-0">
		<div class="auth-drift absolute top-[-10%] left-[-8%] h-72 w-72 rounded-full bg-primary/12 blur-[90px]"></div>
		<div class="auth-drift absolute right-[-12%] bottom-[-12%] h-96 w-96 rounded-full bg-success/10 blur-[120px]"></div>
		<div class="auth-pulse absolute top-[20%] right-[18%] h-48 w-48 rounded-full bg-white/6 blur-[100px]"></div>
		<div class="absolute inset-0 opacity-[0.06]" style="background-image: linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px); background-size: 72px 72px;"></div>
	</div>

	<div class="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
		<div class="grid w-full items-stretch gap-8 lg:grid-cols-[1.15fr_0.85fr]">
			<section class="hidden min-h-[620px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:flex lg:flex-col lg:justify-between">
				<div class="space-y-8">
					<div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
							S
						</div>
						<div>
							<p class="text-sm font-bold tracking-tight text-white/90">ShipSense</p>
							<p class="text-[10px] tracking-[0.22em] text-white/40 uppercase">Founder telemetry</p>
						</div>
					</div>

					<div class="max-w-xl space-y-5">
						<p class="text-[11px] font-semibold tracking-[0.28em] text-primary/70 uppercase">
							Open-source intelligence
						</p>
						<h1 class="text-5xl leading-[1.02] font-black tracking-tight text-white/95">
							Run your repo like a product, not a guessing game.
						</h1>
						<p class="max-w-lg text-base leading-7 text-white/60">
							ShipSense turns GitHub activity into daily clarity, health signals, and focused next actions for founder-led repositories.
						</p>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-3">
					<div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
						<p class="text-[10px] tracking-[0.22em] text-white/35 uppercase">Health</p>
						<p class="mt-3 text-3xl font-black text-success">84</p>
						<p class="mt-2 text-xs leading-5 text-white/50">One glance to see whether momentum is strengthening or slipping.</p>
					</div>
					<div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
						<p class="text-[10px] tracking-[0.22em] text-white/35 uppercase">Insight</p>
						<p class="mt-3 text-sm leading-6 text-white/75">“Commit frequency is recovering. Triage issues next.”</p>
					</div>
					<div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
						<p class="text-[10px] tracking-[0.22em] text-white/35 uppercase">Streak</p>
						<p class="mt-3 text-3xl font-black text-warning">7d</p>
						<p class="mt-2 text-xs leading-5 text-white/50">Consistency compounds. Keep the repo alive signal strong.</p>
					</div>
				</div>
			</section>

			<section class="flex items-center justify-center">
				<Card class="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-card/65 shadow-[0_24px_100px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
					<div class="border-b border-white/8 bg-gradient-to-b from-white/[0.06] to-transparent px-8 pt-8 pb-6">
						<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/15 bg-primary/90 text-2xl font-black text-primary-foreground shadow-[0_12px_30px_rgba(255,255,255,0.08)]">
							S
						</div>
						<div class="mt-6 text-center">
							<p class="text-[11px] font-semibold tracking-[0.25em] text-primary/70 uppercase">
								Secure GitHub sign-in
							</p>
							<CardTitle class="mt-3 text-3xl font-black tracking-tight text-foreground">
								Enter your control room
							</CardTitle>
							<CardDescription class="mt-3 text-sm leading-6 text-muted-foreground">
								Connect GitHub to track repo health, review momentum shifts, and get the next best action without tab hopping.
							</CardDescription>
						</div>
					</div>

					<CardContent class="space-y-5 px-8 py-7">
						{#if error}
							<div
								class="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
							>
								{error}
							</div>
						{/if}

						<Button
							onclick={handleLogin}
							disabled={loading}
							class="h-13 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(255,255,255,0.08)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_36px_rgba(255,255,255,0.12)] disabled:translate-y-0 disabled:opacity-60"
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

						<div class="rounded-[1.5rem] border border-white/10 bg-muted/15 p-5">
							<p class="text-[11px] font-semibold tracking-[0.24em] text-foreground/75 uppercase">
								GitHub Access
							</p>
							<div class="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
								<p>Profile and email</p>
								<p>Repository metadata for connected repositories</p>
								<p>Private repository access only if you choose to connect private repos</p>
							</div>
						</div>

						<div class="grid gap-3 rounded-[1.5rem] border border-white/8 bg-black/10 p-4 text-sm text-muted-foreground sm:grid-cols-2">
							<div>
								<p class="text-[10px] tracking-[0.18em] text-white/40 uppercase">What you get</p>
								<p class="mt-2 leading-6">Repo health, streaks, AI insights, and focused next actions.</p>
							</div>
							<div>
								<p class="text-[10px] tracking-[0.18em] text-white/40 uppercase">Why sign in</p>
								<p class="mt-2 leading-6">We use GitHub data to sync your connected repos and personalize the dashboard.</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	</div>
</div>
