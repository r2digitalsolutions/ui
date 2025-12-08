<script lang="ts">
	import { i18n } from '$lib/settings/index.js';
	import { Check, Plus, ChevronRight } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		description?: string;

		selected?: boolean;
		hasChildren?: boolean;

		size?: 'sm' | 'md';
		accent?: 'purple' | 'indigo' | 'sky' | 'neutral';

		showLeadingCircle?: boolean;
		showSelectedBadge?: boolean;
		showChevronForChildren?: boolean;

		compact?: boolean;
		disabled?: boolean;

		onclick?: () => void;

		meta?: Snippet;
		right?: Snippet;
	}

	const {
		label,
		description = '',
		selected = false,
		hasChildren = false,
		size = 'md',
		accent = 'purple',

		showLeadingCircle = true,
		showSelectedBadge = true,
		showChevronForChildren = true,

		compact = false,
		disabled = false,

		onclick,
		meta,
		right
	}: Props = $props();

	const sizeClasses = $derived(
		{
			sm: 'px-2.5 py-1.5 text-[13px]',
			md: 'px-3 py-2 text-sm'
		}[size]
	);

	const leadingSizeClasses = $derived(
		{
			sm: 'h-6 w-6',
			md: 'h-7 w-7'
		}[size]
	);

	const labelTextSize = $derived(compact ? 'text-[13px]' : 'text-[13px]');
	const descriptionTextSize = $derived(compact ? 'text-[11px]' : 'text-[11px]');

	const accentMap = {
		purple: {
			selectedBorder: 'border-purple-400/70 dark:border-purple-500/60',
			selectedBg: 'bg-purple-50 dark:bg-purple-950/40',
			selectedText: 'text-neutral-900 dark:text-neutral-50',

			badgeBg: 'bg-white/85 dark:bg-purple-200/10',
			badgeText: 'text-purple-700 dark:text-purple-100',

			leadingSelectedBg: 'bg-purple-500/90 dark:bg-purple-500',
			leadingSelectedBorder: 'border-purple-400/70 dark:border-purple-400/80'
		},
		indigo: {
			selectedBorder: 'border-indigo-400/70 dark:border-indigo-500/60',
			selectedBg: 'bg-indigo-50 dark:bg-indigo-950/40',
			selectedText: 'text-neutral-900 dark:text-neutral-50',

			badgeBg: 'bg-white/85 dark:bg-indigo-200/10',
			badgeText: 'text-indigo-700 dark:text-indigo-100',

			leadingSelectedBg: 'bg-indigo-500/90 dark:bg-indigo-500',
			leadingSelectedBorder: 'border-indigo-400/70 dark:border-indigo-400/80'
		},
		sky: {
			selectedBorder: 'border-sky-400/70 dark:border-sky-500/60',
			selectedBg: 'bg-sky-50 dark:bg-sky-950/40',
			selectedText: 'text-neutral-900 dark:text-neutral-50',

			badgeBg: 'bg-white/85 dark:bg-sky-200/10',
			badgeText: 'text-sky-700 dark:text-sky-100',

			leadingSelectedBg: 'bg-sky-500/90 dark:bg-sky-500',
			leadingSelectedBorder: 'border-sky-400/70 dark:border-sky-400/80'
		},
		neutral: {
			selectedBorder: 'border-neutral-400/70 dark:border-neutral-500/60',
			selectedBg: 'bg-neutral-100 dark:bg-neutral-900',
			selectedText: 'text-neutral-900 dark:text-neutral-50',

			badgeBg: 'bg-white/85 dark:bg-neutral-800',
			badgeText: 'text-neutral-800 dark:text-neutral-100',

			leadingSelectedBg: 'bg-neutral-700 dark:bg-neutral-700',
			leadingSelectedBorder: 'border-neutral-500/70 dark:border-neutral-500/80'
		}
	} as const;

	const accentClasses = $derived(accentMap[accent]);
</script>

<button
	type="button"
	{disabled}
	onclick={() => onclick?.()}
	class={[
		'flex w-full items-center justify-between gap-3 rounded-lg border text-left transition-colors',
		sizeClasses,
		'focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:outline-none',
		!disabled && 'cursor-pointer',
		'disabled:cursor-not-allowed disabled:opacity-60',

		selected
			? [
					accentClasses.selectedBorder,
					accentClasses.selectedBg,
					accentClasses.selectedText,
					'shadow-sm',
					'hover:brightness-[0.98] dark:hover:brightness-[1.05]'
				]
			: [
					'border-neutral-200 bg-neutral-50 text-neutral-800',
					'hover:border-neutral-300 hover:bg-neutral-100',
					'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
					'dark:hover:border-neutral-600 dark:hover:bg-neutral-800'
				]
	]}
>
	<div class="flex min-w-0 flex-1 items-center gap-3">
		{#if showLeadingCircle}
			<div
				class={[
					'flex shrink-0 items-center justify-center rounded-full border text-xs font-medium shadow-sm',
					leadingSizeClasses,
					selected
						? [accentClasses.leadingSelectedBg, accentClasses.leadingSelectedBorder, 'text-white']
						: 'border-neutral-300 bg-white text-neutral-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300'
				]}
			>
				{#if selected}
					<Check class="h-3.5 w-3.5" />
				{:else}
					<Plus class="h-3.5 w-3.5" />
				{/if}
			</div>
		{/if}

		<div class="flex min-w-0 flex-col">
			<span class={`truncate font-medium ${labelTextSize}`}>
				{label}
			</span>

			{#if description}
				<span
					class={`mt-0.5 truncate ${descriptionTextSize} ${
						selected
							? 'text-neutral-600 dark:text-neutral-300'
							: 'text-neutral-500 dark:text-neutral-400'
					}`}
				>
					{description}
				</span>
			{/if}

			{@render meta?.()}
		</div>
	</div>

	<div class="flex shrink-0 items-center gap-2">
		{#if selected && showSelectedBadge}
			<span
				class={[
					'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur',
					accentClasses.badgeBg,
					accentClasses.badgeText
				]}
			>
				<Check class="h-3 w-3" />
				<span>{i18n.t('common.selected')}</span>
			</span>
		{/if}

		{@render right?.()}

		{#if hasChildren && showChevronForChildren}
			<div
				class="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900/5 text-neutral-400 dark:bg-neutral-50/5 dark:text-neutral-500"
			>
				<ChevronRight class="h-4 w-4" />
			</div>
		{/if}
	</div>
</button>
