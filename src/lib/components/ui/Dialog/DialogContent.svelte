<script lang="ts">
	import type { DialogContentProps } from './type.js';

	let { children, padding = 'md', onkeydown, ...props }: DialogContentProps = $props();

	const paddings: Record<typeof padding, string> = {
		none: 'p-0',
		sm: 'md:px-4 px-4 pb-4',
		md: 'md:px-6 px-4 pb-4',
		lg: 'md:px-8 px-4 pb-4'
	};
</script>

<section
	{...props}
	class={['flex flex-1 flex-col gap-2 overflow-auto', props.class, paddings[padding]]}
	{onkeydown}
>
	{@render children()}
</section>
