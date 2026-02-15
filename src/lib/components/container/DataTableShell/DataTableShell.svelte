<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import { EllipsisVertical, ChevronDown } from 'lucide-svelte';
	import type { ColumnDef, RowAction } from './core/types.js';
	import type { DataTableController } from './core/DataTableController.svelte';
	import { provideTable } from './core/context.js';
	import DataTableToolbar from './components/DataTableToolbar.svelte';
	import DataTableFooter from './components/DataTableFooter.svelte';
	import ContextMenu from './components/ContextMenu.svelte';
	import { portal } from '../DataTable/utils/portal.js';

	interface CellContext<T> {
		row: T;
		column: ColumnDef<T>;
		value: unknown;
		index: number;
	}

	interface Props<T> {
		controller: DataTableController<T>;
		actions?: RowAction<T>[];
		cell?: Snippet<[CellContext<T>]>;
		overflow?: Snippet<[T]>;
		headerCell?: Snippet<[ColumnDef<T>]>;
		rowActions?: Snippet<[T, RowAction<T>[]]>;
		bulkActions?: Snippet<
			[
				{
					selectedIds: string[];
					clearSelection: () => void;
				}
			]
		>;
		rowCollapse?: Snippet<[T]>;
	}

	const {
		controller,
		actions = [],
		cell,
		overflow,
		headerCell,
		rowActions,
		bulkActions,
		rowCollapse
	}: Props<T> = $props();

	provideTable(controller);

	let density = $state<'comfortable' | 'compact'>('comfortable');
	let viewMode = $state<'list' | 'grid'>('list');

	let selectAllEl = $state<HTMLInputElement | null>(null);

	let gridTemplate = $state('');
	let stickyOffsets = $state<Record<keyof T, { left?: number; right?: number }>>(
		{} as Record<keyof T, { left?: number; right?: number }>
	);

	// ✅ el contenedor que scrollea (tu overflow-auto)
	let scrollEl = $state<HTMLDivElement | null>(null);

	// CONTEXT
	let contextPopover = $state<HTMLDivElement | null>(null);
	let contextRow = $state<T | null>(null);

	// punto donde “quieres” abrirlo (coords de viewport)
	let contextPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });

	// ✅ left/top final (sin transform)
	let contextRender = $state<{ left: number; top: number }>({ left: 0, top: 0 });

	const CONTEXT_MARGIN = 12;
	const CONTEXT_GAP = 8;

	let openRows = $state<Set<string>>(new Set());
	const contextOpen = $derived(contextRow !== null);

	// GRID / STICKY
	$effect(() => {
		const parts: string[] = [];
		if (controller.multiSelect) parts.push('40px');

		controller.mainColumns.forEach((col) => {
			const w = controller.getColumnWidth(col.id as keyof T);
			parts.push(`${w}px`);
		});

		parts.push('64px');
		gridTemplate = parts.join(' ');

		const offsets: Record<keyof T, { left?: number; right?: number }> = {} as Record<
			keyof T,
			{ left?: number; right?: number }
		>;

		let accLeft = controller.multiSelect ? 40 : 0;
		controller.mainColumns.forEach((col) => {
			const w = controller.getColumnWidth(col.id as keyof T);
			if (col.sticky === 'left') offsets[col.id as keyof T] = { left: accLeft };
			accLeft += w;
		});
		stickyOffsets = offsets;
	});

	// CHECK ALL
	$effect(() => {
		if (!controller.multiSelect || !selectAllEl) return;
		if (!controller.currentRows.length) {
			selectAllEl.checked = false;
			selectAllEl.indeterminate = false;
			return;
		}
		selectAllEl.checked = controller.allVisibleSelected;
		selectAllEl.indeterminate = controller.someVisibleSelected;
	});

	// Cerrar por click fuera
	$effect(() => {
		function handleDocumentClick(event: MouseEvent) {
			if (!contextOpen) return;
			const target = event.target as HTMLElement;
			if (!target.closest('[data-context-host="true"]')) closeContext();
		}
		if (contextOpen) document.addEventListener('mousedown', handleDocumentClick, true);
		return () => document.removeEventListener('mousedown', handleDocumentClick, true);
	});

	// ✅ Reposicionar mientras está abierto: window resize + scroll del contenedor REAL
	$effect(() => {
		if (!contextOpen) return;

		const handler = () => void positionContext();

		window.addEventListener('resize', handler);

		// 👇 ESTE ES el scroll que te estaba faltando
		scrollEl?.addEventListener('scroll', handler, { passive: true });

		return () => {
			window.removeEventListener('resize', handler);
			scrollEl?.removeEventListener('scroll', handler as any);
		};
	});

	// RESIZE columns
	let resizingId: keyof T | null = null;
	let startX = 0;
	let startWidth = 0;

	function onResizeDown(event: MouseEvent, columnId: keyof T, el: HTMLDivElement) {
		event.preventDefault();
		event.stopPropagation();
		resizingId = columnId;
		startX = event.clientX;
		startWidth = el.getBoundingClientRect().width;
		window.addEventListener('mousemove', onResizeMove);
		window.addEventListener('mouseup', onResizeUp);
	}

	function onResizeMove(event: MouseEvent) {
		if (!resizingId) return;
		const dx = event.clientX - startX;
		controller.resizeColumn(resizingId, startWidth + dx);
	}

	function onResizeUp() {
		resizingId = null;
		window.removeEventListener('mousemove', onResizeMove);
		window.removeEventListener('mouseup', onResizeUp);
	}

	function rowIdFor(row: T, index: number) {
		return controller.getRowId(row, index);
	}

	function formatValue(col: ColumnDef<T>, value: unknown, row: T): string {
		if ((col as any).format) return (col as any).format(value, row);
		if (value == null) return '';
		if (col.type === 'number') return String(value);
		if (col.type === 'date' || col.type === 'datetime') {
			if (value instanceof Date) return value.toLocaleString();
			return String(value);
		}
		return String(value);
	}

	function toggleRow(row: T, index: number) {
		if (!rowCollapse) return;
		const id = rowIdFor(row, index);
		const next = new Set(openRows);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		openRows = next;
	}

	function handleRowClick(event: MouseEvent, row: T, index: number) {
		const target = event.target as HTMLElement;
		if (target.closest('[data-stop-row-toggle="true"]')) return;
		toggleRow(row, index);
	}

	function handleToggleAll(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		if (input.checked) controller.selectAllCurrentPage();
		else controller.unselectAllCurrentPage();
	}

	// =========================
	// ✅ POSICIONAMIENTO REAL (sin transform)
	// =========================
	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	function raf() {
		return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	}

	function getViewport() {
		const vv = window.visualViewport;
		if (vv) return { left: vv.offsetLeft, top: vv.offsetTop, width: vv.width, height: vv.height };
		return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
	}

	function computeContextPosition(preferred: { x: number; y: number }, pop: DOMRect) {
		const vp = getViewport();

		const minLeft = vp.left + CONTEXT_MARGIN;
		const minTop = vp.top + CONTEXT_MARGIN;

		const maxLeft = vp.left + vp.width - CONTEXT_MARGIN - pop.width;
		const maxTop = vp.top + vp.height - CONTEXT_MARGIN - pop.height;

		const tooTall = pop.height > vp.height - CONTEXT_MARGIN * 2;

		// default: left + down
		let left = preferred.x - pop.width;
		let top = preferred.y + CONTEXT_GAP;

		// flip horizontal
		if (left < minLeft) left = preferred.x + CONTEXT_GAP;

		if (tooTall) {
			// si no cabe en altura, pegado arriba
			top = minTop;
		} else {
			// flip vertical si se sale abajo
			const bottomIfDown = top + pop.height;
			const bottomLimit = vp.top + vp.height - CONTEXT_MARGIN;
			if (bottomIfDown > bottomLimit) {
				top = preferred.y - CONTEXT_GAP - pop.height; // arriba
			}

			// si arriba se sale, pegado abajo
			if (top < minTop) top = maxTop;
		}

		left = clamp(left, minLeft, Math.max(minLeft, maxLeft));
		top = clamp(top, minTop, Math.max(minTop, maxTop));

		return { left, top };
	}

	async function positionContext() {
		if (!contextPopover || !contextRow) return;

		await raf();
		const r1 = contextPopover.getBoundingClientRect();
		if (!r1.width || !r1.height) return;

		contextRender = computeContextPosition(contextPos, r1);

		// segunda pasada por scrollbar
		await raf();
		const r2 = contextPopover.getBoundingClientRect();
		if (!r2.width || !r2.height) return;

		contextRender = computeContextPosition(contextPos, r2);
	}

	async function openContextAt(event: MouseEvent, row: T) {
		event.preventDefault();
		event.stopPropagation();

		contextRow = row;
		contextPos = { x: event.clientX, y: event.clientY };

		await tick();
		await positionContext();
	}

	async function openContextFromButton(event: MouseEvent, row: T) {
		event.preventDefault();
		event.stopPropagation();

		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		contextRow = row;

		// punto: esquina inferior derecha del botón
		contextPos = { x: rect.right, y: rect.bottom };

		await tick();
		await positionContext();
	}

	function closeContext() {
		contextRow = null;
	}
