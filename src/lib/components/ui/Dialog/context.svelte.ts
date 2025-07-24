import { getContext, setContext } from 'svelte';
import { ModalContext } from './ModalContext.svelte';

export const KEY = Symbol('Dialog');

export interface DialogActions {
	onOpenChange?(open: boolean): void;
}

export function createDialogContext(fn_open: any, actions: DialogActions = {}) {
	const context = new ModalContext(fn_open());

	setContext(KEY, context);

	$effect(() => {
		context.open = fn_open();
		actions.onOpenChange?.(context.open);

		return () => {
			context.open = false;
			actions.onOpenChange?.(context.open);
		};
	});

	return context;
}

export function useDialogContext() {
	return getContext(KEY) as ModalContext;
}
