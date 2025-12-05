import type {
	ColumnDef,
	ColumnFilter,
	DataTableMode,
	DataTableOptions,
	Filter,
	FilterOperator,
	QueryFilter,
	QueryGroup,
	QueryStructure,
	SortDirection
} from './types.js';

export class DataTableInternal<T> {
	options: DataTableOptions<T>;

	rows = $state<T[]>([]);
	loading = $state(false);

	page = $state(1);
	pageSize = $state(20);

	mode: DataTableMode = 'pagination';

	sortColumn = $state<string | null>(null);
	sortDirection = $state<SortDirection>('asc');

	search = $state('');
	filters = $state<Record<string, ColumnFilter>>({});

	selectedIds = $state<Set<string>>(new Set());
	hiddenColumnIds = $state<Set<string>>(new Set());
	columnWidths = $state<Record<string, number>>({});

	multiSelect = false;
	maxVisibleColumns: number | undefined;

	columns = $state<ColumnDef<T>[]>([]);

	stickyColumnsIds: string[] = [];
	stickyRowsPredicate: ((row: T, index: number) => boolean) | undefined;

	query = $state<QueryStructure | null>(null);

	constructor(options: DataTableOptions<T>) {
		this.options = options;
		this.columns = options.columns.map((c) => {
			const min = c.minWidth ?? 120;
			const def = c.defaultWidth ?? min ?? 160;
			return {
				minWidth: min,
				defaultWidth: def,
				searchable: true,
				align: c.align ?? 'left',
				...c
			};
		});
		this.pageSize = options.pageSize ?? 20;
		this.mode = options.mode ?? 'pagination';
		this.multiSelect = options.multiSelect ?? false;
		this.maxVisibleColumns = options.maxVisibleColumns;
		this.stickyColumnsIds = options.stickyColumns ?? [];
		this.stickyRowsPredicate = options.stickyRows;
	}

	getRowId(row: T, index: number): string {
		if (this.options.idField) return this.options.idField(row, index);
		const anyRow = row as unknown as { id?: string | number };
		if (anyRow && anyRow.id != null) return String(anyRow.id);
		return String(index);
	}

	setRows(rows: T[]): void {
		this.rows = rows;
		this.page = 1;
		this.selectedIds = new Set();
	}

	appendRows(rows: T[]): void {
		this.rows = [...this.rows, ...rows];
	}

	setLoading(value: boolean): void {
		this.loading = value;
	}

	setMode(mode: DataTableMode): void {
		this.mode = mode;
	}

	setPage(page: number): void {
		const max = this.pageCount;
		const next = Math.min(Math.max(1, page), max);
		this.page = next;
	}

	nextPage(): void {
		this.setPage(this.page + 1);
	}

	prevPage(): void {
		this.setPage(this.page - 1);
	}

	setPageSize(size: number): void {
		this.pageSize = size;
		this.page = 1;
	}

	setSearch(value: string): void {
		this.search = value;
		this.page = 1;
	}

	setFilter(id: string, value: string): void {
		const copy = { ...this.filters };
		if (!value) {
			delete copy[id];
		} else {
			copy[id] = { id, value };
		}
		this.filters = copy;
		this.page = 1;
	}

	clearFilters(): void {
		this.filters = {};
	}

	setSort(columnId: string): void {
		if (this.sortColumn === columnId) {
			this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortColumn = columnId;
			this.sortDirection = 'asc';
		}
	}

	clearSort(): void {
		this.sortColumn = null;
		this.sortDirection = 'asc';
	}

	setQuery(query: QueryStructure | null): void {
		this.query = query;
		this.page = 1;
	}

	clearQuery(): void {
		this.query = null;
		this.page = 1;
	}

