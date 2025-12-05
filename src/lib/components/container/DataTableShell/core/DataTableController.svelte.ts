import type { DataTableEngine, DataTableOptions, SortDirection } from './DataTableEngine.svelte';
import { DataTableEngine as Engine } from './DataTableEngine.svelte';
import type { QueryStructure } from './filters-types.js';

export class DataTableController<T> {
	#engine: DataTableEngine<T>;
	#query: QueryStructure | null = null;

	constructor(options: DataTableOptions<T>) {
		this.#engine = new Engine<T>(options);
	}

	get options(): DataTableOptions<T> {
		return this.#engine.options;
	}

	get rows(): T[] {
		return this.#engine.rows;
	}

	get processedRows(): T[] {
		return this.#engine.processedRows;
	}

	get currentRows(): T[] {
		return this.#engine.currentPageRows;
	}

	get allColumns() {
		return this.#engine.allColumns;
	}

	get visibleColumns() {
		return this.#engine.visibleColumns;
	}

	get mainColumns() {
		return this.#engine.mainColumns;
	}

	get overflowColumns() {
		return this.#engine.overflowColumns;
	}

	get loading(): boolean {
		return this.#engine.loading;
	}

	get page(): number {
		return this.#engine.page;
	}

	get pageSize(): number {
		return this.#engine.pageSize;
	}

	get totalPages(): number {
		return this.#engine.totalPages;
	}

	get totalRows(): number {
		return this.#engine.totalRows;
	}

	get totalFilteredRows(): number {
		return this.#engine.totalFilteredRows;
	}

	get sortColumn(): keyof T | null {
		return this.#engine.sortColumn;
	}

	get sortDirection(): SortDirection | null {
		return this.#engine.sortColumn ? this.#engine.sortDirection : null;
	}

	get sort() {
		return this.#engine.sortColumn
			? { columnId: this.#engine.sortColumn, direction: this.#engine.sortDirection }
			: null;
	}

	get search(): string {
		return this.#engine.search;
	}

	get selectedIds(): Set<string> {
		return this.#engine.selectedIds;
	}

	get selectedCount(): number {
		return this.#engine.selectedCount;
	}

	get multiSelect(): boolean {
		return !!this.#engine.options.multiSelect;
	}

	get allVisibleSelected(): boolean {
		return this.#engine.allVisibleSelected;
	}

	get someVisibleSelected(): boolean {
		return this.#engine.someVisibleSelected;
	}

	get isAllPageSelected(): boolean {
		return this.#engine.isAllPageSelected;
	}

	get query(): QueryStructure | null {
		return this.#query;
	}

	getRowId(row: T, index: number): string {
		return this.#engine.getRowId(row, index);
	}

	setRows(rows: T[]) {
		this.#engine.setRows(rows);
		return this;
	}

	setLoading(v: boolean) {
		this.#engine.setLoading(v);
	}

	setSearch(term: string) {
		this.#engine.setSearch(term);
	}

	setQuery(q: QueryStructure | null) {
		this.#query = q;
		this.#engine.setQuery(q);
	}

	setSort(columnId: keyof T | null, direction: SortDirection = 'asc') {
		this.#engine.setSort(columnId, direction);
	}

	toggleSort(columnId: keyof T) {
		this.#engine.toggleSort(columnId);
	}

	setPage(page: number) {
		this.#engine.setPage(page);
	}

	setPageSize(size: number) {
		this.#engine.setPageSize(size);
	}

	clearSelection() {
		this.#engine.clearSelection();
	}

	toggleRowSelection(id: string) {
		this.#engine.toggleRowSelection(id);
	}

	selectAllVisible() {
		this.#engine.selectAllVisible();
	}

	unselectAllVisible() {
		this.#engine.unselectAllVisible();
	}

	selectAllCurrentPage() {
		this.#engine.selectAllCurrentPage();
	}

	unselectAllCurrentPage() {
		this.#engine.unselectAllCurrentPage();
	}

	isRowSelected(id: string): boolean {
		return this.#engine.selectedIds.has(id);
	}

	setColumnHidden(id: keyof T, hidden: boolean) {
		this.#engine.setColumnHidden(id, hidden);
	}

	resizeColumn(id: keyof T, width: number) {
		this.#engine.resizeColumn(id, width);
	}

	getColumnWidth(id: keyof T): number {
		return this.#engine.getColumnWidth(id);
	}

	resetLayout() {
		this.#engine.resetLayout();
		this.#query = null;
	}
}
