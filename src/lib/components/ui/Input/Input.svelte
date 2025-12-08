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
		'block h-12 w-full rounded-lg px-3 py-2 text-sm transition-colors outline-none',
		'border border-neutral-300 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400',
		'hover:border-neutral-400',
		'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30',
		'disabled:cursor-not-allowed disabled:opacity-50',
		'read-only:border-neutral-300 read-only:bg-neutral-100 read-only:text-neutral-500',
		'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500',
		'dark:hover:border-neutral-600',
		'dark:focus:border-purple-400 dark:focus:ring-purple-400/30',
		'dark:read-only:border-neutral-700 dark:read-only:bg-neutral-800 dark:read-only:text-neutral-400',

		props.class
	]}
/>
