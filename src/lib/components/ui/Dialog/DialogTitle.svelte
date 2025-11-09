<script lang="ts">
	import type { DialogTitleProps } from './type.js';

	const { children, ...props }: DialogTitleProps = $props();
</script>

<h2
	class={[
		'text-center text-2xl font-bold sm:text-left',
		'text-neutral-900 dark:text-neutral-50',
		props.class
	]}
>
	{@render children()}
</h2>
