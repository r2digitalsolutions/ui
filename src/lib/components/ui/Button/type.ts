import type { IBaseProps } from "$lib/types/base.type.js";
import type { TSize } from "$lib/types/sizes.type.js";
import type { Snippet } from "svelte";

export type TButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'danger' | 'success' | 'warning' | 'info';
export type TButtonType = 'submit' | 'reset' | 'button';

export interface Props extends IBaseProps {
  onclick?: (event: MouseEvent) => void;
  variant?: TButtonVariant;
  size?: TSize;
  isLoading?: boolean;
  children: Snippet;
  disabled?: boolean;
  href?: string;
  // If href is present, type is not allowed
  type?: Props['href'] extends string ? never : TButtonType;
}