</script>

<!-- ✅ wrapper principal relativo (para z-index) -->
<div
	class="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50/70 text-xs text-neutral-900 shadow-sm backdrop-blur-2xl dark:border-neutral-800/80 dark:bg-neutral-950/70 dark:text-neutral-50"
>
	<DataTableToolbar
		{density}
		{viewMode}
		onDensityChange={(d) => (density = d)}
		onViewModeChange={(m) => (viewMode = m)}
	/>

	{#if bulkActions && controller.multiSelect && controller.selectedIds.size}
		<div
			class="border-b border-dashed border-neutral-200/80 bg-purple-50/70 px-3 py-2 text-[11px] text-neutral-700 dark:border-neutral-800/80 dark:bg-purple-950/40 dark:text-neutral-100"
		>
			{@render bulkActions({
				selectedIds: Array.from(controller.selectedIds),
				clearSelection: () => controller.clearSelection()
			})}
		</div>
	{/if}

	<!-- ✅ ESTE es el scroll container, le hacemos bind -->
	<div bind:this={scrollEl} class="relative max-h-[70vh] flex-1 overflow-auto">
		{#if controller.loading}
			<div class="pointer-events-none absolute inset-0 z-20 bg-neutral-900/30 backdrop-blur-md">
				<div class="flex h-full items-center justify-center">
					<div
						class="flex items-center gap-2 rounded-full bg-neutral-900/90 px-4 py-2 text-[11px] text-neutral-100 shadow-lg dark:bg-neutral-950/90"
					>
						<div class="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
						Cargando datos
					</div>
				</div>
			</div>
		{/if}

		<div class="min-w-full">
			<!-- HEADER -->
			<div
				class="sticky top-0 z-10 grid w-max items-center gap-0 border-b border-neutral-200/80 bg-neutral-50/95 text-[11px] tracking-wide text-neutral-500 uppercase backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/95 dark:text-neutral-400"
				style={`grid-template-columns:${gridTemplate}`}
			>
				{#if controller.multiSelect}
					<div
						class={`sticky top-0 left-0 z-20 flex items-center justify-center border-r border-neutral-200/60 bg-neutral-50/95 px-2 ${
							density === 'compact' ? 'py-1.5' : 'py-2.5'
						} backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/95`}
					>
						<input
							type="checkbox"
							bind:this={selectAllEl}
							onchange={handleToggleAll}
							class="h-3.5 w-3.5 rounded border-neutral-300 bg-neutral-50 text-purple-500 focus:ring-purple-500 dark:border-neutral-600 dark:bg-neutral-900"
							data-stop-row-toggle="true"
						/>
					</div>
				{/if}

				{#each controller.mainColumns as col (col.id)}
					{@const sticky = stickyOffsets[col.id as keyof T]}
					<div
						role="columnheader"
						tabindex="0"
						class={`relative flex items-center border-r border-neutral-200/60 px-3 ${
							density === 'compact' ? 'py-1.5' : 'py-2.5'
						} text-left text-[11px] font-semibold text-neutral-600 dark:border-neutral-800/70 dark:text-neutral-300 ${
							col.sticky === 'left'
								? 'z-10 bg-neutral-50/95 shadow-[1px_0_0_rgba(15,23,42,0.15)] backdrop-blur-xl dark:bg-neutral-950/95'
								: ''
						}`}
						style={col.sticky === 'left' && sticky?.left !== undefined
							? `position: sticky; left: ${sticky.left}px; top: 0;`
							: ''}
						ondblclick={() => col.sortable && controller.toggleSort(col.id as keyof T)}
					>
						<button
							type="button"
							class="flex w-full items-center justify-between gap-1"
							onclick={() => col.sortable && controller.toggleSort(col.id as keyof T)}
							data-stop-row-toggle="true"
						>
							{#if headerCell}
								{@render headerCell(col)}
							{:else}
								<span class="line-clamp-1">{col.label}</span>
							{/if}
							{#if col.sortable}
								<span
									class={`text-[9px] ${
										controller.sortColumn === col.id
											? 'text-purple-500'
											: 'text-neutral-300 dark:text-neutral-600'
									}`}
								>
									{#if controller.sortColumn === col.id}
										{controller.sortDirection === 'asc' ? '▲' : '▼'}
									{:else}
										↕
									{/if}
								</span>
							{/if}
						</button>
						<div
							role="columnheader"
							tabindex="0"
							class="absolute inset-y-1 right-0 flex w-2 cursor-col-resize items-center justify-end"
							onmousedown={(e) =>
								onResizeDown(e, col.id as keyof T, e.currentTarget.parentElement as HTMLDivElement)}
							data-stop-row-toggle="true"
						>
							<div
								class="h-6 w-[2px] rounded-full bg-neutral-200 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-400"
							></div>
						</div>
					</div>
				{/each}

				<div
					class={`sticky top-0 right-0 z-20 flex items-center justify-end border-l border-neutral-200/60 bg-neutral-50/95 px-2 ${
						density === 'compact' ? 'py-1.5' : 'py-2.5'
					} backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/95`}
				></div>
			</div>

			<!-- BODY -->
			{#if controller.currentRows.length}
				{#if viewMode === 'list'}
					<div class="bg-white dark:bg-neutral-950">
						{#each controller.currentRows as row, index (rowIdFor(row, index))}
							{@const id = rowIdFor(row, index)}

							<div class="group relative">
								<div
									role="row"
									tabindex="0"
									class={`relative grid w-max items-stretch border-b border-neutral-200/80 bg-white text-xs text-neutral-800 transition-colors even:bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-800/80 dark:bg-neutral-950 dark:even:bg-neutral-900 dark:hover:bg-neutral-900 ${
										controller.selectedIds.has(id)
											? 'bg-purple-50/60 ring-1 ring-purple-400/60 hover:bg-purple-50/60 dark:bg-purple-950/25 dark:hover:bg-purple-950/25'
											: ''
									}`}
									style={`grid-template-columns:${gridTemplate}`}
									oncontextmenu={(e) => openContextAt(e, row)}
									onclick={(e) => handleRowClick(e, row, index)}
								>
									{#if controller.multiSelect}
										<div
											class={`sticky left-0 z-10 flex items-center justify-center border-r border-neutral-200/60 bg-white/95 px-2 ${
												density === 'compact' ? 'py-1.5' : 'py-2.5'
											} backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/95`}
											data-stop-row-toggle="true"
										>
											<input
												type="checkbox"
												checked={controller.selectedIds.has(id)}
												onchange={() => controller.toggleRowSelection(id)}
												class="h-3.5 w-3.5 rounded border-neutral-300 bg-neutral-50 text-purple-500 focus:ring-purple-500 dark:border-neutral-600 dark:bg-neutral-900"
											/>
										</div>
									{/if}

									{#each controller.mainColumns as col (col.id)}
										{@const value = col.accessor ? col.accessor(row) : (row as any)[col.id]}
										{@const sticky = stickyOffsets[col.id as keyof T]}
										<div
											class={`flex items-center border-r border-neutral-200/60 px-3  text-black dark:text-neutral-50${
												density === 'compact' ? 'py-1.5' : 'py-2.5'
											} dark:border-neutral-800/70 ${
												col.sticky === 'left'
													? 'z-[5] bg-white/95 shadow-[1px_0_0_rgba(15,23,42,0.10)] backdrop-blur-xl dark:bg-neutral-950/95'
													: ''
											}`}
											style={col.sticky === 'left' && sticky?.left !== undefined
												? `position: sticky; left: ${sticky.left}px;`
												: ''}
										>
											{#if cell}
												{@render cell({ row, column: col, value, index })}
											{:else}
												<span class="line-clamp-2 text-black dark:text-neutral-50">
													{formatValue(col, value, row)}
												</span>
											{/if}
										</div>
									{/each}

									<div
										class={`sticky right-0 z-10 flex items-center justify-end border-l border-neutral-200/60 bg-white/95 px-2 ${
											density === 'compact' ? 'py-1.5' : 'py-2.5'
										} backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/95`}
										data-stop-row-toggle="true"
									>
										{#if actions.length}
											<div class="flex items-center gap-1.5">
												{#if rowCollapse}
													<button
														type="button"
														onclick={(e) => {
															e.stopPropagation();
															toggleRow(row, index);
														}}
														class={`inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200/80 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/80 dark:hover:text-neutral-100 ${
															openRows.has(id) ? 'rotate-180' : ''
														}`}
													>
														<ChevronDown class="h-3.5 w-3.5" />
													</button>
												{/if}

												<button
													type="button"
													onclick={(e) => openContextFromButton(e, row)}
													class="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200/80 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/80 dark:hover:text-neutral-100"
												>
													<EllipsisVertical class="h-4 w-4" />
												</button>
											</div>
										{/if}
									</div>
								</div>

								{#if controller.overflowColumns.length}
									<div
										class="border-b border-dashed border-neutral-200/70 bg-white px-3 py-2 text-[11px] text-neutral-600 dark:border-neutral-800/70 dark:bg-neutral-950 dark:text-neutral-300"
									>
										{#if overflow}
											{@render overflow(row)}
										{:else}
											<div class="grid gap-2 md:grid-cols-3">
												{#each controller.overflowColumns as colOverflow (colOverflow.id)}
													{@const valueOverflow = colOverflow.accessor
														? colOverflow.accessor(row)
														: (row as any)[colOverflow.id]}
													<div
														class="rounded-2xl border border-neutral-200/80 bg-white/80 px-2 py-1.5 text-[11px] text-neutral-800 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/80 dark:text-neutral-100"
													>
														<div
															class="mb-0.5 text-[10px] font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500"
														>
															{colOverflow.label}
														</div>
														<div>{formatValue(colOverflow, valueOverflow, row)}</div>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/if}

								{#if rowCollapse && openRows.has(id)}
									<div
										class="border-b border-dashed border-neutral-200/70 bg-white px-3 py-3 text-[11px] text-neutral-700 dark:border-neutral-800/70 dark:bg-neutral-950 dark:text-neutral-100"
									>
										{@render rowCollapse(row)}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{#each controller.currentRows as row, index (rowIdFor(row, index))}
							<div
								class="group relative rounded-2xl border border-neutral-200/80 bg-white/80 p-3 text-[11px] text-neutral-800 shadow-sm ring-0 transition-all hover:border-purple-400/70 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/80 dark:text-neutral-50"
								oncontextmenu={(e) => openContextAt(e, row)}
							>
								<!-- tu grid content -->
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<div class="px-3 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
					No hay registros que mostrar
				</div>
			{/if}
		</div>
	</div>

	<DataTableFooter />
</div>
<!-- ✅ HOST fuera del overflow-auto (ya no lo recorta) -->
{#if contextOpen}
	{#key contextRow}
		<div
			bind:this={contextPopover}
			use:portal
			data-context-host="true"
			class="pointer-events-auto fixed z-[999999] max-h-[calc(100vh-24px)] max-w-xs min-w-[190px] overflow-auto rounded-2xl border border-neutral-200/80 bg-neutral-50/95 p-1.5 text-xs text-neutral-900 shadow-[0_18px_50px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-neutral-700/80 dark:bg-neutral-900/95 dark:text-neutral-50"
			style={`left:${contextRender.left}px; top:${contextRender.top}px;`}
		>
			{#if contextRow && actions.length}
				<ContextMenu {actions} row={contextRow} onClose={closeContext} />
			{:else}
				<div class="flex flex-col gap-2">No hay acciones disponibles</div>
			{/if}
		</div>
	{/key}
{/if}
