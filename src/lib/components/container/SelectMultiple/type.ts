import type { Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';

export interface Option {
	label: string;
	value: string;
	description?: string;
	[key: string]: any;
}

export interface Props {
	parentClass?: ClassValue;
	class?: ClassValue;
	required?: boolean;
	multiple?: boolean;
	onConfirm?: (selected: Option[]) => void;
	onCancel?: () => void;
	item?: Snippet<[option: Option]>;
	options: Option[];
	value?: Option[];
	label: string;
	name: string;
	placeholder: string;
	errors?: string[];
}
