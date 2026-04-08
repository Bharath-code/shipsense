<script lang="ts">
	import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';
	import { Fingerprint, ArrowLeft } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<svelte:head>
	<title>Terms of Service — ShipSense</title>
	<meta name="description" content="Terms of service for ShipSense — the rules for using our repository health intelligence platform." />
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

		<h1 class="text-3xl font-bold tracking-tight md:text-4xl">Terms of Service</h1>
		<p class="mt-2 text-sm text-muted-foreground">Last updated: April 7, 2026</p>

		<div class="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
			<section>
				<h2 class="text-lg font-semibold text-foreground">1. Acceptance</h2>
				<p class="mt-2">
					By using ShipSense ("the Service"), you agree to these Terms of Service. If you do not agree,
					do not use the Service.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">2. Description of Service</h2>
				<p class="mt-2">
					ShipSense provides repository health intelligence by analyzing public and authorized private
					GitHub repository data. The Service includes health scores, daily briefs, anomaly detection,
					traffic intelligence, and growth forecasting for connected repositories.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">3. Accounts</h2>
				<p class="mt-2">
					You must authenticate via GitHub OAuth to use the Service. You are responsible for maintaining
					the security of your GitHub account. We reserve the right to suspend or terminate accounts
					that violate these terms or abuse the Service.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
				<p class="mt-2">You agree not to:</p>
				<ul class="mt-2 list-inside list-disc space-y-1">
					<li>Use the Service to scrape, harvest, or collect data from other users' repositories.</li>
					<li>Attempt to bypass rate limits, security controls, or access controls.</li>
					<li>Use the Service for any illegal purpose or in violation of GitHub's Terms of Service.</li>
					<li>Resell, redistribute, or white-label the Service without written permission.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">5. Pricing &amp; Payments</h2>
				<p class="mt-2">
					ShipSense offers a free tier and paid plans (Indie, Builder). Paid plans are billed monthly
					and can be cancelled at any time. Refunds are handled on a case-by-case basis. Pricing may
					change with 30 days' notice to existing subscribers.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">6. Data &amp; Intellectual Property</h2>
				<p class="mt-2">
					You retain all rights to your repository data. ShipSense analyzes publicly available GitHub
					metadata and any private repository data you authorize us to access. We do not claim ownership
					of your code, content, or data.
				</p>
				<p class="mt-2">
					The ShipSense platform, including its health score algorithms, UI, and branding, is our
					intellectual property.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">7. Disclaimer</h2>
				<p class="mt-2">
					The Service is provided "as is" without warranties of any kind. Health scores and forecasts
					are estimates based on available data and should not be relied upon as guarantees of future
					repository performance.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
				<p class="mt-2">
					ShipSense shall not be liable for any indirect, incidental, or consequential damages arising
					from your use of the Service. Our total liability shall not exceed the amount you have paid
					us in the preceding 12 months.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">9. Changes</h2>
				<p class="mt-2">
					We may update these terms from time to time. Continued use of the Service after changes
					constitutes acceptance of the new terms.
				</p>
			</section>

			<section>
				<h2 class="text-lg font-semibold text-foreground">10. Contact</h2>
				<p class="mt-2">
					For questions about these terms, email us at{' '}
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
