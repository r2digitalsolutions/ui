import type { Snippet } from "svelte";
import type { ClassValue } from "svelte/elements";

export interface Props {
  class?: ClassValue;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  errors?: Record<string, string[]>;
  children?: Snippet;
}