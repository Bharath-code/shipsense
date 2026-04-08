<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import {
		Mail,
		Bell,
		Clock,
		Loader2,
		CreditCard,
		ExternalLink,
		ArrowUpRight,
		Check,
		Sparkles,
		Zap,
		Rocket
	} from 'lucide-svelte';

	const client = useConvexClient();

	const emailPrefQuery = useQuery(api.email.getMyEmailPreference);
	const profileQuery = useQuery(api.settings.getMyProfile, {});

	let loading = $state(false);
	let upgrading = $state<string | null>(null);
	let showPlanPicker = $state(false);

	// Debug: log what we actually get
	$effect(() => {
		if (profileQuery.data) {
			console.log('[settings] profileQuery:', profileQuery.data);
		}
	});

	const plan = $derived(profileQuery.data?.plan ?? 'free');
	const activeRepos = $derived(profileQuery.data?.activeRepoCount ?? 0);

	const planDetails = {
		free: { name: 'Free', price: '$0/mo', icon: Sparkles, color: 'text-muted-foreground' },
		indie: { name: 'Indie', price: '$9/mo', icon: Zap, color: 'text-primary' },
		builder: { name: 'Builder', price: '$49/mo', icon: Rocket, color: 'text-warning' }
	};

	const maxRepos = { free: 1, indie: 5, builder: 50 };

	let lastReportDate = $derived.by(() => {
		if (!emailPrefQuery.data?.lastReportSentAt) return null;
		return new Date(emailPrefQuery.data.lastReportSentAt).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	});

	const repoLimit = $derived(maxRepos[plan as keyof typeof maxRepos] ?? 1);
	const isOverLimit = $derived(activeRepos > repoLimit);
	const repoUsagePercent = $derived(Math.min(Math.round((activeRepos / repoLimit) * 100), 100));

	async function handleToggle(checked: boolean | string) {
		const enabled = Boolean(checked);
		loading = true;
		try {
			await client.mutation(api.email.toggleEmailReports, { enabled });
		} catch (err) {
			console.error('Failed to update preference:', err);
		} finally {
			loading = false;
		}
	}

	async function handleUpgrade(productId: string) {
		upgrading = productId;
		try {
			const url = await client.mutation(api.settings.getCheckoutUrl, { productId });
			if (url) window.open(url, '_blank');
		} catch (err) {
			console.error('Failed to get checkout URL:', err);
		} finally {
			upgrading = null;
		}
	}

	const planCards = [
		{
			id: 'free',
			name: 'Free',
			price: '$0',
			period: '/mo',
			description: 'Health clarity for 1 repo',
			features: ['Health score + trend', 'Daily brief + change summary', 'Shipping streak + task engine', 'Public health page + badge']
		},
		{
			id: 'indie',
			name: 'Indie',
			price: '$9',
			period: '/mo',
			description: 'Growth intelligence for indie builders',
			features: ['Everything in Free', 'Star forecast + conversion funnel', 'Anomaly detection + traffic intelligence', 'Risk stack + external reach score', 'Weekly email digest', '5 repositories'],
			productId: 'indie'
		},
		{
			id: 'builder',
			name: 'Builder',
			price: '$49',
			period: '/mo',
			description: 'Portfolio ops for teams and agencies',
			features: ['Everything in Indie', '50 repositories', 'Portfolio-level health overview', 'Dependency monitoring', 'Proactive anomaly alerts'],
			productId: 'builder'
		}
	];

	function getButtonText(planId: string): string {
		if (planId === plan) return 'Current Plan';
		if (planId === 'free') return 'Downgrade';
		if (plan === 'free') return `Upgrade to ${planId === 'indie' ? 'Indie' : 'Builder'}`;
		if (plan === 'indie' && planId === 'builder') return 'Upgrade to Builder';
		if (plan === 'builder' && planId === 'indie') return 'Downgrade to Indie';
		return 'Change Plan';
	}

	function getButtonVariant(planId: string): 'default' | 'outline' {
		return planId === plan ? 'outline' : 'default';
	}

	function isButtonDisabled(planId: string): boolean {
		return planId === plan;
	}
</script>

