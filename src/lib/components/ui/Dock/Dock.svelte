<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		class?: ClassValue;
		size?: 'mini' | 'sm' | 'md';
		children?: Snippet;
	};

	const { size = 'mini', children, ...props }: Props = $props();

	const sizes: Record<NonNullable<Props['size']>, string> = {
		mini: 'rounded-full p-0.5',
		sm: 'rounded-full p-0.5',
		md: 'rounded-2xl p-1'
	};

	const base = 'isolate inline-flex items-center overflow-hidden border backdrop-blur-md shadow-sm';

	const theme =
		'border-neutral-200/70 bg-neutral-50/70 shadow-black/5 ' +
		'dark:border-neutral-800/70 dark:bg-neutral-950/40';
</script>

<div class={[base, theme, sizes[size], props.class]}>
	{@render children?.()}
</div>
