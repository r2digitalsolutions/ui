import type { IInputDirection } from '$lib/types/direction.type.js';
import type { Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';

export interface Props {
	direction?: IInputDirection;
	required?: boolean;
	class?: ClassValue;
	errors?: string[];
	label?: string;
	name?: string;
	children: Snippet;
}
