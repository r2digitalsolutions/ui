import { SvelteSet } from 'svelte/reactivity';
import type { QueryStructure } from './filters-types.js';
import type { ColumnDef } from './types.js';

export type SortDirection = 'asc' | 'desc';
export type DataTableMode = 'pagination' | 'infinite';

type ColumnState<T> = {
	id: keyof T;
	visible: boolean;
	hidden?: boolean;
	width?: number;
	minWidth?: number;
	defaultWidth?: number;
};

export interface DataTableOptions<T> {
	mode: DataTableMode;
	columns: ColumnDef<T>[];
	pageSize?: number;
	maxVisibleColumns?: number;
	multiSelect?: boolean;
	getRowId?: (row: T, index: number) => string;
}

function toLower(value: unknown): string {
	if (value == null) return '';
	return String(value).toLowerCase();
}

function evaluateFilter<T>(row: T, filter: [string, any, any]): boolean {
	const [field, operator, rawValue] = filter;
	const value = (row as any)[field];
	switch (operator) {
		case 'equals':
			return value === rawValue;
		case 'not_equals':
			return value !== rawValue;
		case 'contains':
			return toLower(value).includes(toLower(rawValue));
		case 'not_contains':
			return !toLower(value).includes(toLower(rawValue));
		case 'greater_than':
			return Number(value) > Number(rawValue);
		case 'less_than':
			return Number(value) < Number(rawValue);
		case 'startsWith':
			return toLower(value).startsWith(toLower(rawValue));
		case 'endsWith':
			return toLower(value).endsWith(toLower(rawValue));
		case 'is_empty':
			return value == null || String(value).trim() === '';
		case 'is_not_empty':
			return !(value == null || String(value).trim() === '');
		case 'in':
			return Array.isArray(rawValue) && rawValue.includes(value);
		case 'not_in':
			return Array.isArray(rawValue) && !rawValue.includes(value);
		default:
			return true;
	}
}

function evaluateQueryGroup<T>(row: T, group: any): boolean {
	const join = group.joinOperation === 'OR' ? 'OR' : 'AND';
	const filters = group.filters ?? [];
	if (!filters.length) return true;

	if (join === 'AND') {
		for (const item of filters) {
			if (item.type === 'group') {
				if (!evaluateQueryGroup(row, item)) return false;
			} else {
				if (!evaluateFilter(row, item)) return false;
			}
		}
		return true;
	} else {
		for (const item of filters) {
			if (item.type === 'group') {
				if (evaluateQueryGroup(row, item)) return true;
			} else {
				if (evaluateFilter(row, item)) return true;
			}
		}
		return false;
	}
}

export class DataTableEngine<T> {
	options: DataTableOptions<T>;
	rows = $state<T[]>([]);
	loading = $state(false);
	search = $state('');
	query = $state<QueryStructure | null>(null);
	sortColumn = $state<keyof T | null>(null);
	sortDirection = $state<SortDirection>('asc');
	page = $state(1);
	pageSize = $state(10);
	columnState = $state<ColumnState<T>[]>([]);
	selectedIds = new SvelteSet<string>();

	allColumns = $derived(this.options.columns);

	visibleColumns = $derived.by(() => {
		return this.options.columns.filter((col) => {
			const st = this.columnState.find((c) => c.id === col.id);
			return st ? st.visible : true;
		});
	});

	mainColumns = $derived.by(() => {
		const visible = this.visibleColumns;
		const max =
			this.options.maxVisibleColumns && this.options.maxVisibleColumns > 0
				? this.options.maxVisibleColumns
				: visible.length;
		return visible.slice(0, max);
	});

	overflowColumns = $derived.by(() => {
		const visible = this.visibleColumns;
		const max =
			this.options.maxVisibleColumns && this.options.maxVisibleColumns > 0
				? this.options.maxVisibleColumns
				: visible.length;
		return visible.slice(max);
	});

	processedRows = $derived.by(() => {
		let result = this.rows.slice();

		// SEARCH
		const term = this.search.trim().toLowerCase();
		if (term) {
			result = result.filter((row) => {
				return this.visibleColumns.some((col) => {
					if (col.searchable === false) return false;
					const value = col.accessor ? col.accessor(row) : (row as any)[col.id];
					return toLower(value).includes(term);
				});
			});
		}

		// ADVANCED QUERY
		if (this.query && this.query.useQuery && this.query.filters?.length) {
			result = result.filter((row) => evaluateQueryGroup(row, this.query));
		}

		// SORT
		if (this.sortColumn) {
			const col = this.options.columns.find((c) => c.id === this.sortColumn);
			if (col) {
				const dir = this.sortDirection === 'desc' ? -1 : 1;
				result.sort((a, b) => {
					const va = col.accessor ? col.accessor(a) : (a as any)[col.id];
					const vb = col.accessor ? col.accessor(b) : (b as any)[col.id];
					if (va == null && vb == null) return 0;
					if (va == null) return -1 * dir;
					if (vb == null) return 1 * dir;
					if (typeof va === 'number' && typeof vb === 'number') {
						return (va - vb) * dir;
					}
					const sa = String(va);
					const sb = String(vb);
					if (sa < sb) return -1 * dir;
					if (sa > sb) return 1 * dir;
					return 0;
				});
			}
		}

		return result;
	});

