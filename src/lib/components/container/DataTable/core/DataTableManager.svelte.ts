import { SvelteSet } from 'svelte/reactivity';
import type {
  TableOptions,
  TableState,
  VisibilityPlan,
  FetchParams,
  FetchResult
} from './types.js';
import { normalize, defaultAccessor, compareValues, applyFilterOp } from './utils.js';

export class DataTableManager<T extends { id?: any } = any> {
  options: TableOptions<T> = $state({
    perPage: 10,
    perPageOptions: [10, 20, 50, 100],
    multiSelect: true,
    columns: [],
    loadMode: 'local',
    data: [],
  });
  state: TableState<T> = $state({
    ready: false,
    items: [],
    page: 1,
    perPage: this.options.perPage!,
    total: 0,
    sortBy: null,
    sortDir: null,
    filters: [],
    visibleColumns: [],
    hiddenColumns: [],
    selected: new SvelteSet(),
    loading: false,
    error: undefined
  });

  measured = $state<Record<string, number>>({});
  reservedWidth = $state(0);
  forcedVisible: SvelteSet<string> = new SvelteSet();
  forcedHidden: SvelteSet<string> = new SvelteSet();
  expanded: SvelteSet<any> = new SvelteSet();
  lastWidth: number | null = $state<number | null>(null);

  constructor(opts: TableOptions<T>) {
    const columns = normalize(opts.columns);

    this.options = ({
      ...opts,
      columns
    });

    this.state = ({
      ...this.state,
      perPage: this.options.perPage!,
      sortBy: opts.initialSortBy ?? null,
      sortDir: opts.initialSortDir ?? null,
      filters: opts.initialFilters ?? [],
      visibleColumns: columns.map((c) => c.id),
    });
  }

  setMeasuredWidths(map: Record<string, number>) {
    this.measured = map;
    this.reflow();
  }

  get columns() { return this.options.columns; }
  getColumn(id: string) { return this.columns.find((c) => c.id === id)!; }

  isExpanded(id: any) { return this.expanded.has(id); }
  toggleExpand(id: any) { this.isExpanded(id) ? this.expanded.delete(id) : this.expanded.add(id); }

  setColumnVisibility(id: string, show: boolean) {
    if (show) { this.forcedVisible.add(id); this.forcedHidden.delete(id); }
    else { this.forcedHidden.add(id); this.forcedVisible.delete(id); }
    this.reflow();
  }

  setReservedWidth(n: number) {
    if (this.reservedWidth === n) return;
    this.reservedWidth = n;
    this.reflow();
  }

  clearColumnOverrides() {
    this.forcedVisible.clear();
    this.forcedHidden.clear();
    this.reflow();
  }


  visibilityPlan(containerWidth: number): VisibilityPlan {
    const available = Math.max(0, Math.floor(containerWidth) - (this.reservedWidth ?? 0));
    const cols = this.columns;
    const origOrder = cols.map((c) => c.id);

    const needOf = (id: string) => {
      const c = this.getColumn(id);
      const measured = this.measured[id];
      const fallback = Math.max(c.minWidth ?? 0, c.width ?? 0, 160);
      return Math.ceil(measured ?? fallback);
    };

    // columnas que siempre se ocultan en móvil, aunque quepan
    const mustHide = new Set<string>();
    if (available < 640) {
      for (const c of cols) if (c.hideOnMobile) mustHide.add(c.id);
    }

    // empezamos conservando el orden original
    let visible = origOrder.filter((id) => !mustHide.has(id));

    const totalNeed = () => visible.reduce((sum, id) => sum + needOf(id), 0);

    if (totalNeed() > available) {
      // hay que ocultar: orden de descarte por prioridad (más alta => se quita antes)
      // empate: quitamos antes las columnas que están más a la derecha (idx más alto)
      const dropOrder = cols
        .map((c, idx) => ({ id: c.id, pr: c.priority ?? 999, idx }))
        .filter((x) => !mustHide.has(x.id))
        .sort((a, b) => (b.pr - a.pr) || (b.idx - a.idx));

      const hidden = new Set<string>([...mustHide]);

      for (const d of dropOrder) {
        if (totalNeed() <= available) break;
        const k = visible.indexOf(d.id);
        if (k !== -1) {
          visible.splice(k, 1);
          hidden.add(d.id);
        }
      }

      // overrides manuales
      const visSet = new Set(visible);
      for (const id of this.forcedHidden) visSet.delete(id);
      for (const id of this.forcedVisible) if (!mustHide.has(id)) visSet.add(id);

      const finalVisible = origOrder.filter((id) => visSet.has(id) && !mustHide.has(id));
      const finalHidden = origOrder.filter((id) => !finalVisible.includes(id));
      return { visible: finalVisible, hidden: finalHidden };
    }

    // TODO cabe: respetamos tu orden original
    const visSet = new Set(visible);
    for (const id of this.forcedHidden) visSet.delete(id);
    for (const id of this.forcedVisible) if (!mustHide.has(id)) visSet.add(id);

    const finalVisible = origOrder.filter((id) => visSet.has(id) && !mustHide.has(id));
    const finalHidden = origOrder.filter((id) => !finalVisible.includes(id));
    return { visible: finalVisible, hidden: finalHidden };
  }

