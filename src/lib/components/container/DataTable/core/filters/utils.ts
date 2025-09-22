import type { FilterDef } from "../types.js";
import type { FilterField } from "./types.js";

export function buildFilterDefs<T>(fields: FilterField<T>[], values: Record<string, any>): FilterDef<T>[] {
  const defs: FilterDef<T>[] = [];
  for (const f of fields) {
    const v = values[f.id];
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    if (f.type === 'range') {
      const { min, max } = (v ?? {}) as { min?: number; max?: number };
      if (min != null) defs.push({ id: `${f.id}_min`, label: f.label, columnId: f.columnId, op: 'gte', value: min, meta: { field: f.id, part: 'min' } });
      if (max != null) defs.push({ id: `${f.id}_max`, label: f.label, columnId: f.columnId, op: 'lte', value: max, meta: { field: f.id, part: 'max' } });
      continue;
    }
    switch (f.type) {
      case 'text':
        defs.push({ id: f.id, label: f.label, columnId: f.columnId, op: f.op ?? 'contains', value: String(v) });
        break;
      case 'number':
        defs.push({ id: f.id, label: f.label, columnId: f.columnId, op: f.op ?? 'equals', value: Number(v) });
        break;
      case 'date':
        defs.push({ id: f.id, label: f.label, columnId: f.columnId, op: f.op ?? 'equals', value: v });
        break;
      case 'checkbox':
        if (v === true) defs.push({ id: f.id, label: f.label, columnId: f.columnId, op: f.op ?? 'equals', value: true });
        break;
      case 'select':
        defs.push({ id: f.id, label: f.label, columnId: f.columnId, op: f.op ?? 'equals', value: v });
        break;
      case 'multiselect':
        defs.push({ id: f.id, label: f.label, columnId: f.columnId, op: f.op ?? 'in', value: Array.isArray(v) ? v : [v] });
        break;
      case 'rating':
        defs.push({ id: f.id, label: f.label, columnId: f.columnId, op: f.op ?? 'gte', value: Number(v) });
        break;
      default:
        break;
    }
  }
  return defs;
}