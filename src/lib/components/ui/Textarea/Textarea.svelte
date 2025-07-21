<script lang="ts">
	import type { Props } from './type.js';

	const { onchange, rows = 10, ...props }: Props = $props();
</script>

<textarea
	{...props}
	{rows}
	onchange={(e) => {
		const value = e.currentTarget.value;
		(onchange as (value: string | null, e: Event) => void)?.(value || null, e);
	}}
	class={[
		'block w-full rounded-lg border border-gray-300 px-3 py-3 font-normal transition-colors focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:ring-offset-gray-800',
		props.class
	]}
></textarea>
