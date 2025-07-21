<script lang="ts">
	import type { IFileInputProps, Props } from './type.js';

	const { onchange, type = 'text', ...props }: Props = $props();
</script>

<input
	{...props}
	{type}
	onchange={(e) => {
		const value = e.currentTarget.value;

		if (type === 'number') {
			const parsed = value.trim() === '' ? null : Number(value);
			(onchange as (value: number | null, e: Event) => void)?.(parsed, e);
		} else if (type === 'file') {
			const inputEl = e.currentTarget as HTMLInputElement;
			const files = inputEl.files;

			const fileValue = (props as IFileInputProps).multiple
				? Array.from(files ?? [])
				: (files?.[0] ?? null);

			(onchange as (value: File | File[] | null, e: Event) => void)?.(fileValue, e);
		} else {
			(onchange as (value: string | null, e: Event) => void)?.(value || null, e);
		}
	}}
	class={[
		'block h-12 w-full rounded-lg border border-gray-300 py-3 font-normal transition-colors placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:ring-offset-gray-800',
		props.class
	]}
/>
