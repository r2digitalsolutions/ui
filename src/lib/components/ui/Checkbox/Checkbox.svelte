<script lang="ts">
	import type { Props } from './type.js';

	let {
		name,
		label,
		required,
		checked,
		disabled,
		value,
		group = $bindable([]),
		onchange,
		...props
	}: Props = $props();
</script>

<input
	{...props}
	{required}
	bind:checked
	{value}
	type="checkbox"
	{name}
	class="shrink-0 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:checked:border-blue-500 dark:checked:bg-blue-500 dark:focus:ring-offset-gray-800"
	onchange={(e) => {
		const checked = e.currentTarget.checked;
		const value = e.currentTarget.value;

		onchange?.(Boolean(checked ?? false), value ?? null);
	}}
/>

{#if label}
	<span class="sr-only">{label}</span>
{/if}
