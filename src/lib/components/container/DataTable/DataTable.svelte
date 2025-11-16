<script lang="ts" generics="T extends { id?: any }">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import type {
		TContextMenuEntry,
		TDataTableCellContext,
		TDataTableColumnDef,
		TDataTableTableOptions
	} from './core/types.js';
	import type { FilterField } from './core/filters/types.js';
	import { DataTableManager } from './core/DataTableManager.svelte';
	import FilterPanel from './components/FilterPanel.svelte';
	import ColumnVisibilityToggle from './components/ColumnVisibilityToggle.svelte';
	import Pagination from './components/Pagination.svelte';
	import ContextMenu from './components/ContextMenu.svelte';
	import Cell from './components/Cell.svelte';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	interface Props<T> {
		filters?: Snippet;
		options: TDataTableTableOptions<T>;
		rowId?: (row: T) => any;
		actions?: (rows: T[], ctx?: TDataTableCellContext<T> | null) => TContextMenuEntry[];
		rowActions?: (row: T) => any;
		onRowClick?: (row: T) => void;
		density?: 'compact' | 'normal' | 'comfortable';
		stickyHeader?: boolean;
		showColumnToggle?: boolean;
		expandIconPosition?: 'start' | 'end';
		filterFields?: FilterField<T>[];
	}

	const {
		filters,
		options,
		rowId = (r: any) => r.id,
		actions,
		rowActions,
		onRowClick,
		density = 'normal',
		stickyHeader = true,
		showColumnToggle = true,
		expandIconPosition = 'start',
		filterFields
	}: Props<T> = $props();

	// Layout constants
	const CHECK_W = 64;
	const ACTION_W = 56;
	const EXPAND_W = 40;

	const manager = new DataTableManager<T>(() => options);

	let filterValues = $state<Record<string, any>>({});
	let container: HTMLDivElement | null = $state(null);
	let rightMenu = $state<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 });
	let rightClickContext = $state<TDataTableCellContext<T> | null>(null);
	let measuring = $state(true);

	const sizeRow = $derived.by(() =>
		density === 'compact' ? 'py-2' : density === 'comfortable' ? 'py-4' : 'py-3'
	);

	// Importante: dejamos que el propio manager se encargue de la carga
	// vía su efecto interno en el constructor. No hacemos `await manager.load()` aquí.

	// Ajustar ancho reservado para checkbox / expand / actions
	$effect(() => {
		const hasActions = !!rowActions;
		const reserved =
			CHECK_W +
			(expandIconPosition === 'end' && !hasActions ? EXPAND_W : 0) +
			(hasActions ? ACTION_W : 0);

		manager.setReservedWidth(reserved);
	});

	// Reflow ancho por ResizeObserver
	$effect(() => {
		if (!container) return;
		const ro = new ResizeObserver((entries) => {
			const w = Math.floor(entries[0].contentRect.width);
			manager.reflowForWidth(w);
		});
		ro.observe(container);
		return () => ro.disconnect();
	});

	// Medir DOM para calcular anchos de columnas
	const SAMPLE_ROWS = 10;

	async function measureColumns() {
		await tick();
		if (!container) return;

		const widths: Record<string, number> = {};

		for (const c of manager.columns) {
			const head = container.querySelector(`[data-dt-head="${c.id}"]`) as HTMLElement | null;

			let maxW = head ? head.offsetWidth : 0;

			const cells = Array.from(
				container.querySelectorAll(`[data-dt-cell="1"][data-col-id="${c.id}"]`)
			).slice(0, SAMPLE_ROWS) as HTMLElement[];

			for (const el of cells) {
				maxW = Math.max(maxW, el.offsetWidth);
			}

			if (c.minWidth != null) maxW = Math.max(maxW, c.minWidth);
			if (c.width != null) maxW = Math.max(maxW, c.width);

			widths[c.id] = Math.ceil(maxW + 16);
		}

		manager.setMeasuredWidths(widths);

		const rect = container.getBoundingClientRect();
		manager.reflowForWidth(Math.floor(rect.width));
		measuring = false;
	}

	// Lanzar medición cuando ya haya datos cargados
	$effect(() => {
		if (!manager.state.ready) return;
		measuring = true;
		measureColumns();
	});

	function headerClick(c: TDataTableColumnDef<T>) {
		if (!c.sortable) return;
		manager.setSort(c.id);
	}

	function onCellContext(
		e: MouseEvent,
		row: T | null,
		columnId: string | null,
		rowIndex: number | null
	) {
		e.preventDefault();
		const columnIndex = columnId ? manager.state.visibleColumns.indexOf(columnId) : null;

		// Reset del menú para evitar glitches de posición
		rightMenu = { open: false, x: 0, y: 0 };

		tick().then(() => {
			rightMenu = { open: true, x: e.clientX, y: e.clientY };
			rightClickContext = {
				row,
				rowIndex,
				columnId,
				columnIndex,
				event: e,
				column: columnId ? manager.getColumn(columnId) : null
			} as TDataTableCellContext<T>;
		});
	}

	function selectedRows(): T[] {
		const ids = manager.state.selected;
		return manager.state.items.filter((r) => ids.has(rowId(r)));
	}

	const selectedRowsItems = $derived.by(() => selectedRows());

	function colTrack(cId: string, isMeasuring: boolean) {
		if (isMeasuring) return 'max-content';
		const c = manager.getColumn(cId);
		const w = manager.measured[cId] ?? c.width ?? c.minWidth ?? 160;
		return `${Math.max(40, Math.ceil(Number(w)))}px`;
	}

	function headerTemplateCols(visible: string[], endExtras: boolean) {
		const tracks = [
			`${CHECK_W}px`,
			...visible.map((id) => colTrack(id, measuring)),
			...(rowActions ? [`${ACTION_W}px`] : endExtras ? [`${EXPAND_W}px`] : [])
		];
		return tracks.join(' ');
	}

	const colsForRender = $derived(
		measuring ? manager.columns.map((c) => c.id) : manager.state.visibleColumns
	);

	const endExtras = $derived(
		expandIconPosition === 'end' && !rowActions && manager.state.hiddenColumns.length > 0
	);

	const allSelected = $derived.by(() => {
		const items = manager.state.items;
		if (items.length === 0) return false;
		return items.every((r) => manager.state.selected.has(rowId(r)));
	});

	const hasHiddenColumns = $derived.by(() => manager.state.hiddenColumns.length > 0);
