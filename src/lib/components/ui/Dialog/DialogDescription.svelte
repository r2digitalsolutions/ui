<script lang="ts">
	import type { DialogDescriptionProps } from './type.js';

	const { children, ...props }: DialogDescriptionProps = $props();
</script>

<p
	class={[
		'text-md text-center text-pretty sm:text-left',
		'text-neutral-600 dark:text-neutral-300',
		props.class
	]}
>
	{@render children()}
</p>
