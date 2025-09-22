export type RowId = string | number;
export type SortDir = 'asc' | 'desc' | null;
export type ColumnKey<T> = Extract<keyof T, string>;
export type Accessor<T, R = any> = (row: T) => R;

export type ColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'badge'
  | 'link'
  | 'code';

type BaseColumn<T> = {
  header: string;
  width?: number;
  minWidth?: number;
  priority?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  hideOnMobile?: boolean;
  responsiveLabel?: string;
  class?: string;
  type?: ColumnType;
  format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions;
  trueLabel?: string;   // para boolean
  falseLabel?: string;  // para boolean
};

/** Columna ligada a una key existente de T (autocomplete de keys) */
export type KeyColumn<T, K extends ColumnKey<T> = ColumnKey<T>> = BaseColumn<T> & {
  id: K;
  accessor?: (row: T) => T[K];
  renderCell?: (row: T) => any;
  renderCollapsed?: (row: T) => any;
};

/** Columna virtual (id libre), requiere accessor explícito */
export type VirtualColumn<T> = BaseColumn<T> & {
  id: string; // no restringido a keyof T
  accessor: Accessor<T>; // requerido si no es key real
  renderCell?: (row: T) => any;
  renderCollapsed?: (row: T) => any;
};

export type ColumnDef<T> = KeyColumn<T>
export type FilterOp =
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
export type FilterDef<T> = {
  id: string;
  label: string;
  columnId?: string;
  op: FilterOp;
  value?: any;
  meta?: Record<string, any>;
};
export type FetchResult<T> = { items: T[]; total: number; nextCursor?: string };
export type FetchParams = {
  page: number;
  perPage: number;
  cursor?: string;
  sortBy?: string | null;
  sortDir?: SortDir;
  filters: FilterDef<any>[];
};
export type LoadMode = 'local' | 'remote' | 'cursor';
export type TableOptions<T> = {
  id?: string;
  columns: ColumnDef<T>[];
  loadMode: LoadMode;
  data?: T[];
  fetcher?: (params: FetchParams) => Promise<FetchResult<T>>;
  perPage?: number;
  perPageOptions?: number[];
  multiSelect?: boolean;
  keepSelectionOnPageChange?: boolean;
  initialSortBy?: string | null;
  initialSortDir?: SortDir;
  initialFilters?: FilterDef<T>[];
};
export type TableState<T> = {
  ready: boolean;
  items: T[];
  page: number;
  perPage: number;
  total: number;
  cursor?: string;
  sortBy: string | null;
  sortDir: SortDir;
  filters: FilterDef<T>[];
  visibleColumns: string[];
  hiddenColumns: string[];
  selected: Set<RowId>;
  loading: boolean;
  error?: string;
};
export type VisibilityPlan = { visible: string[]; hidden: string[] };
export type CellContext<T> = {
  row: T | null;
  rowIndex: number | null;
  columnId: string | null;
  column: ColumnDef<T> | null;
  columnIndex: number | null;
  event: MouseEvent;
};