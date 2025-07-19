<script lang="ts">
	import Label from '../Label/Label.svelte';
	import type { Props } from './type.js';

	const {
		label,
		children,
		errors,
		direction = 'col',
		required = false,
		...props
	}: Props = $props();
</script>

<Label
	class={[
		{
			'flex-row items-center': direction === 'row',
			'flex-row-reverse items-center justify-end': direction === 'row-reverse',
			'flex-col': direction === 'col',
			'flex-col-reverse items-center': direction === 'col-reverse'
		},
		{
			'field--errors': Boolean(errors?.length)
		},
		'flex w-full gap-2',
		props.class
	]}
>
	{#if label}
		<span class="block text-sm font-bold text-gray-600 dark:text-gray-200">
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</span>
	{/if}
	{@render children()}
	{#if errors?.length}
		<div class="flex flex-col">
			{#each errors as error}
				<p class="text-xs text-red-500">{error}</p>
			{/each}
		</div>
	{/if}
</Label>

<style lang="postcss">
	:global(.field--errors) {
		span {
			color: var(--color-red-500);
		}
		:global(input, textarea, select, .select-multiple) {
			border: 1px solid var(--color-red-500) !important;
		}
	}
</style>
