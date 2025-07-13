import type { BaseProps } from "$lib/types/base.type.js";
import type { TSize } from "$lib/types/sizes.type.js";

export interface Props extends BaseProps {
  src?: string;
  alt?: string;
  size?: TSize;
  fallback?: string;
  online?: boolean;
}