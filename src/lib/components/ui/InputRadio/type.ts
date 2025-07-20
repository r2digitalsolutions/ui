import type { Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';

export interface Props {
	name?: string;
	children: Snippet;
	class?: ClassValue;
	group?: string;
	value: string;
}
