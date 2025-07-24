<script lang="ts">
	import type { Props } from './type.js';
	import { X } from 'lucide-svelte';
	const {
		children,
		onclose,
		color = 'primary',
		variant = 'solid',
		shadow = 'sm',
		onclick,
		href,
		...props
	}: Props = $props();

	const shadows: Record<typeof shadow, string> = {
		none: '',
		sm: 'shadow-sm',
		md: 'shadow-md',
		lg: 'shadow-lg',
		xl: 'shadow-xl'
	};

	const type = $derived(variant === 'outline' ? 'border' : 'bg');

	const colors: Record<typeof color, string> = $derived({
		primary: `${type}-primary text-gray-100`,
		teal: `${type}-teal-200 text-teal-800`,
		secondary: `${type}-gray-800 text-white`,
		danger: `${type}-red-500 text-white`,
		white: `${type}-white text-black`,
		info: `${type}-blue-500 text-whit`,
		outline: `${type}-gray-200 text-gray-800`,
		default: `${type}-gray-800 text-white`
	});

	const variants: Record<typeof variant, string> = $derived({
		solid: colors[color],
		outline: 'border border-gray-200'
	});
</script>

<a
	href={onclick ? href : undefined}
	tabindex="0"
	class={[
		'inline-flex w-fit items-center gap-x-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
		props.class,
		shadows[shadow],
		variants[variant]
	]}
	{onclick}
>
	{@render children()}
	{#if onclose}
		<button
			class="bg-opacity-75 hover:bg-opacity-100 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-teal-200 text-teal-500 hover:bg-teal-200 dark:bg-teal-500/10 dark:text-teal-500"
			onclick={onclose}
		>
			<X class="h-3 w-3" />
		</button>
	{/if}
</a>