<div class="mx-auto max-w-2xl space-y-8">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Settings</h1>
		<p class="mt-2 text-muted-foreground">Manage your plan, email preferences, and account settings.</p>
	</div>

	<!-- Current Plan Card -->
	<Card class="border-white/10 bg-white/5">
		<CardHeader>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
						<CreditCard class="h-5 w-5 text-primary" />
					</div>
					<div>
						<CardTitle>Current Plan</CardTitle>
						<CardDescription>Manage your subscription and usage</CardDescription>
					</div>
				</div>
				{#if plan !== 'free'}
					<span class="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">Active</span>
				{/if}
			</div>
		</CardHeader>
		<CardContent class="space-y-5">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
						{#if plan === 'free'}
							<Sparkles class="h-6 w-6 text-muted-foreground" />
						{:else if plan === 'indie'}
							<Zap class="h-6 w-6 text-primary" />
						{:else}
							<Rocket class="h-6 w-6 text-warning" />
						{/if}
					</div>
					<div>
						<p class="text-lg font-bold text-foreground">{plan === 'free' ? 'Free' : plan === 'indie' ? 'Indie' : 'Builder'}</p>
						<p class="text-sm text-muted-foreground">{plan === 'free' ? '$0/mo' : plan === 'indie' ? '$9/mo' : '$49/mo'}</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => (showPlanPicker = !showPlanPicker)}
					class="gap-1.5 text-primary hover:text-primary/80"
				>
					Change Plan
					<ArrowUpRight class="h-3.5 w-3.5" />
				</Button>
			</div>

			<!-- Usage meter -->
			<div class="space-y-2">
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Repositories</span>
					{#if isOverLimit}
						<span class="font-medium text-destructive">{activeRepos} of {repoLimit} — upgrade to remove limits</span>
					{:else}
						<span class="font-medium text-foreground">{activeRepos} of {repoLimit}</span>
					{/if}
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full transition-all duration-500 {isOverLimit ? 'bg-destructive' : repoUsagePercent >= 90 ? 'bg-destructive' : repoUsagePercent >= 70 ? 'bg-warning' : 'bg-primary'}"
						style="width: {isOverLimit ? '100' : repoUsagePercent + '%'}"
					></div>
				</div>
			</div>

			<!-- Manage billing link (for paid users) -->
			{#if profileQuery.data?.dodoCustomerId}
				<div class="pt-2">
					<a
						href="https://payments.dodo.io/portal/{profileQuery.data.dodoCustomerId}"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline decoration-transparent transition-colors hover:decoration-current"
					>
						Manage billing · Update payment method · Download invoices
						<ExternalLink class="h-3 w-3" />
					</a>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Plan Picker (expandable) -->
	{#if showPlanPicker}
		<Card class="border-primary/30 bg-white/5">
			<CardHeader>
				<CardTitle>Choose your plan</CardTitle>
				<CardDescription>Upgrade or downgrade at any time. Changes take effect immediately.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid gap-4 sm:grid-cols-3">
					{#each planCards as p}
					{@const isHighlighted = p.id === 'indie' && plan === 'free'}
					<div
						class="relative flex flex-col rounded-2xl border p-5 transition-colors {isHighlighted ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'} {plan === p.id ? 'ring-2 ring-primary/20' : ''}"
					>
						{#if plan === p.id}
							<div class="absolute -top-2.5 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
								Current
							</div>
						{/if}
							<div class="mb-3">
								<h3 class="text-sm font-bold text-foreground">{p.name}</h3>
								<div class="mt-1 flex items-end gap-0.5">
									<span class="text-2xl font-bold">{p.price}</span>
									<span class="text-xs text-muted-foreground">{p.period}</span>
								</div>
							</div>
							<p class="mb-4 text-xs text-muted-foreground">{p.description}</p>
							<div class="mb-4 flex-1 space-y-2">
								{#each p.features as feature}
									<div class="flex items-start gap-2">
										<Check size={13} class="mt-0.5 shrink-0 text-success" />
										<span class="text-xs text-muted-foreground">{feature}</span>
									</div>
								{/each}
							</div>
							{#if p.id === 'free'}
								<Button
									variant="outline"
									size="sm"
									class="w-full rounded-full text-xs"
									disabled={isButtonDisabled(p.id)}
								>
									{getButtonText(p.id)}
								</Button>
							{:else}
								<Button
									size="sm"
									class="w-full rounded-full text-xs"
									variant={getButtonVariant(p.id)}
									onclick={() => p.productId && handleUpgrade(p.productId)}
									disabled={isButtonDisabled(p.id)}
								>
									{#if upgrading === p.productId}
										<Loader2 class="mr-1 h-3 w-3 animate-spin" />
										Loading…
									{:else}
										{getButtonText(p.id)}
									{/if}
								</Button>
							{/if}
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Email Reports -->
	<Card class="border-white/10 bg-white/5">
		<CardHeader>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
					<Mail class="h-5 w-5 text-primary" />
				</div>
				<div>
					<CardTitle>Email Reports</CardTitle>
					<CardDescription>Receive weekly growth reports for your repositories</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="text-sm font-medium">Weekly Reports</p>
					<p class="text-xs text-muted-foreground">
						Get a summary of your repos every Sunday at 10am UTC
					</p>
				</div>
				<div class="flex items-center gap-3">
					{#if loading || emailPrefQuery.isLoading}
						<Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
					{:else}
						<div class="flex items-center gap-2">
							<Checkbox
								id="email-reports"
								checked={emailPrefQuery.data?.emailReportsEnabled ?? false}
								onCheckedChange={handleToggle}
							/>
							<label for="email-reports" class="cursor-pointer text-sm font-normal">Enabled</label>
						</div>
					{/if}
				</div>
			</div>

			{#if lastReportDate}
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Clock class="h-4 w-4" />
					<span>Last report sent: {lastReportDate}</span>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Notifications -->
	<Card class="border-white/10 bg-white/5">
		<CardHeader>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
					<Bell class="h-5 w-5 text-amber-500" />
				</div>
				<div>
					<CardTitle>Notifications</CardTitle>
					<CardDescription>Control how you receive updates</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground">
				More notification options coming soon — including Slack integration and webhook
				notifications.
			</p>
		</CardContent>
	</Card>
</div>
