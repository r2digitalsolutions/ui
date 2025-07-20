<script lang="ts">
	import type { Props } from './type.js';
	import { Circle } from 'lucide-svelte';

	let { children, name, group = $bindable(), value, ...props }: Props = $props();
</script>

<input aria-hidden="true" {name} tabindex="-1" type="radio" {value} bind:group class="hidden" />

<div class="flex items-center gap-2">
	<span
		role="radio"
		aria-checked="true"
		class="border-primary text-primary ring-offset-background focus-visible:ring-ring mr-1 flex aspect-square h-4 w-4 items-center justify-center rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		aria-describedby="«rl»-form-item-description"
		tabindex="-1"
	>
		<span class="flex items-center justify-center">
			{#if group === value}
				<Circle class={`bg-primary h-2 w-2 rounded-full transition`} />
			{/if}
		</span>
	</span>
	{@render children()}
</div>
