import type { IBaseProps } from "$lib/types/base.type.js";
import type { Snippet } from "svelte";

export interface Props extends IBaseProps {
  children: Snippet;
}