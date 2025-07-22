<script lang="ts">
	import type { Props } from './type.js';

	const { selected, children, ...props }: Props = $props();
</script>

<button
	{...props}
	type="button"
	class={[
		'cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors',
		selected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
		props.class
	]}
>
	{@render children()}
</button>
