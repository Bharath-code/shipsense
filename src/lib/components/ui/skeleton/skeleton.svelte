<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		class: className,
		variant = 'default',
		...rest
	}: {
		class?: string;
		variant?: 'default' | 'shimmer' | 'text' | 'avatar' | 'card';
	} = $props();
</script>

{#if variant === 'shimmer'}
	<div class={cn('relative overflow-hidden rounded-md bg-muted', className)} {...rest}>
		<div
			class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
		></div>
	</div>
{:else if variant === 'text'}
	<div class={cn('h-4 w-full rounded bg-muted', className)} {...rest}></div>
{:else if variant === 'avatar'}
	<div class={cn('h-10 w-10 rounded-full bg-muted', className)} {...rest}></div>
{:else if variant === 'card'}
	<div class={cn('h-48 w-full rounded-3xl bg-muted', className)} {...rest}></div>
{:else}
	<div class={cn('animate-pulse rounded-md bg-muted', className)} {...rest}></div>
{/if}
