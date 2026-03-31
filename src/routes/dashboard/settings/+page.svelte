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
	import { Mail, Bell, Clock, Loader2 } from 'lucide-svelte';

	const client = useConvexClient();
	const emailPrefQuery = useQuery(api.email.getMyEmailPreference);

	let loading = $state(false);
	let lastReportDate = $derived.by(() => {
		if (!emailPrefQuery.data?.lastReportSentAt) return null;
		return new Date(emailPrefQuery.data.lastReportSentAt).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	});

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
</script>

<div class="mx-auto max-w-2xl space-y-8">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Settings</h1>
		<p class="mt-2 text-muted-foreground">Manage your email preferences and account settings.</p>
	</div>

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
