<script lang="ts">
	import type { DialogFooterProps } from './type.js';

	let { children, position = 'start', ...props }: DialogFooterProps = $props();
</script>

<footer
	class={[
		'flex gap-2 px-6 pb-6',
		props.class,
		position === 'start' && 'justify-start',
		position === 'center' && 'justify-center',
		position === 'end' && 'justify-end'
	]}
>
	{@render children()}
</footer>
