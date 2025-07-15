<script lang="ts">
	import type { Props } from './type.js';

	const { children, ...props }: Props = $props();
</script>

<section class={['relative flex flex-col gap-2 py-32', props.class]}>
	{@render children()}
</section>

<style lang="postcss">
	section + :global(section) {
		&:nth-child(odd) {
			@apply bg-gray-50 dark:bg-gray-900;
		}

		&:nth-child(even) {
			@apply bg-gray-100 dark:bg-gray-800;
		}
	}
</style>
