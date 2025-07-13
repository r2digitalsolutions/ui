<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	const {
		children,
		...props
	}: {
		children: Snippet;
		class?: ClassValue;
	} = $props();
</script>

<h3 {...props} class={['text-lg font-semibold', props.class]}>
	{@render children()}
</h3>
