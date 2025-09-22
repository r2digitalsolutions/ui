<script module lang="ts">
	export type Entry = {
		id: string;
		label?: string;
		shortcut?: string;
		onClick?: () => void;
		disabled?: boolean;
		children?: Entry[];
		kind?: 'item' | 'divider' | 'label';
	};
</script>

<script lang="ts">
	type Props = {
		items?: Entry[];
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

	let stack = $state<{ label: string; items: Entry[] }[]>([]);
	let q = $state('');

	const current = $derived(stack.length ? stack[stack.length - 1] : { label: title, items });

	function close() {
		open = false;
		stack = [];
		q = '';
	}

	function hasChildren(it: Entry) {
		return !!(it.children && it.children.length);
	}

	function clickItem(it: Entry) {
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

	function matches(it: Entry, query: string): boolean {
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

		// limpiar divisores (sin duplicados, ni al principio/fin)
		const out: Entry[] = [];
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

	$effect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => onKey(e);
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	});
</script>

{#if open}
	<div
		role="dialog"
		class="fixed inset-0 z-40"
		onclick={() => close()}
		oncontextmenu={(e) => e.preventDefault()}
		aria-modal="true"
		tabindex="0"
	/>

	<div
		class="fixed z-50 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 dark:bg-gray-900"
		style={`left:${x}px; top:${y}px`}
		oncontextmenu={(e) => e.preventDefault()}
	>
		<div class="flex items-center gap-1 px-1 py-1">
			{#if stack.length > 0}
				<button
					class="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
					role="dialog"
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
						stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg
					>
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
						role="dialog"
						disabled={it.disabled}
						onclick={() => clickItem(it)}
					>
						<span class="truncate">{it.label}</span>
						<span class="flex items-center gap-2">
							{#if it.shortcut}
								<kbd class="rounded bg-gray-100 px-1 text-[10px] dark:bg-gray-800"
									>{it.shortcut}</kbd
								>
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
									stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg
								>
							{/if}
						</span>
					</button>
				{/if}
			{/each}
		</div>
	</div>
{/if}
