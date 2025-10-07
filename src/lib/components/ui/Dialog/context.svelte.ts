import { getContext, setContext } from 'svelte';
import { ModalContext } from './ModalContext.svelte';

export const KEY_DIALOG = Symbol('Dialog');

export interface IDialogActions {
	onOpenChange?(open: boolean): void;
}

export function createDialogContext(fn_open: any, actions: IDialogActions = {}) {
	const context = new ModalContext(fn_open());

	setContext(KEY_DIALOG, context);

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
	return getContext(KEY_DIALOG) as ModalContext;
}
