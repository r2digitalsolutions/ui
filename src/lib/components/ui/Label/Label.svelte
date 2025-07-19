<script lang="ts">
	import type { Props } from './type.js';

	let { children, ...props }: Props = $props();
</script>

<label
	{...props}
	class={[
		'cursor-pointer text-sm font-bold text-gray-600 select-none dark:text-gray-200',
		props.class
	]}
>
	{@render children()}
</label>
