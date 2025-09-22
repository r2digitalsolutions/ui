import type { ColumnDef, FilterOp } from './types.js';
export function normalize<T>(columns: ColumnDef<T>[]): ColumnDef<T>[] {
  return columns.map((c, i) => ({
    width: 160,
    minWidth: 96,
    priority: i,
    align: 'left',
    sortable: true,
    ...c
  }));
}
export function defaultAccessor<T>(row: any, id: string) {
  return row?.[id];
}
export function compareValues(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}
export function applyFilterOp(value: any, op: FilterOp, target: any): boolean {
  switch (op) {
    case 'equals':
      return value === target;
    case 'not_equals':
      return value !== target;
    case 'contains':
      return String(value ?? '')
        .toLowerCase()
        .includes(String(target ?? '').toLowerCase());
    case 'starts_with':
      return String(value ?? '')
        .toLowerCase()
        .startsWith(String(target ?? '').toLowerCase());
    case 'ends_with':
      return String(value ?? '')
        .toLowerCase()
        .endsWith(String(target ?? '').toLowerCase());
    case 'gt':
      return value > target;
    case 'lt':
      return value < target;
    case 'gte':
      return value >= target;
    case 'lte':
      return value <= target;
    case 'in':
      return Array.isArray(target) ? target.includes(value) : false;
    case 'not_in':
      return Array.isArray(target) ? !target.includes(value) : false;
    case 'is_empty':
      return value == null || value === '';
    case 'is_not_empty':
      return !(value == null || value === '');
    default:
      return true;
  }
}
