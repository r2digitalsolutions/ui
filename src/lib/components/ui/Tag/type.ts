import type { Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';

export interface Props {
	onclick?(): void;
	href?: string;
	variant?: 'solid' | 'outline';
	color?: 'primary' | 'secondary' | 'danger' | 'white' | 'teal' | 'info' | 'outline' | 'default';
	shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	onclose?(): void;
	class?: ClassValue;
	children: Snippet;
}
