import type { TDataTableFilterOp } from "../types.js";

export type FilterInputType = 'text' | 'select' | 'number' | 'range' | 'checkbox' | 'multiselect' | 'date' | 'rating';
export type SelectOption = { label: string; value: any };
export type FilterField<T> = {
  id: string;
  label: string;
  type: FilterInputType;
  columnId?: string;
  options?: SelectOption[];
  op?: TDataTableFilterOp;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};