import type { ClassValue } from "svelte/elements";

export interface Props {
  onchange?: (value: string | null, e: Event) => void;
  class?: ClassValue;
  rows?: number;
  cols?: number;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  autofocus?: boolean;
  value?: string;
  name?: string;
  required?: boolean;
  maxlength?: number;
  minlength?: number;
  autocomplete?: 'on' | 'off';
}