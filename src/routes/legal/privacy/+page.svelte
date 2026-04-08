<script lang="ts">
	import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';
	import { Fingerprint, ArrowLeft } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<svelte:head>
	<title>Privacy Policy — ShipSense</title>
	<meta name="description" content="Privacy policy for ShipSense — how we collect, use, and protect your data." />
</svelte:head>

<div class="relative min-h-screen bg-background font-sans text-foreground">
	<!-- Nav -->
	<div class="fixed top-4 right-0 left-0 z-50 flex justify-center px-4">
		<header
			class="flex w-full max-w-4xl items-center justify-between rounded-full border border-border/40 bg-background/85 px-4 py-2 shadow-xl backdrop-blur-2xl sm:px-6 sm:py-3"
		>
			<div class="flex items-center gap-2 font-mono text-lg font-bold tracking-tight">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground shadow-lg"
				>
					<Fingerprint size={16} />
				</div>
				<span class="hidden sm:inline-block">ShipSense</span>
			</div>
			<ThemeToggle />
		</header>
	</div>

	<main class="relative z-10 mx-auto max-w-3xl px-6 py-32">
		<Button
			href="/"
			variant="ghost"
			class="mb-8 h-9 gap-1.5 rounded-full px-4 text-sm text-muted-foreground"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			Back to home
		</Button>

		<h1 class="text-3xl font-bold tracking-tight md:text-4xl">Privacy Policy</h1>
		<p class="mt-2 text-sm text-muted-foreground">Last updated: April 7, 2026</p>

		<div class="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
			<section>
				<h2 class="text-lg font-semibold text-foreground">Overview</h2>
				<p class="mt-2">
					ShipSense ("we", "our", or "us") provides repository health intelligence for GitHub projects.
					This policy explains what data we collect, how we use it, and your rights.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">Data We Collect</h2>
				<p class="mt-2">We collect only the data necessary to provide our service:</p>
				<ul class="mt-2 list-inside list-disc space-y-1">
					<li><strong>GitHub account data:</strong> your profile, email, and repository metadata for repos you choose to connect.</li>
					<li><strong>Usage data:</strong> how you interact with the ShipSense dashboard (e.g., which repos you connect, when you sync).</li>
					<li><strong>Authentication data:</strong> handled through GitHub OAuth. We never store your GitHub password.</li>
				</ul>
				<p class="mt-2">
					We do <strong>not</strong> collect or store your GitHub password, private keys, or source code contents.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">How We Use Data</h2>
				<p class="mt-2">Data is used exclusively to:</p>
				<ul class="mt-2 list-inside list-disc space-y-1">
					<li>Calculate repository health scores.</li>
					<li>Generate daily briefs and change summaries.</li>
					<li>Provide traffic intelligence, anomaly detection, and growth forecasts.</li>
					<li>Send notification emails (weekly digests, anomaly alerts) that you opt into.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">Data Storage &amp; Security</h2>
				<p class="mt-2">
					All data is stored on Convex, a serverless backend platform with encryption at rest and in transit.
					We use industry-standard security practices and regularly review our data handling procedures.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">Third-Party Services</h2>
				<p class="mt-2">
					We use GitHub's API to read repository metadata. We only access the permissions you grant during OAuth authorization.
					We do not sell or share your data with third parties.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">Your Rights</h2>
				<p class="mt-2">You can:</p>
				<ul class="mt-2 list-inside list-disc space-y-1">
					<li>Disconnect any connected repository at any time.</li>
					<li>Request deletion of all your data by contacting us at <a href="mailto:hello@shipsense.ai" class="text-primary underline">hello@shipsense.ai</a>.</li>
					<li>Export your data upon request.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">Contact</h2>
				<p class="mt-2">
					For privacy questions or data requests, email us at{' '}
					<a href="mailto:hello@shipsense.ai" class="text-primary underline">hello@shipsense.ai</a>.
				</p>
			</section>
		</div>
	</main>

	<!-- Footer -->
	<footer class="container mx-auto max-w-3xl border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
		ShipSense © {new Date().getFullYear()}. Built for maintainers and open-source teams.
	</footer>
</div>
