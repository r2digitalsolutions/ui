export type TDataTableRowId = string | number;
export type TDataTableSortDir = 'asc' | 'desc' | null;
export type TDataTableColumnKey<T> = Extract<keyof T, string>;
export type TDataTableAccessor<T, R = any> = (row: T) => R;

export type TDataTableColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'badge'
  | 'link'
  | 'code';

type TDataTableBaseColumn<T> = {
  header: string;
  width?: number;
  minWidth?: number;
  priority?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  hideOnMobile?: boolean;
  responsiveLabel?: string;
  class?: string;
  type?: TDataTableColumnType;
  format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions;
  trueLabel?: string;   // para boolean
  falseLabel?: string;  // para boolean
};

/** Columna ligada a una key existente de T (autocomplete de keys) */
export type TDataTableKeyColumn<T, K extends TDataTableColumnKey<T> = TDataTableColumnKey<T>> = TDataTableBaseColumn<T> & {
  id: K;
  accessor?: (row: T) => T[K];
  renderCell?: (row: T) => any;
  renderCollapsed?: (row: T) => any;
};

/** Columna virtual (id libre), requiere accessor explícito */
export type TDataTableVirtualColumn<T> = TDataTableBaseColumn<T> & {
  id: string; // no restringido a keyof T
  accessor: TDataTableAccessor<T>; // requerido si no es key real
  renderCell?: (row: T) => any;
  renderCollapsed?: (row: T) => any;
};

export type TDataTableColumnDef<T> = TDataTableKeyColumn<T>
export type TDataTableFilterOp =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';
export type TDataTableFilterDef<T> = {
  id: string;
  label: string;
  columnId?: string;
  op: TDataTableFilterOp;
  value?: any;
  meta?: Record<string, any>;
};
export type TDataTableFetchResult<T> = { items: T[]; total: number; nextCursor?: string };
export type TDataTableFetchParams = {
  page: number;
  perPage: number;
  cursor?: string;
  sortBy?: string | null;
  sortDir?: TDataTableSortDir;
  filters: TDataTableFilterDef<any>[];
};
export type TDataTableLoadMode = 'local' | 'remote' | 'cursor';
export type TDataTableTableOptions<T> = {
  id?: string;
  columns: TDataTableColumnDef<T>[];
  loadMode: TDataTableLoadMode;
  data?: T[];
  fetcher?: (params: TDataTableFetchParams) => Promise<TDataTableFetchResult<T>>;
  perPage?: number;
  perPageOptions?: number[];
  multiSelect?: boolean;
  keepSelectionOnPageChange?: boolean;
  initialSortBy?: string | null;
  initialSortDir?: TDataTableSortDir;
  initialFilters?: TDataTableFilterDef<T>[];
};
export type TDataTableTableState<T> = {
  ready: boolean;
  items: T[];
  page: number;
  perPage: number;
  total: number;
  cursor?: string;
  sortBy: string | null;
  sortDir: TDataTableSortDir;
  filters: TDataTableFilterDef<T>[];
  visibleColumns: string[];
  hiddenColumns: string[];
  selected: Set<TDataTableRowId>;
  loading: boolean;
  error?: string;
};
export type TDataTableVisibilityPlan = { visible: string[]; hidden: string[] };
export type TDataTableCellContext<T> = {
  row: T | null;
  rowIndex: number | null;
  columnId: string | null;
  column: TDataTableColumnDef<T> | null;
  columnIndex: number | null;
  event: MouseEvent;
};

export type TContextMenuEntry = {
  id: string;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: TContextMenuEntry[];
  kind?: 'item' | 'divider' | 'label';
};