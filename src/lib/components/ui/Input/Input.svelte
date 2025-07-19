<script lang="ts">
	import type { FileInputProps, Props } from './type.js';

	const { onchange, type = 'text', ...props }: Props = $props();
</script>

<input
	{...props}
	onchange={(e) => {
		const value = e.currentTarget.value;

		if (type === 'number') {
			const parsed = value.trim() === '' ? null : Number(value);
			(onchange as (value: number | null, e: Event) => void)?.(parsed, e);
		} else if (type === 'file') {
			const inputEl = e.currentTarget as HTMLInputElement;
			const files = inputEl.files;

			const fileValue = (props as FileInputProps).multiple
				? Array.from(files ?? [])
				: (files?.[0] ?? null);

			(onchange as (value: File | File[] | null, e: Event) => void)?.(fileValue, e);
		} else {
			(onchange as (value: string | null, e: Event) => void)?.(value || null, e);
		}
	}}
	class="block w-full rounded-lg border border-gray-300 py-3 pr-3 pl-10 transition-colors focus:border-transparent focus:ring-2 focus:ring-purple-500"
/>
