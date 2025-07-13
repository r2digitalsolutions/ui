import type { Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';

export interface Props {
	style?: string;
	onclick?: () => void;
	body_class?: ClassValue;
	class?: ClassValue;
	footer?: Snippet;
	header?: Snippet;
	children: Snippet;
}
