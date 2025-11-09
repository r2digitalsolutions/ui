const SHELL_TRANSPARENT = "backdrop-blur-xl ring-1 ring-neutral-200/80 dark:ring-neutral-800/80 shadow-xs shadow-black/10 dark:bg:transparent bg-white/95";
const SHELL =
  'bg-white/95 dark:bg-neutral-950/95 ' + SHELL_TRANSPARENT;
const ACCENT_GRADIENT = 'from-indigo-500 via-violet-500 to-blue-500';

const LOCAL_STYLES = {
  SHELL,
  SHELL_TRANSPARENT,
  SHELL_ROUNDED: 'rounded-2xl ' + SHELL,
  INPUT_SHELL: [
    'flex h-11 w-full items-center gap-3 rounded-xl',
    'border border-neutral-200/80 bg-white/90 px-3 text-sm text-neutral-900',
    'shadow-xs ring-1 ring-black/5 transition',
    'hover:border-neutral-300 hover:bg-white',
    'dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-100 dark:ring-white/5',
    'hover:dark:border-neutral-600 hover:dark:bg-neutral-900'
  ].join(' '),
  ITEM_BASE:
    'flex items-center rounded-xl px-2 py-1.5 select-none transition shadow-none ring-1 ring-transparent border border-transparent',
  ITEM_HOVER: 'hover:bg-neutral-100/60 hover:dark:bg-neutral-800/50 cursor-pointer',
  ITEM_ACTIVE:
    'bg-neutral-50/95 dark:bg-neutral-900/85 ring-1 !ring-indigo-400/60 dark:ring-indigo-500/70 border !border-indigo-200/70 dark:border-indigo-600/70',
  GROUP_TITLE:
    'px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400',
  ACCENT_GRADIENT,
  ACCENT: 'bg-gradient-to-b ' + ACCENT_GRADIENT
} as const;

export const STYLES = { ...LOCAL_STYLES };