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

	// CONTEXT MENU
	let contextPopover = $state<HTMLDivElement | null>(null);
	let contextRow = $state<T | null>(null);

	// Punto “preferido” (cursor o botón)
	let contextPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });

	// ✅ Render final (clamp + flip + stick)
	let contextRender = $state<{ x: number; y: number; transform: string }>({
		x: 0,
		y: 0,
		transform: 'translate(-100%, 8px)'
	});

	// Ajusta margen si quieres “pegado” más agresivo
	const CONTEXT_MARGIN = 10;
	const CONTEXT_GAP = 8; // separación visual del cursor/botón

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

		// Columna acciones
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

	// CERRAR CONTEXT MENU al click fuera
	$effect(() => {
		function handleDocumentClick(event: MouseEvent) {
			if (!contextOpen) return;
			const target = event.target as HTMLElement;
			if (!target.closest('[data-context-host="true"]')) closeContext();
		}

		if (contextOpen) document.addEventListener('click', handleDocumentClick);

		return () => document.removeEventListener('click', handleDocumentClick);
	});

	// ✅ Reposicionar en resize + scroll (capture)
	$effect(() => {
		if (!contextOpen) return;

		const onWin = () => {
			// reintenta/ajusta por si cambia viewport, barras móviles, etc.
			positionContext(2);
		};

		window.addEventListener('resize', onWin);
		window.addEventListener('scroll', onWin, { passive: true, capture: true });

		return () => {
			window.removeEventListener('resize', onWin);
			window.removeEventListener('scroll', onWin, true as any);
		};
	});

	// RESIZE COLUMNS
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

	// HELPERS
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
	// ✅ Context positioning (robusto)
	// =========================
	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	function raf() {
		return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	}

	/**
	 * Decide transform y clamp final para que el popover:
	 * - no se salga del viewport
	 * - si no cabe abajo => se pega arriba
	 * - si no cabe arriba => se pega al top margin (scroll dentro)
	 * - si no cabe a la izquierda => se pone a la derecha
	 * - si no cabe a la derecha => clamp
	 */
	function computeContextPosition(preferred: { x: number; y: number }, pop: DOMRect) {
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		// Si es tan alto que ni arriba ni abajo, lo forzamos dentro (scroll en contenedor)
		const tooTall = pop.height + CONTEXT_MARGIN * 2 > vh;

		// Queremos aparecer “cerca” del punto preferido
		// Horizontal por defecto: a la izquierda del punto (como tu translate(-100%, ...))
		const fitsLeft = preferred.x - pop.width - CONTEXT_MARGIN >= 0;
		const fitsRight = preferred.x + pop.width + CONTEXT_MARGIN <= vw;

		// Vertical por defecto: abajo del punto
		const fitsDown = preferred.y + pop.height + CONTEXT_MARGIN + CONTEXT_GAP <= vh;
		const fitsUp = preferred.y - pop.height - CONTEXT_MARGIN - CONTEXT_GAP >= 0;

		// Horizontal: si no cabe izquierda pero cabe derecha => derecha
		const placeToRight = !fitsLeft && fitsRight;

		// Vertical:
		// - preferimos abajo
		// - si no cabe abajo y cabe arriba => arriba
		// - si es tooTall => lo pegamos dentro del viewport
		const placeUp = !tooTall && !fitsDown && fitsUp;

		// Transform:
		const transformX = placeToRight ? '0%' : '-100%';
		// en vertical: abajo => +gap, arriba => -100% - gap
		const transformY = placeUp ? `calc(-100% - ${CONTEXT_GAP}px)` : `${CONTEXT_GAP}px`;

		let x = preferred.x;
		let y = preferred.y;

		// Clamp horizontal según transformX
		if (transformX === '-100%') {
			// pop ocupa [x - w, x]
			x = clamp(x, CONTEXT_MARGIN + pop.width, vw - CONTEXT_MARGIN);
		} else {
			// pop ocupa [x, x + w]
			x = clamp(x, CONTEXT_MARGIN, vw - CONTEXT_MARGIN - pop.width);
		}

		// Si tooTall, lo pegamos arriba dentro del viewport y dejamos overflow-auto
		if (tooTall) {
			return {
				x,
				y: CONTEXT_MARGIN,
				transform: `translate(${transformX}, 0px)`
			};
		}

		// Clamp vertical
		if (placeUp) {
			// pop ocupa [y - gap - h, y - gap]
			y = clamp(y, CONTEXT_MARGIN + pop.height + CONTEXT_GAP, vh - CONTEXT_MARGIN);
		} else {
			// pop ocupa [y + gap, y + gap + h]
			// aquí el max real del y para que no se salga por abajo:
			y = clamp(y, CONTEXT_MARGIN - CONTEXT_GAP, vh - CONTEXT_MARGIN - pop.height - CONTEXT_GAP);
		}

		// 🔥 Fallback “stick”:
		// Si aun así por alguna razón se nos quedaría fuera (casos raros), lo pegamos a bottom/top.
		const topIfDown = y + CONTEXT_GAP; // top real cuando está abajo
		const bottomIfDown = topIfDown + pop.height;

		const bottomIfUp = y - CONTEXT_GAP; // bottom real cuando está arriba
		const topIfUp = bottomIfUp - pop.height;

		if (!placeUp && bottomIfDown > vh - CONTEXT_MARGIN) {
			// stick to bottom: ajusta y para que bottom quede dentro
			y = vh - CONTEXT_MARGIN - pop.height - CONTEXT_GAP;
		}

		if (placeUp && topIfUp < CONTEXT_MARGIN) {
			// stick to top: ajusta y
			y = CONTEXT_MARGIN + pop.height + CONTEXT_GAP;
		}

		return {
			x,
			y,
			transform: `translate(${transformX}, ${transformY})`
		};
	}

	/**
	 * Posiciona con medición robusta:
	 * - espera RAF
	 * - si rect aún es 0 => retry
	 * - recalcula render
	 */
	async function positionContext(retries = 3) {
		if (!contextPopover || !contextRow) return;

		// RAF suele ser más fiable que tick() con Popover API
		await raf();

		const rect = contextPopover.getBoundingClientRect();

		if ((!rect.width || !rect.height) && retries > 0) {
			return positionContext(retries - 1);
		}
		if (!rect.width || !rect.height) return;

		contextRender = computeContextPosition(contextPos, rect);
	}

	async function openContextAt(event: MouseEvent, row: T) {
		event.preventDefault();
		event.stopPropagation();

		contextRow = row;
		contextPos = { x: event.clientX, y: event.clientY };

		if (contextPopover) contextPopover.showPopover();

		// Svelte render + luego RAF retry para layout real
		await tick();
		await positionContext(3);
	}

	async function openContextFromButton(event: MouseEvent, row: T) {
		event.preventDefault();
		event.stopPropagation();

		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

		contextRow = row;

		// punto preferido: esquina inferior derecha del botón
		contextPos = { x: rect.right, y: rect.bottom };

		if (contextPopover) contextPopover.showPopover();

		await tick();
		await positionContext(3);
	}

	function closeContext() {
		if (contextPopover) contextPopover.hidePopover();
		contextRow = null;
	}
