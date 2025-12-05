export type SortDirection = 'asc' | 'desc';

export type DataTableMode = 'pagination' | 'infinite';

export type ColumnAlign = 'left' | 'center' | 'right';

export type ColumnType = 'text' | 'number' | 'date' | 'datetime' | 'badge';

export interface ColumnDef<T> {
	id: keyof T;
	label: string;
	accessor?: (row: T) => unknown;
	sortable?: boolean;
	minWidth?: number;
	maxWidth?: number;
	defaultWidth?: number;
	hidden?: boolean;
	align?: ColumnAlign;
	searchable?: boolean;
	type?: ColumnType;
	format?: (value: unknown, row: T) => string;
	sticky?: 'left' | 'right';
}

export interface RowAction<T> {
	id: string;
	label: ((row: T) => any) | string;
	danger?: boolean;
	icon?: (row: T) => unknown;
	onClick?: (row: T) => Promise<void> | void;
	children?: RowAction<T>[];
}

export interface DataTableOptions<T> {
	idField?: (row: T, index: number) => string;
	columns: ColumnDef<T>[];
	pageSize?: number;
	mode?: DataTableMode;
	multiSelect?: boolean;
	maxVisibleColumns?: number;
	stickyColumns?: string[];
	stickyRows?: (row: T, index: number) => boolean;
}

export interface ColumnFilter {
	id: string;
	value: string;
}

export type FilterOperator =
	| 'equals'
	| 'contains'
	| 'greater_than'
	| 'less_than'
	| 'startsWith'
	| 'endsWith'
	| 'not_equals'
	| 'is_empty'
	| 'is_not_empty'
	| 'not_contains'
	| 'in'
	| 'not_in';

export type LogicOperator = 'AND' | 'OR';

export type Filter = [string, FilterOperator, string | number | boolean];

export type QueryFilter = Filter | QueryGroup;
export type TQueryFilter = QueryFilter[];

export type QueryGroup = {
	type: 'group';
	joinOperation: LogicOperator;
	filters: QueryFilter[];
};

export type QueryStructure = {
	useQuery: boolean;
	joinOperation: LogicOperator;
	filters: QueryFilter[];
};

export type AnyAction<T> = RowAction<T> & {
	children?: AnyAction<T>[];
	hidden?: ((row: T) => boolean) | boolean;
};
