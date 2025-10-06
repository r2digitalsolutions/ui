<script lang="ts">
	import type { TContextMenuEntry } from '../core/types.js';

	// --- Action portal ---
	function portal(node: HTMLElement, target: HTMLElement | null = null) {
		const tgt = target ?? document.body;
		const placeholder = document.createComment('portal-placeholder');
		if (node.parentNode) {
			node.parentNode.insertBefore(placeholder, node);
		}
		// Remove any existing menu instances
		const existingMenus = document.querySelectorAll('.context-menu-portal');
		existingMenus.forEach((menu) => menu.remove());
		// Add class for identification
		node.classList.add('context-menu-portal');
		tgt.appendChild(node);
		return {
			destroy() {
				if (node.isConnected) node.remove();
				if (placeholder.isConnected && placeholder.parentNode) {
					placeholder.remove();
				}
			}
		};
	}

	// --- Util para clamping a viewport ---
	function clampToViewport(x: number, y: number, menuW: number, menuH: number, padding = 8) {
		const vw = document.documentElement.clientWidth;
		const vh = document.documentElement.clientHeight;
		let nx = x;
		let ny = y;
		if (nx + menuW + padding > vw) nx = Math.max(padding, vw - menuW - padding);
		if (ny + menuH + padding > vh) ny = Math.max(padding, vh - menuH - padding);
		return { x: nx, y: ny };
	}

	// --- Props ---
	type Props = {
		items?: TContextMenuEntry[];
		x?: number;
		y?: number;
		open?: boolean;
		title?: string;
		searchable?: boolean;
		context?: any;
		portalTarget?: HTMLElement | null;
	};
	let {
		items = [],
		x = 0,
		y = 0,
		open = $bindable(false),
		title = '',
		searchable = true,
		context = null,
		portalTarget = null
	}: Props = $props();

	// --- Estado interno ---
	let stack = $state<{ label: string; items: TContextMenuEntry[] }[]>([]);
	let q = $state('');
	const current = $derived(stack.length ? stack[stack.length - 1] : { label: title, items });

	let menuEl: HTMLDivElement | null = $state(null);

	function close() {
		open = false;
		stack = [];
		q = '';
		x = 0;
		y = 0;
		if (menuEl) {
			menuEl.style.left = '0px';
			menuEl.style.top = '0px';
			menuEl.remove();
			menuEl = null;
		}
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

	// Teclado (Escape / Backspace)
	$effect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => onKey(e);
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	});

	// Cierres robustos: click-fuera, scroll/resize, y bloqueo de menú nativo
	$effect(() => {
		if (!open || !menuEl) return;

		const onPointerDown = (ev: PointerEvent) => {
			if (!menuEl || menuEl.contains(ev.target as Node)) return;
			close();
		};

		const onNativeCtx = (ev: MouseEvent) => {
			if (!menuEl || menuEl.contains(ev.target as Node)) return;
			ev.preventDefault();
		};

		let timeout: NodeJS.Timeout;
		const onScrollOrResize = () => {
			clearTimeout(timeout);
			timeout = setTimeout(() => close(), 100);
		};

		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('contextmenu', onNativeCtx);
		window.addEventListener('scroll', onScrollOrResize, true);
		window.addEventListener('resize', onScrollOrResize, true);

		return () => {
			clearTimeout(timeout);
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('contextmenu', onNativeCtx);
			window.removeEventListener('scroll', onScrollOrResize, true);
			window.removeEventListener('resize', onScrollOrResize, true);
		};
	});

	// Aplicar posición tras abrir o cambiar coords
	$effect(() => {
		if (!open || !menuEl) return;
		const rect = menuEl.getBoundingClientRect();
		const { x: nx, y: ny } = clampToViewport(x, y, rect.width, rect.height, 8);
		menuEl.style.left = `${nx}px`;
		menuEl.style.top = `${ny}px`;
	});
</script>

{#if open}
	<div
		bind:this={menuEl}
		use:portal={portalTarget}
		class="context-menu-portal fixed z-[2147483647] w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 dark:bg-gray-900"
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
			{#if filtered.length}
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
			{:else}
				<div class="my-1 border-t border-gray-200 dark:border-gray-800">No hay resultados</div>
			{/if}
		</div>
	</div>
{/if}
