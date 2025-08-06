<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		children: Snippet;
		class?: ClassValue;
	}

	const { children, ...props }: Props = $props();
</script>

<div class={['flex flex-1 flex-col p-3', props.class]}>
	{@render children()}
</div>