  private mergeWithOverrides(plan: VisibilityPlan): VisibilityPlan {
    const vis = new Set(plan.visible);
    const hid = new Set(plan.hidden);

    for (const id of this.forcedVisible) { vis.add(id); hid.delete(id); }
    for (const id of this.forcedHidden) { hid.add(id); vis.delete(id); }

    return { visible: [...vis], hidden: [...hid] };
  }

  applyVisibility(plan: VisibilityPlan) {
    this.state.visibleColumns = plan.visible;
    this.state.hiddenColumns = plan.hidden;
  }

  // NUEVO: para usar desde el ResizeObserver
  reflowForWidth(width: number) {
    this.lastWidth = width;
    const base = this.visibilityPlan(width);
    this.applyVisibility(this.mergeWithOverrides(base));
  }

  // NUEVO: reflow con el último ancho conocido (o infinito si no hay)
  reflow() {
    const width = this.lastWidth ?? Number.POSITIVE_INFINITY;
    const base = this.visibilityPlan(width);
    this.applyVisibility(this.mergeWithOverrides(base));
  }

  // Selección / paginación / sort / filtros (sin cambios relevantes)
  setPerPage(n: number) { this.state.perPage = n; this.state.page = 1; return this.load(); }
  setPage(p: number) { this.state.page = p; return this.load(); }
  setSort(id: string) {
    if (this.state.sortBy !== id) { this.state.sortBy = id; this.state.sortDir = 'asc'; }
    else {
      this.state.sortDir = this.state.sortDir === 'asc' ? 'desc' : (this.state.sortDir === 'desc' ? null : 'asc');
    }
    this.state.page = 1;
    return this.load();
  }
  setFilters(filters: typeof this.state.filters) { this.state.filters = filters; this.state.page = 1; return this.load(); }
  clearFilters() { this.state.filters = []; this.state.page = 1; return this.load(); }
  toggleSelect(rowId: any) { const s = this.state.selected; s.has(rowId) ? s.delete(rowId) : s.add(rowId); }
  clearSelection() { this.state.selected.clear(); }
  selectAllCurrentPage(getId: (row: T) => any = (r) => (r as any).id) { this.state.items.forEach((r) => this.state.selected.add(getId(r))); }

  async load(): Promise<void> {
    const { loadMode } = this.options;
    this.state.loading = true; this.state.error = undefined;
    try { if (loadMode === 'local') return await this.loadLocal(); else return await this.loadRemote(); }
    catch (e: any) { this.state.error = e?.message ?? 'Error al cargar'; }
    finally { this.state.loading = false; this.state.ready = true; }
    this.reflow(); // asegura visibilidad coherente tras cargar
  }

  private async loadRemote() {
    const { fetcher } = this.options;
    if (!fetcher) throw new Error('fetcher requerido para modo remoto/cursor');

    const params: FetchParams = {
      page: this.state.page,
      perPage: this.state.perPage,
      cursor: this.state.cursor,
      sortBy: this.state.sortBy,
      sortDir: this.state.sortDir,
      filters: this.state.filters
    };

    const res: FetchResult<T> = await fetcher(params);
    this.state.items = res.items;
    this.state.total = res.total;
    this.state.cursor = res.nextCursor;
  }

  private async loadLocal() {
    const data = this.options.data ?? [];
    let rows = [...data];

    for (const f of this.state.filters) {
      const col = f.columnId ? this.getColumn(f.columnId) : undefined;
      rows = rows.filter((r) => {
        const value = col ? (col.accessor ? col.accessor(r) : (r as any)[col.id]) : (r as any);
        return applyFilterOp(value, f.op, f.value);
      });
    }

    if (this.state.sortBy && this.state.sortDir) {
      const col = this.getColumn(this.state.sortBy);
      rows.sort((a, b) => {
        const va = col.accessor ? col.accessor(a) : defaultAccessor(a as any, col.id);
        const vb = col.accessor ? col.accessor(b) : defaultAccessor(b as any, col.id);
        const cmp = compareValues(va, vb);
        return this.state.sortDir === 'asc' ? cmp : -cmp;
      });
    }

    const start = (this.state.page - 1) * this.state.perPage;
    const end = start + this.state.perPage;

    this.state.total = rows.length;
    this.state.items = rows.slice(start, end);
  }
}