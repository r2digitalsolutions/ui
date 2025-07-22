import type { Snippet } from "svelte";
import type { ClassValue } from "svelte/elements";

export interface Props {
  onclick?: () => void;
  children: Snippet;
  selected?: boolean;
  class?: ClassValue;
}