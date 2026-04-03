<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import {
		Package,
		AlertTriangle,
		ChevronRight,
		ShieldAlert,
		ArrowUpCircle,
		ArchiveX
	} from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	const dependencyQuery = useQuery(api.dashboard.getRepoDependencies, () => ({ repoId }));
	let data = $derived(dependencyQuery.data);
	let isLoading = $derived(dependencyQuery.isLoading);
	let showAll = $state(false);
	let showDependencyList = $state(false);

	const visibleDependencies = $derived(
		showAll ? (data?.dependencies ?? []) : (data?.dependencies ?? []).slice(0, 6)
	);

	function severityColor(severity: string): string {
		if (severity === 'critical' || severity === 'high') return 'text-destructive';
		if (severity === 'moderate') return 'text-warning';
		if (severity === 'low') return 'text-orange-500';
		return 'text-muted-foreground';
	}

	function statusLabel(dependency: any): string {
		if (dependency.hasVulnerability) return `${dependency.vulnerabilitySeverity} vulnerability`;
		if (dependency.isDeprecated) return 'Deprecated';
		if (dependency.outdatedType !== 'none') return `${dependency.outdatedType} update`;
		return 'Current';
	}
</script>

<div
	class="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-border/80"
>
	<div
		class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
	></div>

	<div class="relative p-6">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<Package class="h-5 w-5 text-primary" />
				</div>
				<div>
					<h3 class="font-semibold text-foreground">Dependencies</h3>
					<p class="text-xs text-muted-foreground">Outdated, deprecated, and risky packages</p>
				</div>
			</div>
			{#if data}
				<span class="text-sm text-muted-foreground">{data.summary.total} tracked</span>
			{/if}
		</div>

		{#if isLoading}
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
				></div>
				Checking dependencies...
			</div>
		{:else if !data || data.summary.total === 0}
			<div class="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
				<AlertTriangle class="h-4 w-4" />
				No supported dependency manifests found yet.
			</div>
		{:else}
			<div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
				<div class="flex min-h-[76px] flex-col justify-between rounded-lg bg-muted/40 px-3 py-3">
					<p class="text-[11px] font-medium tracking-wide text-muted-foreground">Outdated</p>
					<p class="text-lg font-bold leading-none text-foreground">{data.summary.outdated}</p>
				</div>
				<div class="flex min-h-[76px] flex-col justify-between rounded-lg bg-muted/40 px-3 py-3">
					<p class="text-[11px] font-medium tracking-wide text-muted-foreground">Major</p>
					<p class="text-lg font-bold leading-none text-warning">{data.summary.majorOutdated}</p>
				</div>
				<div class="flex min-h-[76px] flex-col justify-between rounded-lg bg-muted/40 px-3 py-3">
					<p class="text-[11px] font-medium tracking-wide text-muted-foreground">Deprecated</p>
					<p class="text-lg font-bold leading-none text-orange-500">{data.summary.deprecated}</p>
				</div>
				<div class="flex min-h-[76px] flex-col justify-between rounded-lg bg-muted/40 px-3 py-3">
					<p class="text-[11px] font-medium tracking-wide text-muted-foreground">Vulnerable</p>
					<p class="text-lg font-bold leading-none text-destructive">{data.summary.vulnerable}</p>
				</div>
			</div>

			<button
				type="button"
				class="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-left text-sm transition-colors hover:bg-muted"
				onclick={() => (showDependencyList = !showDependencyList)}
			>
				<div>
					<p class="font-medium text-foreground">Dependency details</p>
					<p class="mt-0.5 text-xs text-muted-foreground">
						Review outdated, deprecated, and vulnerable packages
					</p>
				</div>
				<ChevronRight
					class="h-4 w-4 shrink-0 text-muted-foreground transition-transform {showDependencyList
						? 'rotate-90'
						: ''}"
				/>
			</button>

			{#if showDependencyList}
				<div class="mt-3 space-y-2">
					{#each visibleDependencies as dependency}
						<div class="rounded-lg border border-border/50 bg-background/40 p-3">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-2">
										<p class="truncate text-sm font-medium text-foreground">{dependency.name}</p>
										<span class="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
											{dependency.ecosystem}
										</span>
									</div>
									<p class="mt-1 break-all text-xs text-muted-foreground">{dependency.manifestPath}</p>
									<div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
										<span class="text-muted-foreground">{dependency.currentVersion}</span>
										{#if dependency.latestVersion}
											<span class="text-muted-foreground/70">→</span>
											<span class="font-medium text-foreground">{dependency.latestVersion}</span>
										{/if}
									</div>
								</div>

								<div class="shrink-0 pt-0.5">
									{#if dependency.hasVulnerability}
										<ShieldAlert class="h-4 w-4 {severityColor(dependency.vulnerabilitySeverity)}" />
									{:else if dependency.isDeprecated}
										<ArchiveX class="h-4 w-4 text-orange-500" />
									{:else if dependency.isOutdated}
										<ArrowUpCircle class="h-4 w-4 text-warning" />
									{:else}
										<ChevronRight class="h-4 w-4 text-muted-foreground" />
									{/if}
								</div>
							</div>

							<p class="mt-2 text-xs font-medium {severityColor(dependency.vulnerabilitySeverity)}">
								{statusLabel(dependency)}
							</p>
							{#if dependency.vulnerabilitySummary}
								<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
									{dependency.vulnerabilitySummary}
								</p>
							{:else if dependency.deprecationMessage}
								<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
									{dependency.deprecationMessage}
								</p>
							{/if}
						</div>
					{/each}
				</div>

				{#if data.dependencies.length > 6}
					<button
						type="button"
						class="mt-3 w-full rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
						onclick={() => (showAll = !showAll)}
					>
						{showAll ? 'Show fewer dependencies' : `Show all ${data.dependencies.length} dependencies`}
					</button>
				{/if}
			{/if}
		{/if}
	</div>
</div>
