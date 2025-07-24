import type { Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';

export interface DialogProps {
	closedby?: 'none' | 'closerequest' | 'any';
	size?:
		| 'sm'
		| 'md'
		| 'lg'
		| 'xl'
		| '2xl'
		| '3xl'
		| '4xl'
		| '5xl'
		| '6xl'
		| '7xl'
		| 'full'
		| 'auto';
	padding?: 'none' | 'sm' | 'md' | 'lg';
	class?: ClassValue;
	children: Snippet;
	open?: boolean;
	header?: Snippet;
	footer?: Snippet;
	onclose?(): void;
	onpointermove?(e: PointerEvent): void;
	onOpenChange?(open: boolean): void;
}

export interface DialogPropsgHeaderProps {
	children?: Snippet;
	class?: ClassValue;
}

export interface DialogTitleProps {
	class?: ClassValue;
	children: Snippet;
}

export interface DialogDescriptionProps {
	class?: ClassValue;
	children: Snippet;
}

export interface DialogFooterProps {
	position?: 'start' | 'center' | 'end';
	class?: ClassValue;
	children: Snippet;
}

export interface DialogContentProps {
	onkeydown?(e: KeyboardEvent): void;
	padding?: DialogProps['padding'];
	class?: ClassValue;
	children: Snippet;
	[key: string]: any;
}
