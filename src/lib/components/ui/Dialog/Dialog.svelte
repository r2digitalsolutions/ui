<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { DialogProps } from './type.js';
	import { createDialogContext } from './context.svelte';
	import { tick } from 'svelte';

	let {
		open = $bindable(),
		padding = 'md',
		children,
		header,
		footer,
		onclose,
		size = 'lg',
		onOpenChange,
		closedby = 'any',
		...props
	}: DialogProps = $props();

	const cx = createDialogContext(() => open, { onOpenChange });

	const _onclose = async () => {
		open = false;
		await tick();
		onclose?.();
	};

	const paddings: Record<typeof padding, string> = {
		none: 'p-0',
		sm: 'md:p-4 p-4',
		md: 'md:p-6 p-4',
		lg: 'md:p-8 p-4'
	};

	const sizes: Record<typeof size, string> = {
		auto: 'w-auto',
		sm: 'w-full md:max-w-sm',
		md: 'w-full md:max-w-md',
		lg: 'w-full md:max-w-lg',
		xl: 'w-full md:max-w-xl',
		'2xl': 'w-full md:max-w-2xl',
		'3xl': 'w-full md:max-w-3xl',
		'4xl': 'w-full md:max-w-4xl',
		'5xl': 'w-full md:max-w-5xl',
		'6xl': 'w-full md:max-w-6xl',
		'7xl': 'w-full md:max-w-7xl',
		full: 'w-full md:max-w-full h-full md:h-full'
	};

	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'auto';
		}
	});
</script>

{#if cx.open}
	<dialog
		{...props}
		{closedby}
		onclose={_onclose}
		transition:fly={{ y: 100, duration: 200 }}
		bind:this={cx.ref_dialog}
		aria-modal="true"
		class={[
			'fixed inset-0 flex h-full max-h-full w-full max-w-full flex-col gap-4 overflow-hidden bg-white shadow-lg duration-200 backdrop:bg-black/50 backdrop:backdrop-blur-xs md:m-auto md:h-fit dark:border-gray-600 dark:bg-gray-800',
			props.class,
			// paddings[padding],
			sizes[size],
			{
				'sm:rounded-lg': size !== 'full'
			}
		]}
	>
		{#if header}
			{@render header()}
		{/if}
		{@render children()}
		{#if footer}
			{@render footer()}
		{/if}
	</dialog>
{/if}
