<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className, ...rest }: { class?: string } = $props();
</script>

<div class={cn('animate-pulse rounded-md bg-muted', className)} {...rest}></div>
