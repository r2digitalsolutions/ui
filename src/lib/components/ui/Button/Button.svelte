<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import type { Props } from './type.js';
	import Loading from '../Loading/Loading.svelte';

	const {
		variant = 'primary',
		size = 'md',
		type = 'button',
		isLoading = false,
		children,
		disabled,
		...props
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center font-semibold rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer';

	const variantClasses: Record<typeof variant, string> = {
		primary:
			'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500 shadow-purple-500/25',
		secondary:
			'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500 shadow-gray-500/25',
		outline:
			'border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white focus:ring-purple-500 bg-white/80 backdrop-blur-sm hover:border-purple-700',
		ghost:
			'text-purple-600 hover:bg-purple-50 hover:text-purple-700 focus:ring-purple-500 bg-transparent shadow-none hover:shadow-md',
		gradient:
			'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 focus:ring-purple-500 shadow-purple-500/30',
		danger:
			'bg-gradient-to-r from-red-500 via-purple-500 to-indigo-500 text-white hover:from-red-600 hover:via-purple-600 hover:to-indigo-600 focus:ring-purple-500 shadow-purple-500/30',
		success:
			'bg-gradient-to-r from-green-500 via-purple-500 to-indigo-500 text-white hover:from-green-600 hover:via-purple-600 hover:to-indigo-600 focus:ring-purple-500 shadow-purple-500/30',
		warning:
			'bg-gradient-to-r from-yellow-500 via-purple-500 to-indigo-500 text-white hover:from-yellow-600 hover:via-purple-600 hover:to-indigo-600 focus:ring-purple-500 shadow-purple-500/30',
		info: 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 focus:ring-purple-500 shadow-purple-500/30'
	};

	const sizeClasses: Record<typeof size, string> = {
		xs: 'px-1.5 py-0.5 text-xs gap-0.5',
		sm: 'px-2 py-1 text-xs gap-1 text-xs',
		md: 'px-2.5 py-1.5 text-sm gap-1.5',
		lg: 'px-3 py-2 text-sm gap-2',
		xl: 'px-4 py-2.5 text-base gap-2',
		'2xl': 'px-5 py-3 text-base gap-3',
		'3xl': 'px-6 py-3 text-base gap-3',
		'4xl': 'px-7 py-3 text-base gap-3',
		'5xl': 'px-8 py-3 text-base gap-3',
		'6xl': 'px-9 py-3 text-base gap-3',
		'7xl': 'px-10 py-3 text-base gap-3',
		'8xl': 'px-11 py-3 text-base gap-3'
	};

	const classes: ClassValue = $derived([
		baseClasses,
		variantClasses[variant],
		sizeClasses[size],
		disabled || isLoading ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100' : '',
		props.class
	]);

	const Tag = $derived(props.href ? 'a' : 'button');
</script>

<svelte:element this={Tag} {...props} {type} class={classes} disabled={disabled || isLoading}>
	{#if isLoading}
		<Loading />
	{:else}
		{@render children()}
	{/if}
</svelte:element>
