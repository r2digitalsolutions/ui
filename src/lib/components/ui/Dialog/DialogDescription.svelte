<script lang="ts">
	import type { DialogDescriptionProps } from './type.js';

	const { children, ...props }: DialogDescriptionProps = $props();
</script>

<p class={['text-md text-center text-pretty sm:text-left dark:text-gray-300', props.class]}>
	{@render children()}
</p>
