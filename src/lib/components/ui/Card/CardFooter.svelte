<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		children: Snippet;
		class?: ClassValue;
	}
	const { children, ...props }: Props = $props();
</script>

<footer
	class={[
		'flex justify-between rounded-b-xl border-t border-gray-200 bg-gray-50 p-3 pt-2 dark:border-neutral-700 dark:bg-neutral-800',
		props.class
	]}
>
	{@render children()}
</footer>
