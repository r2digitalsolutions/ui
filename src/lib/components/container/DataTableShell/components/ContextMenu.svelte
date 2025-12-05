<script lang="ts" generics="T">
	import type { AnyAction, RowAction } from '../core/types.js';
	import Submenu from './Submenu.svelte';

	interface Props<T> {
		actions: RowAction<T>[];
		row: T;
		onClose: () => void;
	}

	const { actions, row, onClose }: Props<T> = $props();

	function isHidden(action: AnyAction<T>, r: T) {
		return typeof action.hidden === 'function' ? action.hidden(r) : false;
	}

	function hasChildren(action: AnyAction<T>) {
		return Array.isArray(action.children) && action.children.length > 0;
	}

	function handleClick(action: AnyAction<T>) {
		if (action.onClick) {
			action.onClick(row);
		}
		onClose();
	}
</script>

<div
	class="max-h-[320px] min-w-[200px] overflow-auto rounded-2xl bg-gradient-to-br from-neutral-50/98 via-white/98 to-neutral-100/98 p-1 text-xs text-neutral-900 shadow-[0_18px_55px_rgba(15,23,42,0.65)] backdrop-blur-2xl dark:from-neutral-900/98 dark:via-neutral-950/98 dark:to-neutral-950/98 dark:text-neutral-50"
>
	{#each actions as actionRaw, i}
		{@const action = actionRaw as AnyAction}
		{#if !isHidden(action, row)}
			{@const label = typeof action.label === 'function' ? action.label(row) : action.label}

			<div class="relative" data-context-host="true">
				<button
					type="button"
					onclick={() => !hasChildren(action) && handleClick(action)}
					class={`group flex w-full items-center justify-between gap-2 rounded-2xl px-2.5 py-1.5 text-[11px] transition-colors ${
						action.danger
							? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/40'
							: 'text-neutral-800 hover:bg-neutral-100/90 dark:text-neutral-100 dark:hover:bg-neutral-800/80'
					}`}
				>
					<div class="flex items-center gap-2">
						{#if action.icon}
							{@const Icon = typeof action.icon === 'function' ? action.icon(row) : action.icon}
							<Icon
								class="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-100"
							></Icon>
						{/if}
						<span class="line-clamp-1 text-left">
							{label}
						</span>
					</div>

					{#if hasChildren(action)}
						<Submenu {action} {row} {onClose} />
					{/if}
				</button>
			</div>
		{/if}

		{#if i < actions.length - 1}
			<div class="mx-1 my-0.5 h-px bg-neutral-200/70 dark:bg-neutral-800/70"></div>
		{/if}
	{/each}
</div>
