import type { IBaseProps } from "$lib/types/base.type.js";
import type { TSize } from "$lib/types/sizes.type.js";

export interface Props extends IBaseProps {
  src?: string;
  alt?: string;
  size?: TSize;
  fallback?: string;
  online?: boolean;
}