<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		children: Snippet;
		class?: ClassValue;
	}

	const { children, ...props }: Props = $props();
</script>

<header
	class={[
		'flex w-full items-center gap-3 border-b border-neutral-200/60 px-5 py-5 dark:border-neutral-800/80',
		props.class
	]}
>
	{@render children()}
</header>
