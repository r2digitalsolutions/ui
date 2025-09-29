import type { Snippet } from "svelte";

export type StepDef = {
  id: string;
  label: string;
  icon?: any;
  content: Snippet<[]>;
  tooltip?: string;
  disabled?: boolean;
};