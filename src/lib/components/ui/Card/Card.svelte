<script lang="ts">
	import type { Props } from './type.js';
	import CardFooter from './CardFooter.svelte';
	import CardHeader from './CardHeader.svelte';

	const { children, footer, header, onclick, body_class, ...props }: Props = $props();

	const isInteractive = $derived(typeof onclick === 'function');
	const Tag = $derived(isInteractive ? 'button' : 'article');
</script>

<svelte:element
	this={Tag}
	{...props}
	{onclick}
	type={isInteractive ? 'button' : undefined}
	role={isInteractive ? 'button' : undefined}
	tabindex={isInteractive ? 0 : undefined}
	data-interactive={isInteractive}
	class={[
		'relative flex flex-col overflow-hidden rounded-2xl border text-sm',
		'border-neutral-200/80 bg-white/80 text-neutral-900 shadow-sm shadow-black/5 backdrop-blur-xl',
		'dark:border-neutral-800/80 dark:bg-neutral-950/80 dark:text-neutral-50',

		isInteractive &&
			'cursor-pointer transition-all duration-150 hover:-translate-y-px hover:border-neutral-300 hover:shadow-md hover:shadow-black/10 dark:hover:border-neutral-600',
		isInteractive &&
			'focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none',

		props.class
	]}
>
	{#if header}
		<CardHeader>
			{@render header()}
		</CardHeader>
	{/if}

	<section class={['flex flex-1 flex-col', body_class]}>
		{@render children()}
	</section>

	{#if footer}
		<CardFooter>
			{@render footer()}
		</CardFooter>
	{/if}
</svelte:element>
