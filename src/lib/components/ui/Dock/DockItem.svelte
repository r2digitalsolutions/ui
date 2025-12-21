<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		as?: 'button' | 'a';
		href?: string;
		onclick?: (e: MouseEvent) => void;
		disabled?: boolean;
		active?: boolean;
		size?: 'mini' | 'sm' | 'md';
		ariaLabel?: string;
		class?: ClassValue;
		children?: Snippet;
	};

	const {
		as = 'button',
		href,
		onclick,
		disabled,
		active = false,
		size = 'mini',
		ariaLabel,
		children,
		...props
	}: Props = $props();

	const sizes: Record<NonNullable<Props['size']>, string> = {
		mini: 'h-7 px-2 text-[11px]',
		sm: 'h-8 px-2.5 text-xs',
		md: 'h-9 px-3 text-sm'
	};

	const base =
		'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none transition-all duration-150 ' +
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60';

	const disabledCls = disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer';

	const inactive =
		'text-neutral-700 hover:bg-white/70 hover:text-neutral-900 ' +
		'dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-neutral-50';

	const activeCls =
		'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200/70 ' +
		'dark:bg-neutral-900/80 dark:text-neutral-50 dark:ring-neutral-800/70';
</script>

{#if as === 'a' || href}
	<a
		{href}
		aria-label={ariaLabel}
		data-active={active || undefined}
		class={[
			base,
			sizes[size],
			active ? activeCls : inactive,

			// ===== ACTIVE radius =====
			'[&[data-active]:first-child]:rounded-l-full',
			'[&[data-active]:last-child]:rounded-r-full',
			// middle: SIN rounded
			'[&[data-active]:not(:first-child):not(:last-child)]:rounded-none',

			// ===== HOVER radius (solo si NO está activo) =====
			'[&:not([data-active]):first-child:hover]:rounded-l-full',
			'[&:not([data-active]):last-child:hover]:rounded-r-full',
			// middle hover: SIN rounded
			'[&:not([data-active]):not(:first-child):not(:last-child):hover]:rounded-none',

			disabledCls,
			props.class
		]}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		type="button"
		{disabled}
		aria-label={ariaLabel}
		data-active={active || undefined}
		{onclick}
		class={[
			base,
			sizes[size],
			active ? activeCls : inactive,

			'[&[data-active]:first-child]:rounded-l-full',
			'[&[data-active]:last-child]:rounded-r-full',
			'[&[data-active]:not(:first-child):not(:last-child)]:rounded-none',

			'[&:not([data-active]):first-child:hover]:rounded-l-full',
			'[&:not([data-active]):last-child:hover]:rounded-r-full',
			'[&:not([data-active]):not(:first-child):not(:last-child):hover]:rounded-none',

			disabledCls,
			props.class
		]}
	>
		{@render children?.()}
	</button>
{/if}