</script>

<div
	class="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50/70 text-xs text-neutral-900 shadow-sm backdrop-blur-2xl dark:border-neutral-800/80 dark:bg-neutral-950/70 dark:text-neutral-50"
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

	<div class="relative max-h-[70vh] flex-1 overflow-auto">
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
								<!-- Fila principal -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
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
											class={`flex items-center border-r border-neutral-200/60 px-3 text-black dark:text-neutral-50 ${
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
												<span
													class={`line-clamp-2 text-black dark:text-neutral-50 ${
														col.align === 'right'
															? 'ml-auto text-right'
															: col.align === 'center'
																? 'mx-auto text-center'
																: ''
													}`}
												>
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
											{#if rowActions}
												{@render rowActions(row, actions)}
											{:else}
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
							{@const id = rowIdFor(row, index)}
							{@const cols = controller.mainColumns as any[]}
							{@const firstCol = cols[0]}
							{@const firstValue = firstCol
								? firstCol.accessor
									? firstCol.accessor(row)
									: (row as any)[firstCol.id]
								: null}
							{@const restCols = cols.slice(1)}

							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class={`group relative rounded-2xl border border-neutral-200/80 bg-white/80 p-3 text-[11px] text-neutral-800 shadow-sm ring-0 transition-all hover:border-purple-400/70 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/80 dark:text-neutral-50 ${
									controller.selectedIds.has(id)
										? 'bg-purple-50/70 ring-1 ring-purple-400/70 dark:bg-purple-950/20'
										: ''
								}`}
								oncontextmenu={(e) => openContextAt(e, row)}
							>
								{#if controller.multiSelect}
									<div
										class="absolute top-2 left-2 z-10 rounded-full bg-neutral-900/70 p-1 backdrop-blur-md dark:bg-neutral-950/80"
										data-stop-row-toggle="true"
									>
										<input
											type="checkbox"
											checked={controller.selectedIds.has(id)}
											onchange={() => controller.toggleRowSelection(id)}
											class="h-3.5 w-3.5 rounded border-neutral-400 bg-neutral-50 text-purple-500 focus:ring-purple-500 dark:border-neutral-500 dark:bg-neutral-900"
										/>
									</div>
								{/if}

								<div class="mb-2 pr-6 text-black dark:text-neutral-50">
									{#if cell && firstCol}
										{@render cell({ row, column: firstCol, value: firstValue, index })}
									{:else if firstCol}
										<div
											class="line-clamp-2 text-[12px] leading-snug font-semibold text-neutral-900 dark:text-neutral-50"
										>
											{formatValue(firstCol, firstValue, row)}
										</div>
									{/if}
								</div>

								<dl class="space-y-1.5">
									{#each restCols as col (col.id)}
										{@const value = col.accessor ? col.accessor(row) : (row as any)[col.id]}
										<div class="flex items-start justify-between gap-2">
											<dt
												class="max-w-[45%] truncate text-[10px] font-medium text-neutral-400 uppercase dark:text-neutral-500"
											>
												{col.label}
											</dt>
											<dd
												class="line-clamp-2 flex-1 text-right text-[11px] text-neutral-700 dark:text-neutral-200"
											>
												{formatValue(col, value, row)}
											</dd>
										</div>
									{/each}
								</dl>

								{#if actions.length}
									<div
										class="mt-2 flex items-center justify-end gap-1.5"
										data-stop-row-toggle="true"
									>
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

								{#if rowCollapse && openRows.has(id)}
									<div
										class="mt-2 rounded-2xl border border-dashed border-neutral-200/70 bg-neutral-50/80 px-2.5 py-2 text-[11px] text-neutral-700 dark:border-neutral-700/70 dark:bg-neutral-950/60 dark:text-neutral-100"
									>
										{@render rowCollapse(row)}
									</div>
								{/if}
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

	<!-- ✅ CONTEXT POPOVER HOST -->
	<div
		bind:this={contextPopover}
		popover="manual"
		data-context-host="true"
		class="z-[1300] max-h-[calc(100vh-20px)] max-w-xs min-w-[190px] overflow-auto rounded-2xl border border-neutral-200/80 bg-neutral-50/95 p-1.5 text-xs text-neutral-900 shadow-[0_18px_50px_rgba(15,23,42,0.45)] backdrop-blur-2xl transition-transform duration-75 will-change-transform dark:border-neutral-700/80 dark:bg-neutral-900/95 dark:text-neutral-50"
		style={`position: fixed; left: ${contextRender.x}px; top: ${contextRender.y}px; transform: ${contextRender.transform};`}
		onbeforetoggle={(e) => {
			if ((e as any).newState === 'closed') contextRow = null;
		}}
	>
		{#if contextRow && actions.length}
			<ContextMenu {actions} row={contextRow} onClose={closeContext} />
		{:else}
			<div class="flex flex-col gap-2">No hay acciones disponibles</div>
		{/if}
	</div>
</div>
