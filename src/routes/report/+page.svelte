<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowRight, ExternalLink, X, Code } from 'lucide-svelte';

	const email = $page.url.searchParams.get('email') ?? 'your inbox';
	const repoUrl = $page.url.searchParams.get('repo') ?? 'your repo';
</script>

<svelte:head>
	<title>Your Report Is On The Way — ShipSense</title>
	<meta name="description" content="Check your inbox for your free repo health report." />
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="mx-auto max-w-2xl px-6 py-20">
		<!-- Confirmation -->
		<div class="mb-8 text-center">
			<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
				<span class="text-4xl">📧</span>
			</div>
			<h1 class="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
				Check your inbox!
			</h1>
			<p class="text-lg text-muted-foreground">
				Your health report for <strong class="text-foreground">{repoUrl}</strong> is on its way to <strong class="text-foreground">{email}</strong>.
			</p>
		</div>

		<!-- While You Wait -->
		<div class="mb-8 rounded-2xl border border-border bg-card p-6">
			<h2 class="mb-4 text-xl font-bold text-foreground">While you wait…</h2>
			<div class="space-y-4">
				<a
					href="/p/example"
					class="flex items-center justify-between rounded-xl border border-white/10 bg-background/50 p-4 transition-colors hover:bg-white/5"
				>
					<div>
						<p class="font-semibold text-foreground">See a live demo repo</p>
						<p class="mt-1 text-sm text-muted-foreground">Experience the full dashboard with a pre-seeded repo — no sign-up needed.</p>
					</div>
					<ExternalLink class="h-5 w-5 flex-shrink-0 text-muted-foreground" />
				</a>
				<a
					href="/auth/login"
					class="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
				>
					<div>
						<p class="font-semibold text-primary">Want daily tracking? Connect your GitHub</p>
						<p class="mt-1 text-sm text-muted-foreground">Get daily health scores, AI insights, and task recommendations — free for 1 repo.</p>
					</div>
					<ArrowRight class="h-5 w-5 flex-shrink-0 text-primary" />
				</a>
			</div>
		</div>

		<!-- Share -->
		<div class="mb-8 rounded-2xl border border-border bg-card p-6 text-center">
			<p class="mb-4 font-semibold text-foreground">Share your experience</p>
			<a
				href={`https://twitter.com/intent/tweet?text=Just%20scored%20my%20repo%20health%20with%20%40shipsense%20%F0%9F%9A%80%20Get%20yours%3A&url=https%3A%2F%2Fshipsense.app`}
				target="_blank"
				rel="noreferrer"
				class="inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
			>
				<X class="h-4 w-4" />
				Tweet about ShipSense
			</a>
		</div>

		<!-- Back to home -->
		<div class="text-center">
			<a href="/" class="text-sm text-muted-foreground hover:text-foreground">
				← Back to home
			</a>
		</div>
	</div>
</div>
