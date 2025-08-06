<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		children: Snippet;
		class?: ClassValue;
	}

	const { children, ...props }: Props = $props();
</script>

<header class={['flex flex-row gap-2 p-3 pb-2', props.class]}>
	{@render children()}
</header>
