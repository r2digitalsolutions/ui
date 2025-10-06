<script lang="ts">
	import type { TContextMenuEntry } from '../core/types.js';

	type Props = {
		items?: TContextMenuEntry[];
		x?: number;
		y?: number;
		open?: boolean;
		title?: string;
		searchable?: boolean;
		context?: any;
	};
	let {
		items = [],
		x = 0,
		y = 0,
		open = $bindable(false),
		title = '',
		searchable = true,
		context = null
	}: Props = $props();

	let stack = $state<{ label: string; items: TContextMenuEntry[] }[]>([]);
	let q = $state('');
	const current = $derived(stack.length ? stack[stack.length - 1] : { label: title, items });

	let menuEl: HTMLDivElement | null = $state(null);

	function close() {
		if (menuEl) menuEl.hidePopover();
		open = false;
		stack = [];
		q = '';
		x = 0;
		y = 0;
	}

	function hasChildren(it: TContextMenuEntry) {
		return !!(it.children && it.children.length);
	}

	function clickItem(it: TContextMenuEntry) {
		if (it.disabled) return;
		if (hasChildren(it)) {
			stack.push({ label: it.label ?? '', items: it.children! });
			q = '';
			return;
		}
		if (it.kind !== 'divider' && it.kind !== 'label') {
			it.onClick?.();
			close();
		}
	}

	function matches(it: TContextMenuEntry, query: string): boolean {
		if (it.kind === 'divider') return true;
		const lbl = (it.label ?? '').toLowerCase();
		if (lbl.includes(query)) return true;
		if (hasChildren(it)) return it.children!.some((c) => matches(c, query));
		return false;
	}

	const filtered = $derived.by(() => {
		const list = current.items ?? [];
		const query = q.trim().toLowerCase();
		let arr = query ? list.filter((it) => matches(it, query)) : list.slice();
		const out: TContextMenuEntry[] = [];
		let prevDiv = false;
		for (const it of arr) {
			if (it.kind === 'divider') {
				if (out.length === 0 || prevDiv) continue;
				prevDiv = true;
				out.push(it);
			} else {
				prevDiv = false;
				out.push(it);
			}
		}
		if (out.length && out[out.length - 1].kind === 'divider') out.pop();
		return out;
	});

	function back() {
		if (stack.length) {
			stack.pop();
			q = '';
		}
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (stack.length) back();
			else close();
		} else if (e.key === 'Backspace' && q === '' && stack.length) {
			back();
		}
	}

	// Manage popover open/close
	$effect(() => {
		if (!menuEl) return;
		if (open) {
			menuEl.style.setProperty('--popover-x', `${x}px`);
			menuEl.style.setProperty('--popover-y', `${y}px`);
			menuEl.showPopover();
		} else {
			menuEl.hidePopover();
		}
	});

	// Clamp position to viewport
	$effect(() => {
		if (!open || !menuEl) return;
		requestAnimationFrame(() => {
			if (!menuEl) return;
			const rect = menuEl.getBoundingClientRect();
			const vw = document.documentElement.clientWidth;
			const vh = document.documentElement.clientHeight;
			let nx = x;
			let ny = y;
			const padding = 8;
			if (nx + rect.width + padding > vw) nx = Math.max(padding, vw - rect.width - padding);
			if (ny + rect.height + padding > vh) ny = Math.max(padding, vh - rect.height - padding);
			if (nx !== x || ny !== y) {
				x = nx;
				y = ny;
				menuEl.style.setProperty('--popover-x', `${nx}px`);
				menuEl.style.setProperty('--popover-y', `${ny}px`);
			}
		});
	});
</script>

{#if open}
	<div
		bind:this={menuEl}
		popover="manual"
		class="w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 dark:bg-gray-900"
		style="position: fixed; left: var(--popover-x); top: var(--popover-y);"
		oncontextmenu={(e) => e.preventDefault()}
		onkeydown={onKey}
	>
		<div class="flex items-center gap-1 px-1 py-1">
			{#if stack.length > 0}
				<button
					class="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
					aria-label="Atrás"
					onclick={back}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="15 18 9 12 15 6" />
					</svg>
				</button>
			{/if}
			<div class="min-w-0 flex-1 truncate px-1 text-xs font-medium opacity-70">
				{current.label || title}
			</div>
			{#if searchable}
				<input
					class="w-28 rounded-lg border border-gray-200 px-2 py-1 text-xs dark:border-gray-800 dark:bg-gray-950"
					placeholder="Buscar…"
					bind:value={q}
				/>
			{/if}
		</div>

		<div
			class="max-h-72 overflow-auto rounded-xl border border-gray-200 p-1 dark:border-gray-800 dark:bg-gray-950"
		>
			{#each filtered as it}
				{#if it.kind === 'divider'}
					<div class="my-1 border-t border-gray-200 dark:border-gray-800"></div>
				{:else if it.kind === 'label'}
					<div class="px-3 py-1 text-[11px] tracking-wide uppercase opacity-60">{it.label}</div>
				{:else}
					<button
						class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
						disabled={it.disabled}
						onclick={() => clickItem(it)}
					>
						<span class="truncate">{it.label}</span>
						<span class="flex items-center gap-2">
							{#if it.shortcut}
								<kbd class="rounded bg-gray-100 px-1 text-[10px] dark:bg-gray-800">
									{it.shortcut}
								</kbd>
							{/if}
							{#if hasChildren(it)}
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									class="opacity-60"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="9 18 15 12 9 6" />
								</svg>
							{/if}
						</span>
					</button>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<style lang="postcss">
	[popover] {
		margin: 0;
		border: none;
		padding: 0;
		z-index: 2147483647;
	}
</style>
