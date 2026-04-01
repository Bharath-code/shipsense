import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface KeyboardShortcut {
	key: string;
	description: string;
	action: string;
	scope: 'global' | 'dashboard' | 'repo';
}

export const keyboardShortcuts: KeyboardShortcut[] = [
	{ key: '?', description: 'Show keyboard shortcuts', action: 'openModal', scope: 'global' },
	{ key: 'r', description: 'Refresh repository sync', action: 'refreshSync', scope: 'repo' },
	{ key: 'd', description: 'Go to dashboard', action: 'goDashboard', scope: 'global' },
	{ key: ',', description: 'Go to settings', action: 'goSettings', scope: 'global' },
	{ key: 'Escape', description: 'Close modal / cancel', action: 'closeModal', scope: 'global' },
	{ key: 'g d', description: 'Go to dashboard', action: 'goDashboard', scope: 'global' },
	{ key: 'g c', description: 'Go to connect', action: 'goConnect', scope: 'global' },
	{ key: 'g s', description: 'Go to settings', action: 'goSettings', scope: 'global' }
];

export const showKeyboardShortcutsModal = writable(false);
export const isKeyboardShortcutsEnabled = writable(true);

function createKeyboardHandler() {
	let enabled = true;

	if (browser) {
		const saved = localStorage.getItem('shipsense_kb_shortcuts');
		if (saved !== null) {
			enabled = saved === 'true';
		}
	}

	function setEnabled(value: boolean) {
		enabled = value;
		if (browser) {
			localStorage.setItem('shipsense_kb_shortcuts', String(value));
		}
		isKeyboardShortcutsEnabled.set(value);
	}

	function handleKeydown(
		event: KeyboardEvent,
		callbacks: {
			onGoDashboard?: () => void;
			onGoSettings?: () => void;
			onGoConnect?: () => void;
			onRefreshSync?: () => void;
			onCloseModal?: () => void;
		}
	) {
		if (!enabled) return false;

		const target = event.target as HTMLElement;
		const isInput =
			target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

		if (isInput && event.key !== 'Escape') return false;

		const key = event.key.toLowerCase();
		const ctrl = event.ctrlKey || event.metaKey;

		if (key === '?' && !ctrl) {
			event.preventDefault();
			showKeyboardShortcutsModal.update((v) => !v);
			return true;
		}

		if (key === 'escape') {
			event.preventDefault();
			showKeyboardShortcutsModal.set(false);
			callbacks.onCloseModal?.();
			return true;
		}

		if (key === ',' && (ctrl || !isInput)) {
			event.preventDefault();
			callbacks.onGoSettings?.();
			return true;
		}

		if (key === 'd' && !ctrl && !isInput) {
			if (event.altKey || event.shiftKey) return false;
			event.preventDefault();
			callbacks.onGoDashboard?.();
			return true;
		}

		if (key === 'r' && !ctrl && !isInput) {
			event.preventDefault();
			callbacks.onRefreshSync?.();
			return true;
		}

		if (ctrl && key === 'k') {
			event.preventDefault();
			showKeyboardShortcutsModal.update((v) => !v);
			return true;
		}

		return false;
	}

	return {
		setEnabled,
		handleKeydown,
		getEnabled: () => enabled
	};
}

export const keyboardHandler = createKeyboardHandler();
