<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { DialogProps } from './type.js';
	import { createDialogContext } from './context.svelte';
	import { tick } from 'svelte';
	import { STYLES } from '$lib/constants/styles.js';

	let {
		open = $bindable(),
		padding = 'none',
		children,
		header,
		footer,
		onclose,
		size = 'lg',
		onOpenChange,
		closedby = 'any',
		aside,
		asideWidth = '320px',
		showGridBackground = false,
		...props
	}: DialogProps = $props();

	const cx = createDialogContext(() => open, { onOpenChange });

	const _onclose = async () => {
		open = false;
		await tick();
		onclose?.();
	};

	(cx as any).onclose = _onclose;

	const paddings: Record<typeof padding, string> = {
		none: 'p-0',
		sm: 'p-4 md:p-4',
		md: 'p-4 md:p-6',
		lg: 'p-4 md:p-8'
	};

	const sizes: Record<typeof size, string> = {
		auto: 'w-auto',
		sm: 'w-full md:max-w-sm',
		md: 'w-full md:max-w-md',
		lg: 'w-full md:max-w-lg',
		xl: 'w-full md:max-w-xl',
		'2xl': 'w-full md:max-w-2xl',
		'3xl': 'w-full md:max-w-3xl',
		'4xl': 'w-full md:max-w-4xl',
		'5xl': 'w-full md:max-w-5xl',
		'6xl': 'w-full md:max-w-6xl',
		'7xl': 'w-full md:max-w-7xl',
		full: 'w-full max-w-full h-full max-h-full'
	};

	const effectiveSize = $derived(cx.is_maximized ? 'full' : size);
	const effectivePadding = $derived(cx.is_minimized ? 'none' : padding);

	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'auto';
		}
	});
</script>

{#if cx.open}
	<dialog
		{...props}
		{closedby}
		onclose={_onclose}
		transition:fly={{ y: 100, duration: 200 }}
		bind:this={cx.ref_dialog}
		aria-modal="true"
		class={[
			'fixed inset-0 z-50 m-0 flex h-full max-h-full w-full max-w-full items-center justify-center p-5 backdrop:p-0',
			'bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-sm',
			'duration-200',
			props.class
		]}
	>
		<div
			class={[
				'flex max-h-[min(90vh,700px)] flex-col overflow-hidden',
				STYLES.SHELL_TRANSPARENT,
				paddings[effectivePadding],
				sizes[effectiveSize],
				effectiveSize !== 'full' && 'rounded-lg'
			]}
		>
			{#if aside}
				<!-- Layout con sidebar (similar a tu React LayoutWithAside) -->
				<div
					class="grid h-full w-full gap-0"
					style={`grid-template-columns: minmax(0, ${asideWidth}) minmax(0, 1fr);`}
				>
					<aside
						class="hidden h-full border-r border-neutral-200/80 bg-white/20 p-4 md:block dark:border-neutral-800/80 dark:bg-black/20"
					>
						<div
							class="h-full overflow-hidden rounded-xl bg-white/70 p-3 ring-1 ring-black/10 dark:bg-neutral-900/60 dark:ring-white/10"
						>
							{@render aside()}
						</div>
					</aside>

					<section class="relative flex h-full flex-1 flex-col overflow-hidden">
						{#if showGridBackground}
							<div
								aria-hidden="true"
								class="pointer-events-none absolute inset-0 opacity-[0.06]"
								style="
									background-image:
										linear-gradient(to bottom, rgba(0,0,0,0.8) 1px, transparent 1px),
										linear-gradient(to right, rgba(0,0,0,0.8) 1px, transparent 1px);
									background-size: 22px 22px;
								"
							></div>
						{/if}

						<div class="relative flex h-full flex-col">
							{#if header}
								{@render header()}
							{/if}

							{@render children()}

							{#if footer}
								{@render footer()}
							{/if}
						</div>
					</section>
				</div>
			{:else}
				<!-- Layout normal sin sidebar -->
				{#if header}
					{@render header()}
				{/if}

				{@render children()}

				{#if footer}
					{@render footer()}
				{/if}
			{/if}
		</div>
	</dialog>
{/if}
