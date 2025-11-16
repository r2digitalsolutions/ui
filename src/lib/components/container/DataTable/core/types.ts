export type TDataTableRowId = string | number;
export type TDataTableSortDir = 'asc' | 'desc' | null;

// Clave de columna basada en las keys de T
export type TDataTableColumnKey<T> = Extract<keyof T, string>;

// Accessor genérico
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
  /** Título mostrado en el header */
  header: string;

  /** Ancho fijo en px (si lo quieres forzar) */
  width?: number;

  /** Ancho mínimo en px (usado también como fallback para auto-medición) */
  minWidth?: number;

  /** Prioridad para ocultar en responsive (más alto = se oculta antes) */
  priority?: number;

  /** Alineación del contenido de la celda */
  align?: 'left' | 'center' | 'right';

  /** Si la columna es ordenable */
  sortable?: boolean;

  /** Forzar ocultar en mobile, incluso si cabe */
  hideOnMobile?: boolean;

  /** Label a usar cuando la columna se muestra en el panel colapsado (expand) */
  responsiveLabel?: string;

  /** Clases extra para esta columna (celdas) */
  class?: string;

  /** Tipo semántico de columna (para Cell: formateo, badge, boolean, etc.) */
  type?: TDataTableColumnType;

  /** Opciones de Intl para number/date según el type */
  format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions;

  /** Labels personalizados para boolean true/false */
  trueLabel?: string;
  falseLabel?: string;
};

/** Columna ligada a una key existente de T (autocomplete de keys) */
export type TDataTableKeyColumn<
  T,
  K extends TDataTableColumnKey<T> = TDataTableColumnKey<T>
> = TDataTableBaseColumn<T> & {
  /** ID de la columna, atado a una key real de T */
  id: K;

  /** Accessor opcional, si quieres derivar el valor a partir de la key */
  accessor?: (row: T) => T[K];

  /** Render personalizado para la celda en vista normal */
  renderCell?: (row: T) => any;

  /** Render personalizado para la celda en vista colapsada (expand) */
  renderCollapsed?: (row: T) => any;
};

/** Columna virtual (id libre), pensada para valores derivados o acciones */
export type TDataTableVirtualColumn<T> = TDataTableBaseColumn<T> & {
  /** ID de la columna, no está restringido a keyof T */
  id: string;

  /** Accessor requerido: cómo obtener el valor a mostrar en esta columna */
  accessor: TDataTableAccessor<T>;

  /** Render personalizado para la celda en vista normal */
  renderCell?: (row: T) => any;

  /** Render personalizado para la celda en vista colapsada (expand) */
  renderCollapsed?: (row: T) => any;
};

/**
 * Definición de columna: puede ser una columna ligada a una key real de T
 * o una columna virtual con accessor obligatorio.
 */
export type TDataTableColumnDef<T> = TDataTableKeyColumn<T> | TDataTableVirtualColumn<T>;

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
  /** ID interno del filtro (para guardarlo, etc.) */
  id: string;

  /** Label visible del filtro (UI) */
  label: string;

  /**
   * ID de columna a la que aplica el filtro.
   * Puede ser una key de T o una columna virtual (string).
   */
  columnId?: TDataTableColumnKey<T> | string;

  op: TDataTableFilterOp;

  value?: any;

  /** Metadata auxiliar para la UI del filtro (select options, etc.) */
  meta?: Record<string, unknown>;
};

export type TDataTableFetchResult<T> = {
  items: T[];
  total: number;
  nextCursor?: string;
};

export type TDataTableFetchParams = {
  page: number;
  perPage: number;
  cursor?: string;
  sortBy?: string | null;
  sortDir?: TDataTableSortDir;
  // En remoto normalmente se serializa y se parsea allí,
  // así que lo dejamos genérico.
  filters: TDataTableFilterDef<any>[];
};

export type TDataTableLoadMode = 'local' | 'remote' | 'cursor';

export type TDataTableTableOptions<T> = {
  /** ID lógico de la tabla (por si quieres guardar preferencias de usuario, etc.) */
  id?: string;

  /** Definición de columnas */
  columns: TDataTableColumnDef<T>[];

  /** Modo de carga de datos: local / remoto / cursor */
  loadMode: TDataTableLoadMode;

  /** Datos en memoria para loadMode = 'local' */
  data?: T[];

  /** Función fetcher para loadMode = 'remote' | 'cursor' */
  fetcher?: (params: TDataTableFetchParams) => Promise<TDataTableFetchResult<T>>;

  /** Tamaño de página por defecto */
  perPage?: number;

  /** Opciones disponibles de tamaño de página */
  perPageOptions?: number[];

  /** Permitir selección múltiple */
  multiSelect?: boolean;

  /** Mantener selección al cambiar de página */
  keepSelectionOnPageChange?: boolean;

  /** Sort inicial (id de columna) */
  initialSortBy?: string | null;

  /** Dirección de sort inicial */
  initialSortDir?: TDataTableSortDir;

  /** Filtros iniciales */
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

export type TDataTableVisibilityPlan = {
  visible: string[];
  hidden: string[];
};

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
