<script lang="ts">
	import type { Props } from './type.js';
	const { title, subtitle, children, icon: Icon, ...props }: Props = $props();
</script>

<div
	class={[
		'flex w-full flex-col items-center justify-center px-4 py-20 text-center',
		'rounded-2xl border border-neutral-200/80 bg-white/70 shadow-sm shadow-black/5 backdrop-blur-md',
		'dark:border-neutral-800/80 dark:bg-neutral-950/80',
		props.class
	]}
>
	{#if Icon}
		<div
			class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full
            bg-linear-to-br from-indigo-100 via-purple-100 to-blue-100
            shadow-inner ring-1 shadow-white/40
            ring-white/40 ring-inset dark:from-indigo-900/30
            dark:via-purple-900/30 dark:to-blue-900/30 dark:shadow-black/20 dark:ring-white/5"
		>
			<Icon
				class="h-12 w-12 text-neutral-400 opacity-90 transition-transform duration-300 group-hover:scale-105 dark:text-neutral-500"
			/>
		</div>
	{/if}

	<h3
		class="text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl dark:text-neutral-50"
	>
		{title}
	</h3>

	{#if subtitle}
		<p class="mx-auto mt-2 max-w-md text-sm text-neutral-600 md:text-base dark:text-neutral-400">
			{subtitle}
		</p>
	{/if}

	{#if children}
		<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
			{@render children?.()}
		</div>
	{/if}
</div>
