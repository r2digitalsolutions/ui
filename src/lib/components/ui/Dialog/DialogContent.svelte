<script lang="ts">
	import type { DialogContentProps } from './type.js';

	let { children, padding = 'md', onkeydown, ...props }: DialogContentProps = $props();

	const paddings: Record<typeof padding, string> = {
		none: 'p-0',
		sm: 'md:p-4 p-4',
		md: 'md:p-6 p-4',
		lg: 'md:p-8 p-4'
	};
</script>

<section
	{...props}
	class={['flex flex-1 flex-col gap-2 overflow-auto', props.class, paddings[padding]]}
	{onkeydown}
>
	{@render children()}
</section>
