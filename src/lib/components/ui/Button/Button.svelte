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
		'inline-flex items-center justify-center font-medium rounded-xl select-none transition-all duration-150 outline-none cursor-pointer ' +
		'focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ' +
		'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none';

	const variantClasses: Record<typeof variant, string> = {
		primary:
			'bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 text-white ' +
			'shadow-sm shadow-indigo-500/30 hover:brightness-105 hover:shadow-md hover:shadow-indigo-500/40',

		secondary:
			'bg-neutral-900 text-neutral-50 shadow-sm hover:bg-neutral-800 ' +
			'dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200',

		outline:
			'border border-neutral-300 bg-white/80 text-neutral-800 hover:bg-neutral-100 ' +
			'dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-50 dark:hover:bg-neutral-800',

		ghost:
			'bg-transparent text-neutral-700 hover:bg-neutral-100/70 shadow-none ' +
			'dark:text-neutral-200 dark:hover:bg-neutral-800/70',

		gradient:
			'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 text-white ' +
			'shadow-sm shadow-fuchsia-500/30 hover:brightness-105 hover:shadow-md hover:shadow-fuchsia-500/40',

		danger:
			'bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 text-white ' +
			'shadow-sm shadow-red-500/30 hover:brightness-105 hover:shadow-md hover:shadow-red-500/40',

		success:
			'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white ' +
			'shadow-sm shadow-emerald-500/30 hover:brightness-105 hover:shadow-md hover:shadow-emerald-500/40',

		warning:
			'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-neutral-900 ' +
			'shadow-sm shadow-amber-500/30 hover:brightness-105 hover:shadow-md hover:shadow-amber-500/40',

		info:
			'bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white ' +
			'shadow-sm shadow-sky-500/30 hover:brightness-105 hover:shadow-md hover:shadow-sky-500/40'
	};

	const sizeClasses: Record<typeof size, string> = {
		xs: 'px-1.5 py-0.5 text-[11px] gap-1',
		sm: 'px-2 py-1 text-xs gap-1',
		md: 'px-2.5 py-1.5 text-sm gap-1.5',
		lg: 'px-3 py-2 text-sm gap-2',
		xl: 'px-4 py-2.5 text-base gap-2',
		'2xl': 'px-5 py-3 text-base gap-2.5',
		'3xl': 'px-6 py-3 text-base gap-3',
		'4xl': 'px-7 py-3 text-base gap-3',
		'5xl': 'px-8 py-3 text-base gap-3',
		'6xl': 'px-9 py-3 text-base gap-3',
		'7xl': 'px-10 py-3 text-base gap-3',
		'8xl': 'px-11 py-3 text-base gap-3'
	};

	const isDisabled = $derived(Boolean(disabled || isLoading));
	const Tag = $derived(props.href ? 'a' : 'button');

	const classes: ClassValue = $derived([
		baseClasses,
		variantClasses[variant],
		sizeClasses[size],
		isDisabled && 'pointer-events-none',
		props.class
	]);
</script>

<svelte:element
	this={Tag}
	{...props}
	type={Tag === 'button' ? type : undefined}
	class={classes}
	disabled={Tag === 'button' ? isDisabled : undefined}
	aria-disabled={isDisabled ? 'true' : undefined}
	aria-busy={isLoading ? 'true' : undefined}
>
	{#if isLoading}
		<Loading />
	{:else}
		{@render children()}
	{/if}
</svelte:element>
