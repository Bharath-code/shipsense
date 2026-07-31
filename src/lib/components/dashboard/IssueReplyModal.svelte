<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Sparkles, Check, X, MessageSquare, RotateCcw } from 'lucide-svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	let { draft, issueTitle, issueNumber, onComplete, onClose } = $props<{
		draft: string;
		issueTitle: string;
		issueNumber: number;
		onComplete: () => void;
		onClose: () => void;
	}>();

	const client = useConvexClient();
	let editedDraft = $state(draft);
	let isSubmitting = $state(false);
	let error = $state('');

	async function handleSubmit() {
		isSubmitting = true;
		error = '';
		try {
			// In a real implementation, this would call a mutation that uses GitHub API
			// For now, we simulate the delay and success
			await new Promise(resolve => setTimeout(resolve, 1500));

			// In a real app:
			// await client.mutation(api.github.postIssueComment, {
			//    repoId: ...,
			//    issueNumber,
			//    body: editedDraft
			// });

			onComplete();
		} catch (err: any) {
			error = err.message || 'Failed to post reply.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
	<!-- Backdrop -->
	<div
		class="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
		onclick={onClose}
	></div>

	<!-- Modal Container -->
	<div
		class="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-all animate-in fade-in zoom-in duration-300"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border bg-muted px-6 py-4">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<MessageSquare size={18} />
				</div>
				<div>
					<h3 class="text-base font-bold text-foreground">Draft AI Reply</h3>
					<p class="text-xs text-muted-foreground">Issue #{issueNumber}: {issueTitle}</p>
				</div>
			</div>
			<button
				onclick={onClose}
				class="rounded-full p-2 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
				aria-label="Close"
			>
				<X size={20} />
			</button>
		</div>

		<!-- Content -->
		<div class="p-6">
			<div class="relative min-h-[300px]">
				<textarea
					bind:value={editedDraft}
					class="w-full h-[300px] resize-none rounded-2xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-0"
					placeholder="Edit your AI-generated draft here..."
				></textarea>

				{#if isSubmitting}
					<div class="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/50 backdrop-blur-[2px]">
						<div class="flex items-center gap-2 text-sm font-medium text-primary">
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
							Posting reply...
						</div>
					</div>
				{/if}
			</div>

			{#if error}
				<p class="mt-3 text-xs font-medium text-destructive">{error}</p>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-end gap-3 border-t border-border bg-muted px-6 py-4">
			<button
				type="button"
				onclick={onClose}
				class="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
			>
				Cancel
			</button>
			<button
				type="button"
				onclick={handleSubmit}
				disabled={isSubmitting || !editedDraft.trim()}
				class="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none"
			>
				{#if isSubmitting}
					<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
				{:else}
					<Check size={16} />
				{/if}
				Post Reply
			</button>
		</div>
	</div>
</div>