	toggleRowSelection(id: string): void {
		const next = new Set(this.selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		this.selectedIds = next;
	}

	selectAllVisible(rows: T[]): void {
		const next = new Set(this.selectedIds);
		rows.forEach((row, index) => {
			const id = this.getRowId(row, index);
			next.add(id);
		});
		this.selectedIds = next;
	}

	clearSelection(): void {
		this.selectedIds = new Set();
	}

	isRowSelected(id: string): boolean {
		return this.selectedIds.has(id);
	}

	toggleColumnVisibility(id: string): void {
		const next = new Set(this.hiddenColumnIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		this.hiddenColumnIds = next;
	}

	hideColumn(id: string): void {
		const next = new Set(this.hiddenColumnIds);
		next.add(id);
		this.hiddenColumnIds = next;
	}

	showColumn(id: string): void {
		const next = new Set(this.hiddenColumnIds);
		next.delete(id);
		this.hiddenColumnIds = next;
	}

	showAllColumns(): void {
		this.hiddenColumnIds = new Set();
	}

	hideAllColumns(): void {
		const all = new Set<string>();
		this.columns.forEach((c) => all.add(c.id));
		this.hiddenColumnIds = all;
	}

	setColumnWidth(id: string, width: number): void {
		const next = { ...this.columnWidths };
		const col = this.columns.find((c) => c.id === id);
		const min = col?.minWidth ?? 120;
		const max = col?.maxWidth ?? 480;
		next[id] = Math.min(Math.max(width, min), max);
		this.columnWidths = next;
	}

	resetColumnWidths(): void {
		this.columnWidths = {};
	}

	getColumnWidth(id: string): number {
		const raw = this.columnWidths[id];
		if (raw) return raw;
		const col = this.columns.find((c) => c.id === id);
		if (!col) return 160;
		const base = col.defaultWidth ?? col.minWidth ?? 160;
		return base;
	}

	allColumns = $derived.by(() => this.columns);

	visibleColumns = $derived.by(() => this.columns.filter((c) => !this.hiddenColumnIds.has(c.id)));

	mainColumns = $derived.by(() => {
		if (!this.maxVisibleColumns || this.visibleColumns.length <= this.maxVisibleColumns) {
			return this.visibleColumns;
		}
		return this.visibleColumns.slice(0, this.maxVisibleColumns);
	});

	overflowColumns = $derived.by(() => {
		if (!this.maxVisibleColumns || this.visibleColumns.length <= this.maxVisibleColumns) {
			return [];
		}
		return this.visibleColumns.slice(this.maxVisibleColumns);
	});

	private getFieldValue(row: T, field: string): unknown {
		const col = this.columns.find((c) => c.id === field);
		if (col && col.accessor) return col.accessor(row);
		return (row as unknown as Record<string, unknown>)[field];
	}

	private evalOperator(
		value: unknown,
		operator: FilterOperator,
		raw: string | number | boolean
	): boolean {
		const v = value;
		const target = raw;
		if (operator === 'is_empty') {
			return v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
		}
		if (operator === 'is_not_empty') {
			return !(v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0));
		}
		if (operator === 'in' || operator === 'not_in') {
			const list = Array.isArray(target)
				? (target as unknown[])
				: String(target)
					.split(',')
					.map((x) => x.trim())
					.filter(Boolean);
			const str = v == null ? '' : String(v);
			const result = list.some((x) => String(x) === str);
			return operator === 'in' ? result : !result;
		}
		if (typeof v === 'number' && typeof target === 'number') {
			if (operator === 'equals') return v === target;
			if (operator === 'not_equals') return v !== target;
			if (operator === 'greater_than') return v > target;
			if (operator === 'less_than') return v < target;
		}
		const vs = v == null ? '' : String(v).toLowerCase();
		const ts = String(target).toLowerCase();
		if (operator === 'equals') return vs === ts;
		if (operator === 'not_equals') return vs !== ts;
		if (operator === 'contains') return vs.includes(ts);
		if (operator === 'not_contains') return !vs.includes(ts);
		if (operator === 'greater_than') return vs > ts;
		if (operator === 'less_than') return vs < ts;
		if (operator === 'startsWith') return vs.startsWith(ts);
		if (operator === 'endsWith') return vs.endsWith(ts);
		return true;
	}

	private evalFilter(row: T, filter: Filter): boolean {
		const [field, operator, value] = filter;
		const v = this.getFieldValue(row, field);
		return this.evalOperator(v, operator, value);
	}

	private evalQueryFilters(row: T, join: 'AND' | 'OR', items: QueryFilter[]): boolean {
		if (!items.length) return true;
		if (join === 'AND') {
			for (const item of items) {
				let ok = true;
				if (Array.isArray(item)) ok = this.evalFilter(row, item as Filter);
				else ok = this.evalQueryGroup(row, item as QueryGroup);
				if (!ok) return false;
			}
			return true;
		}
		for (const item of items) {
			let ok = false;
			if (Array.isArray(item)) ok = this.evalFilter(row, item as Filter);
			else ok = this.evalQueryGroup(row, item as QueryGroup);
			if (ok) return true;
		}
		return false;
	}

	private evalQueryGroup(row: T, group: QueryGroup): boolean {
		return this.evalQueryFilters(row, group.joinOperation, group.filters);
	}

	private evalQuery(row: T, query: QueryStructure): boolean {
		if (!query.useQuery || !query.filters.length) return true;
		return this.evalQueryFilters(row, query.joinOperation, query.filters);
	}

	filteredRows = $derived.by(() => {
		let data = this.rows;
		const search = this.search.trim().toLowerCase();
		if (search) {
			data = data.filter((row) => {
				return this.visibleColumns.some((col) => {
					if (col.searchable === false) return false;
					const value = this.getFieldValue(row, col.id);
					if (value == null) return false;
					const str = String(value).toLowerCase();
					return str.includes(search);
				});
			});
		}
		const filters = Object.values(this.filters);
		if (filters.length) {
			data = data.filter((row) => {
				return filters.every((f) => {
					const col = this.columns.find((c) => c.id === f.id);
					if (!col) return true;
					const value = this.getFieldValue(row, col.id);
					if (value == null) return false;
					const str = String(value).toLowerCase();
					return str.includes(f.value.toLowerCase());
				});
			});
		}
		if (this.query && this.query.useQuery && this.query.filters.length) {
			const q = this.query;
			data = data.filter((row) => this.evalQuery(row, q));
		}
		if (this.sortColumn) {
			const col = this.columns.find((c) => c.id === this.sortColumn);
			if (col) {
				const dir = this.sortDirection === 'asc' ? 1 : -1;
				data = [...data].sort((a, b) => {
					const av = this.getFieldValue(a, col.id);
					const bv = this.getFieldValue(b, col.id);
					if (av == null && bv == null) return 0;
					if (av == null) return -1 * dir;
					if (bv == null) return 1 * dir;
					if (typeof av === 'number' && typeof bv === 'number') {
						if (av === bv) return 0;
						return av > bv ? dir : -dir;
					}
					const as = String(av).toLowerCase();
					const bs = String(bv).toLowerCase();
					if (as === bs) return 0;
					return as > bs ? dir : -dir;
				});
			}
		}
		return data;
	});

	totalRows = $derived.by(() => this.filteredRows.length);

	pageCount = $derived.by(() => {
		if (this.mode === 'infinite') return 1;
		if (!this.totalRows) return 1;
		return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
	});

	currentRows = $derived.by(() => {
		if (this.mode === 'infinite') return this.filteredRows;
		const start = (this.page - 1) * this.pageSize;
		const end = start + this.pageSize;
		return this.filteredRows.slice(start, end);
	});

	selectedCount = $derived.by(() => this.selectedIds.size);

	allVisibleSelected = $derived.by(() => {
		if (!this.currentRows.length) return false;
		let all = true;
		this.currentRows.forEach((row, index) => {
			const id = this.getRowId(row, index);
			if (!this.selectedIds.has(id)) all = false;
		});
		return all;
	});

	someVisibleSelected = $derived.by(() => {
		if (!this.currentRows.length) return false;
		let some = false;
		this.currentRows.forEach((row, index) => {
			const id = this.getRowId(row, index);
			if (this.selectedIds.has(id)) some = true;
		});
		return some && !this.allVisibleSelected;
	});
}
