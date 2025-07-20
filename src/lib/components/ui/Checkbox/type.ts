import type { ClassValue } from 'svelte/elements';

type Value = string | number | boolean;

export interface Props {
	class?: ClassValue;
	group?: boolean[];
	name?: string;
	label?: string;
	value?: Value;
	checked?: boolean;
	disabled?: boolean;
	required?: boolean;
	onchange?(checked: boolean, value: Value): void;
}
