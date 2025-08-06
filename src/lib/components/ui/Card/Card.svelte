<script lang="ts">
	import type { Props } from './type.js';
	import CardFooter from './CardFooter.svelte';
	import CardHeader from './CardHeader.svelte';

	const { children, footer, header, onclick, body_class, ...props }: Props = $props();
</script>

<svelte:element
	this={onclick ? 'button' : 'article'}
	{...props}
	role="button"
	type={onclick ? 'button' : undefined}
	tabindex="0"
	aria-label="Card"
	{onclick}
	class={[
		'rounded-3xl border border-white/50 bg-white text-black shadow-sm backdrop-blur-xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-white',
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
