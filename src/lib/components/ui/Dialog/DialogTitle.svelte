<script lang="ts">
	import type { DialogTitleProps } from './type.js';

	const { children, ...props }: DialogTitleProps = $props();
</script>

<h2 class={['text-center text-2xl font-bold sm:text-left dark:text-white', props.class]}>
	{@render children()}
</h2>
