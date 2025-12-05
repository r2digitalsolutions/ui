<script lang="ts" generics="T">
	import { ChevronRight } from 'lucide-svelte';
	import type { AnyAction } from '../core/types.js';

	let active = $state(false);
	let popoverEl: HTMLDivElement | null = null;
	let anchorEl: HTMLButtonElement | null = null;

	interface SubmenuProps<T> {
		action: AnyAction<T>;
		row: T;
		onClose: () => void;
	}

	const { action, row, onClose }: SubmenuProps<T> = $props();

	function openSubmenu(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (!popoverEl || !anchorEl) return;

		popoverEl.style.position = 'fixed';
		popoverEl.showPopover();
		active = true;

		const aRect = anchorEl.getBoundingClientRect();
		const pRect = popoverEl.getBoundingClientRect();
		const margin = 8;

		let left = aRect.right + 4;
		let top = aRect.top;

		if (left + pRect.width + margin > window.innerWidth) {
			left = aRect.left - pRect.width - 4;
		}
		if (top + pRect.height + margin > window.innerHeight) {
			top = Math.max(margin, window.innerHeight - pRect.height - margin);
		}

		popoverEl.style.left = `${left}px`;
		popoverEl.style.top = `${top}px`;
	}

	function closeSubmenu() {
		active = false;
		popoverEl?.hidePopover();
	}

	function handleChildClick(child: AnyAction<T>) {
		if (child.onClick) {
			child.onClick(row);
		}
		onClose();
	}

	function isHidden(action: AnyAction<T>, r: any) {
		return typeof action.hidden === 'function' ? action.hidden(r) : false;
	}
</script>

<button
	bind:this={anchorEl}
	type="button"
	onclick={openSubmenu}
	class="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200/80 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700/80 dark:hover:text-neutral-100"
>
	<ChevronRight class="h-3 w-3" />
</button>

<div
	bind:this={popoverEl}
	popover="manual"
	data-context-host="true"
	class="z-[1400] max-w-xs min-w-[180px] rounded-2xl border border-neutral-200/80 bg-neutral-50/98 p-1 text-[11px] text-neutral-900 shadow-[0_18px_55px_rgba(15,23,42,0.70)] backdrop-blur-2xl dark:border-neutral-700/80 dark:bg-neutral-900/98 dark:text-neutral-50"
	onbeforetoggle={(e) => {
		if ((e as any).newState === 'closed') active = false;
	}}
>
	{#each action.children ?? [] as childRaw, j}
		{@const child = childRaw as AnyAction}
		{#if !isHidden(child, row)}
			{@const label = typeof child.label === 'function' ? child.label(row) : child.label}
			<button
				type="button"
				onclick={() => handleChildClick(child)}
				class={`flex w-full items-center justify-between gap-2 rounded-2xl px-2.5 py-1.5 text-[11px] ${
					child.danger
						? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/40'
						: 'text-neutral-800 hover:bg-neutral-100/90 dark:text-neutral-100 dark:hover:bg-neutral-800/80'
				}`}
			>
				<div class="flex items-center gap-2">
					{#if child.icon}
						{@const Icon = typeof child.icon === 'function' ? child.icon(row) : child.icon}
						<Icon
							class="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-100"
						/>
					{/if}
					<span class="line-clamp-1 text-left">
						{label}
					</span>
				</div>
			</button>
		{/if}
		{#if j < (action.children?.length ?? 0) - 1}
			<div class="mx-1 my-0.5 h-px bg-neutral-200/70 dark:bg-neutral-800/70"></div>
		{/if}
	{/each}
</div>