</script>

<div bind:this={container} class={`space-y-3 ${measuring ? 'overflow-x-hidden' : ''}`}>
	<!-- Toolbar filtros / acciones -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-2">
			{@render filters?.()}
			{#if filterFields && filterFields.length}
				<FilterPanel
					fields={filterFields}
					values={filterValues}
					onapply={(defs) => manager.setFilters(defs)}
					onclear={() => manager.clearFilters()}
				/>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			{#if showColumnToggle}
				<ColumnVisibilityToggle
					columns={manager.columns}
					visible={manager.state.visibleColumns}
					onToggle={(id, show) => manager.setColumnVisibility(id, show)}
				/>
			{/if}
		</div>
	</div>

	<!-- Tabla -->
	<div
		class="rounded-2xl border border-neutral-200/80 bg-white/70 shadow-sm shadow-black/5 backdrop-blur-sm
		       dark:border-neutral-800/80 dark:bg-neutral-950/80"
	>
		<!-- HEADER -->
		<div
			class={`grid items-center border-b border-neutral-200/80 text-xs font-semibold tracking-wide text-neutral-500
			        uppercase dark:border-neutral-800/80 dark:text-neutral-400
			        ${stickyHeader ? 'sticky top-0 z-10 bg-white/90 backdrop-blur-md dark:bg-neutral-950/90' : ''}`}
			style={`grid-template-columns:${headerTemplateCols(colsForRender, endExtras)};`}
		>
			<!-- checkbox global -->
			<div class="flex h-11 items-center px-3">
				<input
					type="checkbox"
					class="h-4 w-4 rounded border-neutral-300 text-neutral-800 shadow-sm focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900"
					checked={allSelected}
					onclick={(e) =>
						(e.currentTarget as HTMLInputElement).checked
							? manager.selectAllCurrentPage(rowId)
							: manager.clearSelection()}
				/>
			</div>

			<!-- headers -->
			{#each colsForRender as cid}
				{@const col = manager.getColumn(cid)}
				<div
					data-dt-head={cid}
					class="flex h-11 items-center px-3 select-none"
					class:cursor-pointer={col.sortable}
					onclick={() => headerClick(col)}
					oncontextmenu={(e) => onCellContext(e, null, cid, null)}
				>
					<div class="flex items-center gap-1 truncate">
						<span>{col.header}</span>
						{#if manager.state.sortBy === cid && manager.state.sortDir}
							<span class="text-[10px] opacity-70">
								{manager.state.sortDir === 'asc' ? '▲' : '▼'}
							</span>
						{/if}
					</div>
				</div>
			{/each}

			{#if rowActions}
				<div class="h-11 px-3"></div>
			{:else if endExtras}
				<div class="h-11 px-3"></div>
			{/if}
		</div>

		<!-- BODY -->
		<div>
			{#if manager.state.loading}
				<div class="p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">Cargando…</div>
			{:else if manager.state.error}
				<div class="p-6 text-center text-sm text-red-600 dark:text-red-400">
					{manager.state.error}
				</div>
			{:else if manager.state.items.length === 0}
				<div class="p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
					Sin resultados
				</div>
			{:else}
				{#each manager.state.items as row, i (rowId(row))}
					<!-- ROW -->
					<div
						class={`grid items-stretch border-b border-neutral-100/60 last:border-b-0
						        dark:border-neutral-900 ${sizeRow}
						        transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-900/60`}
						style={`grid-template-columns:${headerTemplateCols(colsForRender, endExtras)};`}
					>
						<!-- col 0: check + expand (start) -->
						<div class="px-3 py-2">
							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									class="h-4 w-4 rounded border-neutral-300 text-neutral-800 shadow-sm focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900"
									checked={manager.state.selected.has(rowId(row))}
									onclick={() => manager.toggleSelect(rowId(row))}
									oncontextmenu={(e) => onCellContext(e, row, '_check', i)}
								/>

								{#if hasHiddenColumns && expandIconPosition === 'start'}
									<button
										type="button"
										class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
										title={manager.isExpanded(rowId(row)) ? 'Ocultar detalles' : 'Ver detalles'}
										onclick={() => manager.toggleExpand(rowId(row))}
									>
										{#if manager.isExpanded(rowId(row))}
											<ChevronDown class="h-4 w-4" />
										{:else}
											<ChevronRight class="h-4 w-4" />
										{/if}
									</button>
								{/if}
							</div>
						</div>

						<!-- data cells -->
						{#each colsForRender as cid}
							{@const col = manager.getColumn(cid)}
							<div
								data-dt-cell="1"
								data-col-id={cid}
								data-row-index={i}
								tabindex="0"
								role="button"
								class="flex h-full w-full items-center px-3 text-sm text-neutral-800 outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/70 dark:text-neutral-100"
								onclick={() => onRowClick?.(row)}
								oncontextmenu={(e) => onCellContext(e, row, cid, i)}
							>
								{#if col.renderCell}
									{@render col.renderCell(row)}
								{:else}
									<Cell column={col} {row} {measuring} />
								{/if}
							</div>
						{/each}

						<!-- actions / expand-end button -->
						{#if rowActions}
							<div class="px-3 text-right">
								<div class="inline-flex items-center gap-2">
									{#if expandIconPosition === 'end' && hasHiddenColumns}
										<button
											type="button"
											class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
											title={manager.isExpanded(rowId(row)) ? 'Ocultar detalles' : 'Ver detalles'}
											onclick={() => manager.toggleExpand(rowId(row))}
										>
											{#if manager.isExpanded(rowId(row))}
												<ChevronDown class="h-4 w-4" />
											{:else}
												<ChevronRight class="h-4 w-4" />
											{/if}
										</button>
									{/if}
									{@render rowActions(row)}
								</div>
							</div>
						{:else if endExtras}
							<div class="px-3 text-right">
								<button
									type="button"
									class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
									title={manager.isExpanded(rowId(row)) ? 'Ocultar detalles' : 'Ver detalles'}
									onclick={() => manager.toggleExpand(rowId(row))}
								>
									{#if manager.isExpanded(rowId(row))}
										<ChevronDown class="h-4 w-4" />
									{:else}
										<ChevronRight class="h-4 w-4" />
									{/if}
								</button>
							</div>
						{/if}

						{#if manager.isExpanded(rowId(row))}
							<!-- Detalles colapsados en modo "cards" -->
							<div class="col-span-full bg-neutral-50/60 px-3 pt-1 pb-3 dark:bg-neutral-950/60">
								<div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
									{#each manager.state.hiddenColumns as hid}
										{#key hid}
											{@const col = manager.columns.find((cc) => cc.id === hid)}
											{#if col}
												<div
													class="rounded-xl border border-neutral-200/70 bg-white/70 p-3 text-sm
													       dark:border-neutral-800/70 dark:bg-neutral-900/70"
												>
													<div
														class="mb-1 text-[11px] font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400"
													>
														{col.responsiveLabel ?? col.header}
													</div>
													<div class="text-sm text-neutral-800 dark:text-neutral-100">
														{#if col.renderCollapsed}
															{@render col.renderCollapsed(row)}
														{:else if col.renderCell}
															{@render col.renderCell(row)}
														{:else}
															<Cell column={col} {row} measuring={false} />
														{/if}
													</div>
												</div>
											{/if}
										{/key}
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Paginación -->
	<Pagination
		page={manager.state.page}
		perPage={manager.state.perPage}
		total={manager.state.total}
		perPageOptions={options.perPageOptions}
		onchange={(p) => manager.setPage(p)}
		onperpage={(n) => manager.setPerPage(n)}
	/>

	<!-- Context menu -->
	<ContextMenu
		bind:open={rightMenu.open}
		x={rightMenu.x}
		y={rightMenu.y}
		context={rightClickContext}
		items={(actions?.(selectedRowsItems, rightClickContext) ?? []).map((a) => ({
			...a,
			onClick: a.onClick
		}))}
	/>
</div>
