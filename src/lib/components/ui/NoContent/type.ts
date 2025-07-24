import type { Snippet, SvelteComponent } from 'svelte';
import type { ClassValue } from 'svelte/elements';

export interface Props {
	icon?: typeof SvelteComponent | Snippet | any;
	class?: ClassValue;
	title: string;
	subtitle: string;
	children?: Snippet;
}
