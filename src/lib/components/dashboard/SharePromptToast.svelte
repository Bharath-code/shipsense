<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import Toast from '$lib/components/ui/toast/toast.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Share2 } from 'lucide-svelte';

	let { repoId } = $props<{ repoId: string }>();

	const client = useConvexClient();
	const promptQuery = useQuery(api.sharePrompts.getRepoSharePrompt, () => ({ repoId }));
	let prompt = $derived(promptQuery.data);
	let open = $state(false);
	let lastPromptId = $state<string | null>(null);

	$effect(() => {
		if (!prompt?._id) return;
		if (prompt._id !== lastPromptId) {
			lastPromptId = prompt._id;
			open = true;
		}
	});

	async function dismiss() {
		if (prompt?._id) {
			await client.mutation(api.sharePrompts.dismissSharePrompt, { promptId: prompt._id });
		}
		open = false;
	}

	async function shareNow() {
		if (!prompt) return;
		window.open(
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(prompt.shareText)}&url=${encodeURIComponent(prompt.shareUrl)}`,
			'_blank'
		);
		await dismiss();
	}
</script>

{#if prompt}
	<Toast bind:open title={prompt.title} message={prompt.message} type="info">
		<div class="flex gap-2">
			<Button
				size="sm"
				class="rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
				onclick={shareNow}
			>
				<Share2 class="mr-2 h-3.5 w-3.5" />
				Share on X
			</Button>
			<Button
				size="sm"
				variant="ghost"
				class="rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
				onclick={dismiss}
			>
				Not now
			</Button>
		</div>
	</Toast>
{/if}
