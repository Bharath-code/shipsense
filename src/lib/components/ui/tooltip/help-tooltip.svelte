<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { HelpCircle } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	let {
		content,
		side = 'top',
		class: className,
		children
	}: {
		content: string;
		side?: 'top' | 'bottom' | 'left' | 'right';
		class?: string;
		children?: import('svelte').Snippet;
	} = $props();

	let open = $state(false);
</script>

<TooltipPrimitive.Root bind:open>
	<TooltipPrimitive.Trigger
		class={cn(
			'inline-flex cursor-help items-center rounded text-muted-foreground transition-colors hover:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none',
			className
		)}
	>
		{#if children}
			{@render children()}
		{:else}
			<HelpCircle class="h-4 w-4" />
		{/if}
	</TooltipPrimitive.Trigger>
	<TooltipPrimitive.Portal>
		<TooltipPrimitive.Content
			{side}
			sideOffset={4}
			class="z-50 max-w-xs animate-in rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
		>
			{content}
			<TooltipPrimitive.Arrow class="fill-border" />
		</TooltipPrimitive.Content>
	</TooltipPrimitive.Portal>
</TooltipPrimitive.Root>
