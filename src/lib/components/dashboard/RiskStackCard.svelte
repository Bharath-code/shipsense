<script lang="ts">
	import { Shield, ShieldAlert, ShieldCheck, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-svelte';
	import type { RiskStack, RiskItem } from '$convex/trafficIntelligence';

	let { riskStack, onViewAll }: { riskStack: RiskStack; onViewAll?: () => void } = $props();

	function tierConfig(tier: RiskStack['tier']) {
		switch (tier) {
			case 'critical':
				return { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', label: 'Critical' };
			case 'high':
				return { icon: ShieldAlert, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', label: 'High' };
			case 'moderate':
				return { icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'Moderate' };
			case 'low':
				return { icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'Low' };
			default:
				return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Clean' };
		}
	}

	function itemSeverityColor(severity: RiskItem['severity']) {
		switch (severity) {
			case 'critical': return 'text-red-400';
			case 'high': return 'text-orange-400';
			case 'medium': return 'text-amber-400';
			default: return 'text-blue-400';
		}
	}

	function itemSeverityDot(severity: RiskItem['severity']) {
		switch (severity) {
			case 'critical': return 'bg-red-400';
			case 'high': return 'bg-orange-400';
			case 'medium': return 'bg-amber-400';
			default: return 'bg-blue-400';
		}
	}

	function itemTypeLabel(type: RiskItem['type']) {
		switch (type) {
			case 'vulnerability': return 'Vuln';
			case 'deprecated': return 'Dep';
			case 'anomaly': return 'Signal';
			case 'outdated_dep': return 'Update';
			case 'readme_gap': return 'README';
		}
	}

	const cfg = $derived(tierConfig(riskStack.tier));
	const TierIcon = $derived(cfg.icon);
	let showDetails = $state(false);
</script>

<div class="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
	<div class="mb-3 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<TierIcon class="h-4 w-4 {cfg.color}" />
			<h3 class="text-sm font-bold text-foreground">Risk Stack</h3>
		</div>
		<div class="flex items-center gap-2">
			<span class="rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase {cfg.color} {cfg.bg} {cfg.border}">
				{cfg.label}
			</span>
			<span class="text-[10px] font-medium text-muted-foreground">
				Score: {riskStack.score}/100
			</span>
			{#if onViewAll && riskStack.tier !== 'clean'}
				<button
					type="button"
					class="rounded-lg px-3 py-2 text-xs font-medium text-primary hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
					style="min-height: 44px;"
					onclick={onViewAll}
				>
					Details <ChevronRight class="ml-0.5 inline h-3 w-3" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Narrative -->
	<p class="mb-3 text-xs leading-relaxed text-muted-foreground">{riskStack.narrative}</p>

	<!-- Clean state: positive message, no expand needed -->
	{#if riskStack.tier === 'clean'}
		<div class="flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3">
			<CheckCircle2 class="h-4 w-4 text-emerald-400" />
			<p class="text-xs font-medium text-emerald-400">All clear — no vulnerabilities or anomalies detected.</p>
		</div>
	{/if}

	<!-- Top risk (if any) -->
	{#if riskStack.topRisk}
		<button
			type="button"
			class="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
			onclick={() => showDetails = !showDetails}
		>
			<div class="flex items-start justify-between gap-2">
				<div class="flex items-start gap-2">
					<span class="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full {itemSeverityDot(riskStack.topRisk.severity)}"></span>
					<div>
						<p class="text-xs font-semibold text-foreground">{riskStack.topRisk.title}</p>
						<p class="mt-0.5 text-xs text-muted-foreground">{riskStack.topRisk.description}</p>
					</div>
				</div>
				<ChevronDown class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform {showDetails ? 'rotate-180' : ''}" />
			</div>
		</button>

		{#if showDetails}
			<div class="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
				<div class="mb-2 flex items-center gap-2">
					<span class="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
						{itemTypeLabel(riskStack.topRisk.type)}
					</span>
					<span class="text-[10px] font-medium {itemSeverityColor(riskStack.topRisk.severity)} uppercase">
						{riskStack.topRisk.severity}
					</span>
				</div>
				<p class="text-xs font-medium text-foreground">→ {riskStack.topRisk.action}</p>
			</div>
		{/if}
	{/if}

	<!-- Additional items count -->
	{#if riskStack.items.length > 1}
		<p class="mt-2 text-[10px] text-muted-foreground">
			{riskStack.items.length - 1} more item{riskStack.items.length > 2 ? 's' : ''} detected
		</p>
	{/if}
</div>
