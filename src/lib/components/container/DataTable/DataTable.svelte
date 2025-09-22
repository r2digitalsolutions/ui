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

	const CHECK_W = 64;
	const ACTION_W = 56;
	const EXPAND_W = 40;

	const manager = new DataTableManager<T>(options);

	let filterValues = $state<Record<string, any>>({});
	let container: HTMLDivElement | null = $state(null);
	let rightMenu = $state<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 });
	let rightClickContext = $state<TDataTableCellContext<T> | null>(null);
	let measuring = $state(true);

	const sizeRow = $derived.by(() =>
		density === 'compact' ? 'py-2' : density === 'comfortable' ? 'py-4' : 'py-3'
	);

	await manager.load();

	$effect(() => {
		const hasActions = !!rowActions;
		const reserved =
			CHECK_W +
			(expandIconPosition === 'end' && !hasActions ? EXPAND_W : 0) +
			(hasActions ? ACTION_W : 0);
		manager.setReservedWidth(reserved);
	});

	// reflow ancho
	$effect(() => {
		if (!container) return;
		const ro = new ResizeObserver((entries) => {
			const w = Math.floor(entries[0].contentRect.width);
			manager.reflowForWidth(w);
		});
		ro.observe(container);
		return () => ro.disconnect();
	});

	// medir DOM
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
			for (const el of cells) maxW = Math.max(maxW, el.offsetWidth);
			if (c.minWidth != null) maxW = Math.max(maxW, c.minWidth);
			if (c.width != null) maxW = Math.max(maxW, c.width);
			widths[c.id] = Math.ceil(maxW + 16);
		}
		manager.setMeasuredWidths(widths);
		const rect = container.getBoundingClientRect();
		manager.reflowForWidth(Math.floor(rect.width));
		measuring = false;
	}

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
		rightMenu = { open: true, x: e.clientX, y: e.clientY };
		rightClickContext = {
			row,
			rowIndex,
			columnId,
			columnIndex,
			event: e,
			column: columnId ? manager.getColumn(columnId) : null
		} as TDataTableCellContext<T>;
	}

	function selectedRows(): T[] {
		const ids = manager.state.selected;
		return manager.state.items.filter((r) => ids.has(rowId(r)));
	}

	// tracks
	function colTrack(cId: string, measuring: boolean) {
		if (measuring) return 'max-content';
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
</script>

<div class={`space-y-3 ${measuring ? 'overflow-x-hidden' : ''}`} bind:this={container}>
	<div class="flex flex-wrap items-center justify-between gap-3">
		{@render filters?.()}
		{#if filterFields && filterFields.length}
			<FilterPanel
				fields={filterFields}
				values={filterValues}
				onapply={(defs) => manager.setFilters(defs)}
				onclear={() => manager.clearFilters()}
			/>
		{/if}
		{#if showColumnToggle}
			<ColumnVisibilityToggle
				columns={manager.columns}
				visible={manager.state.visibleColumns}
				onToggle={(id, show) => manager.setColumnVisibility(id, show)}
			/>
		{/if}
	</div>

	<div class="rounded-2xl border border-gray-200 shadow-sm dark:border-gray-800">
		<!-- HEADER -->
		<div
			class={`grid items-center border-b border-gray-200 text-sm font-medium dark:border-gray-800 ${stickyHeader ? 'sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-gray-950/80' : ''}`}
			style={`grid-template-columns:${headerTemplateCols(colsForRender, endExtras)};`}
		>
			<div class="flex h-12 items-center px-3">
				<input
					type="checkbox"
					checked={manager.state.items.length > 0 &&
						manager.state.items.every((r) => manager.state.selected.has(rowId(r)))}
					onclick={(e) =>
						(e.currentTarget as HTMLInputElement).checked
							? manager.selectAllCurrentPage(rowId)
							: manager.clearSelection()}
				/>
			</div>

			{#each colsForRender as cid}
				<div
					data-dt-head={cid}
					class="flex h-12 items-center px-3 select-none"
					class:cursor-pointer={manager.getColumn(cid).sortable}
					onclick={() => headerClick(manager.getColumn(cid))}
					oncontextmenu={(e) => onCellContext(e, null, cid, null)}
				>
					<div class="truncate">
						{manager.getColumn(cid).header}
						{#if manager.state.sortBy === cid}
							<span class="ml-1 text-xs opacity-60">
								{manager.state.sortDir === 'asc'
									? '▲'
									: manager.state.sortDir === 'desc'
										? '▼'
										: ''}
							</span>
						{/if}
					</div>
				</div>
			{/each}

			{#if rowActions}
				<div class="h-12 px-3"></div>
			{:else if endExtras}
				<div class="h-12 px-3"></div>
			{/if}
		</div>

		<!-- BODY -->
		<div>
			{#if manager.state.loading}
				<div class="p-6 text-center opacity-70">Cargando…</div>
			{:else if manager.state.error}
				<div class="p-6 text-center text-red-600">{manager.state.error}</div>
			{:else if manager.state.items.length === 0}
				<div class="p-6 text-center opacity-70">Sin resultados</div>
			{:else}
				{#each manager.state.items as row, i (rowId(row))}
					<!-- ROW -->
					<div
						class={`grid items-center border-b border-gray-100 last:border-b-0 dark:border-gray-900 ${sizeRow}`}
						style={`grid-template-columns:${headerTemplateCols(colsForRender, endExtras)};`}
					>
						<!-- col 0: check + expand -->
						<div class="px-3 py-2">
							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									checked={manager.state.selected.has(rowId(row))}
									onclick={() => manager.toggleSelect(rowId(row))}
									oncontextmenu={(e) => onCellContext(e, row, '_check', i)}
								/>
								{#if manager.state.hiddenColumns.length > 0}
									{#if expandIconPosition === 'start'}
										<button
											class="cursor-pointer rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
											title={manager.isExpanded(rowId(row)) ? 'Ocultar detalles' : 'Ver detalles'}
											onclick={() => manager.toggleExpand(rowId(row))}
										>
											{#if manager.isExpanded(rowId(row))}<ChevronDown
													class="h-4 w-4"
												/>{:else}<ChevronRight class="h-4 w-4" />{/if}
										</button>
									{/if}
								{/if}
							</div>
						</div>

						<!-- data cells -->
						{#each colsForRender as cid}
							{@const col = manager.getColumn(cid)}
							<div
								onkeydown={(e) => console.log('KEYDOWN', e)}
								tabindex="0"
								role="button"
								data-dt-cell="1"
								data-col-id={cid}
								data-row-index={i}
								class="px-3"
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
									{#if expandIconPosition === 'end' && manager.state.hiddenColumns.length > 0}
										<button
											class="cursor-pointer rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
											title={manager.isExpanded(rowId(row)) ? 'Ocultar detalles' : 'Ver detalles'}
											onclick={() => manager.toggleExpand(rowId(row))}
										>
											{#if manager.isExpanded(rowId(row))}<ChevronDown
													class="h-4 w-4"
												/>{:else}<ChevronRight class="h-4 w-4" />{/if}
										</button>
									{/if}
									{@render rowActions(row)}
								</div>
							</div>
						{:else if endExtras}
							<div class="px-3 text-right">
								<button
									class="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
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
							<div class="col-span-full px-3 pt-1 pb-3">
								<div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
									{#each manager.state.hiddenColumns as hid}
										{#key hid}
											{@const col = manager.columns.find((cc) => cc.id === hid)}
											{#if col}
												<div class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
													<div class="mb-1 text-[11px] tracking-wide uppercase opacity-60">
														{col.responsiveLabel ?? col.header}
													</div>
													<div class="text-sm">
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

	<Pagination
		page={manager.state.page}
		perPage={manager.state.perPage}
		total={manager.state.total}
		perPageOptions={options.perPageOptions}
		onchange={(p) => manager.setPage(p)}
		onperpage={(n) => manager.setPerPage(n)}
	/>

	<ContextMenu
		bind:open={rightMenu.open}
		x={rightMenu.x}
		y={rightMenu.y}
		context={rightClickContext}
		items={(actions?.(selectedRows(), rightClickContext) ?? []).map((a) => ({
			...a,
			onClick: a.onClick
		}))}
	/>
</div>