	totalRows = $derived(this.rows.length);
	totalFilteredRows = $derived(this.processedRows.length);

	totalPages = $derived.by(() => {
		const size = this.pageSize || 1;
		const pages = Math.ceil(this.totalFilteredRows / size);
		return pages || 1;
	});

	currentPageRows = $derived.by(() => {
		if (this.options.mode === 'infinite') {
			return this.processedRows;
		}
		const p = this.page < 1 ? 1 : this.page > this.totalPages ? this.totalPages : this.page;
		const size = this.pageSize || 1;
		const start = (p - 1) * size;
		return this.processedRows.slice(start, start + size);
	});

	selectedCount = $derived(this.selectedIds.size);

	allVisibleSelected = $derived.by(() => {
		if (!this.currentPageRows.length) return false;
		const ids = this.currentPageRows.map((row, index) => this.getRowId(row, index));
		return ids.every((id) => this.selectedIds.has(id));
	});

	someVisibleSelected = $derived.by(() => {
		if (!this.currentPageRows.length) return false;
		const ids = this.currentPageRows.map((row, index) => this.getRowId(row, index));
		const selected = ids.filter((id) => this.selectedIds.has(id)).length;
		return selected > 0 && selected < ids.length;
	});

	// NUEVO: estado de selección de toda la página
	isAllPageSelected = $derived.by(() => {
		if (!this.currentPageRows.length) return false;
		const ids = this.currentPageRows.map((row, index) => this.getRowId(row, index));
		return ids.every((id) => this.selectedIds.has(id));
	});

	constructor(options: DataTableOptions<T>) {
		this.options = options;
		this.pageSize = options.pageSize ?? 10;
		this.columnState = options.columns.map((col) => ({
			id: col.id as keyof T,
			visible: col.hidden ? false : true,
			width: col.defaultWidth ?? col.minWidth,
			minWidth: col.minWidth,
			defaultWidth: col.defaultWidth
		}));
	}

	getRowId(row: T, index: number): string {
		if (this.options.getRowId) return this.options.getRowId(row, index);
		const val = (row as any).id;
		if (val != null) return String(val);
		return String(index);
	}

	setRows(rows: T[]) {
		this.rows = rows;
		this.page = 1;
	}

	setLoading(v: boolean) {
		this.loading = v;
	}

	setSearch(term: string) {
		this.search = term;
		this.page = 1;
	}

	setQuery(q: QueryStructure | null) {
		this.query = q;
		this.page = 1;
	}

	setSort(columnId: keyof T | null, direction: SortDirection = 'asc') {
		this.sortColumn = columnId;
		this.sortDirection = direction;
		this.page = 1;
	}

	toggleSort(columnId: keyof T) {
		if (this.sortColumn !== columnId) {
			this.sortColumn = columnId;
			this.sortDirection = 'asc';
		} else {
			if (this.sortDirection === 'asc') {
				this.sortDirection = 'desc';
			} else {
				this.sortColumn = null;
			}
		}
		this.page = 1;
	}

	setPage(page: number) {
		if (page < 1) page = 1;
		if (page > this.totalPages) page = this.totalPages;
		this.page = page;
	}

	setPageSize(size: number) {
		if (size <= 0) size = 1;
		this.pageSize = size;
		this.page = 1;
	}

	clearSelection() {
		this.selectedIds.clear();
	}

	toggleRowSelection(id: string) {
		if (this.selectedIds.has(id)) this.selectedIds.delete(id);
		else this.selectedIds.add(id);
	}

	// Selección por página (lo que usas para el check-all)
	selectAllVisible() {
		this.currentPageRows.forEach((row, index) => {
			const id = this.getRowId(row, index);
			this.selectedIds.add(id);
		});
	}

	unselectAllVisible() {
		if (!this.currentPageRows.length) return;

		const idsToRemove = this.currentPageRows.map((row, index) => this.getRowId(row, index));

		for (const id of idsToRemove) this.selectedIds.delete(id);
	}

	selectAllCurrentPage() {
		this.selectAllVisible();
	}

	unselectAllCurrentPage() {
		this.unselectAllVisible();
	}

	setColumnHidden(id: keyof T, hidden: boolean) {
		this.columnState = this.columnState.map((c) => (c.id === id ? { ...c, visible: !hidden } : c));
	}

	resizeColumn(id: keyof T, width: number) {
		this.columnState = this.columnState.map((c) => {
			if (c.id !== id) return c;
			const min = c.minWidth ?? 80;
			const w = width < min ? min : width;
			return { ...c, width: w };
		});
	}

	resetLayout() {
		this.columnState = this.options.columns.map((col) => ({
			id: col.id,
			visible: col.hidden ? false : true,
			width: col.defaultWidth ?? col.minWidth,
			minWidth: col.minWidth,
			defaultWidth: col.defaultWidth
		}));
		this.sortColumn = null;
		this.sortDirection = 'asc';
		this.page = 1;
		this.pageSize = this.options.pageSize ?? 10;
		this.selectedIds.clear();
		this.search = '';
		this.query = null;
	}

	getColumnWidth(id: keyof T): number {
		const st = this.columnState.find((c) => c.id === id);
		if (st?.width) return st.width;
		const col = this.options.columns.find((c) => c.id === id);
		return col?.defaultWidth ?? col?.minWidth ?? 180;
	}
}
