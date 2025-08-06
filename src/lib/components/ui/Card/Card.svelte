<script lang="ts">
	import type { Props } from './type.js';

	const { children, footer, header, onclick, ...props }: Props = $props();
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
		<header class="flex flex-row p-6 pb-2">
			{@render header()}
		</header>
	{/if}

	<section class={['flex flex-1 flex-col', props.body_class]}>
		{@render children()}
	</section>

	{#if footer}
		<footer
			class="flex justify-between rounded-b-xl border-t border-gray-200 bg-gray-50 p-3 pt-2 dark:border-neutral-700 dark:bg-neutral-800"
		>
			{@render footer()}
		</footer>
	{/if}
</svelte:element>
