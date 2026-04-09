<script lang="ts">
	import {
		showKeyboardShortcutsModal,
		keyboardShortcuts,
		keyboardHandler
	} from '$lib/stores/keyboard';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';

	const shortcuts = keyboardShortcuts.filter((s) =>
		['?', 'Escape', 'd', ',', 'r', 'g d', 'g c', 'g s'].includes(s.key)
	);

	const globalShortcuts = shortcuts.filter((s) => s.scope === 'global' || s.scope === 'dashboard');
	const repoShortcuts = shortcuts.filter((s) => s.scope === 'repo');

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			showKeyboardShortcutsModal.set(false);
		}
	}

	function toggleShortcuts() {
		keyboardHandler.setEnabled(!keyboardHandler.getEnabled());
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog
	open={$showKeyboardShortcutsModal}
	onOpenChange={(open) => showKeyboardShortcutsModal.set(open)}
>
	<DialogContent class="max-w-lg overflow-hidden glass-panel border-border/50 p-0">
		<DialogHeader class="p-6 pb-0">
			<DialogTitle class="flex items-center gap-3 text-2xl font-bold text-foreground">
				<kbd
					class="rounded-lg border border-border bg-muted px-2.5 py-1.5 font-mono text-sm font-medium text-muted-foreground"
					>?</kbd
				>
				Keyboard Shortcuts
			</DialogTitle>
		</DialogHeader>

		<div class="max-h-[60vh] space-y-6 overflow-y-auto p-6 pt-4">
			<div class="flex items-center justify-between">
				<p class="text-sm text-muted-foreground">
					Press keys to trigger actions anywhere in the app.
				</p>
				<Button variant="outline" size="default" onclick={toggleShortcuts}>
					{keyboardHandler.getEnabled() ? 'Disable' : 'Enable'}
				</Button>
			</div>

			<div class="space-y-4">
				<h3 class="text-xs font-bold tracking-widest text-muted-foreground uppercase">Global</h3>
				<div class="grid gap-2">
					{#each globalShortcuts as shortcut}
						<div class="flex items-center justify-between rounded-lg bg-muted/50 p-3">
							<span class="text-sm text-foreground">{shortcut.description}</span>
							<kbd
								class="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm font-medium text-muted-foreground shadow-sm"
							>
								{shortcut.key === ' ' ? 'Space' : shortcut.key}
							</kbd>
						</div>
					{/each}
				</div>
			</div>

			<div class="space-y-4">
				<h3 class="text-xs font-bold tracking-widest text-muted-foreground uppercase">
					Repository Page
				</h3>
				<div class="grid gap-2">
					{#each repoShortcuts as shortcut}
						<div class="flex items-center justify-between rounded-lg bg-muted/50 p-3">
							<span class="text-sm text-foreground">{shortcut.description}</span>
							<kbd
								class="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm font-medium text-muted-foreground shadow-sm"
							>
								{shortcut.key === ' ' ? 'Space' : shortcut.key}
							</kbd>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="border-t border-border/50 bg-muted/30 p-4">
			<p class="text-center text-xs text-muted-foreground">
				Press <kbd
					class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs"
					>Ctrl</kbd
				>
				+
				<kbd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs"
					>K</kbd
				> to open this modal
			</p>
		</div>
	</DialogContent>
</Dialog>
