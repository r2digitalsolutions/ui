<script lang="ts" generics="T">
	import type { TDataTableColumnDef } from '../core/types.js';
	import { Check, X, ExternalLink } from 'lucide-svelte';

	interface Props<T> {
		column: TDataTableColumnDef<T>;
		row: T;
		measuring?: boolean;
	}
	const { column, row, measuring = false }: Props<T> = $props();

	const raw = column.accessor ? column.accessor(row) : (row as any)[column.id];
	const align = column.align ?? 'left';

	function fmt(val: any) {
		if (val == null) return '';
		switch (column.type) {
			case 'number':
				return typeof val === 'number' ? val.toLocaleString() : val;
			case 'currency':
				return typeof val === 'number'
					? val.toLocaleString(undefined, {
							style: 'currency',
							currency: 'EUR',
							...(column.format ?? {})
						})
					: val;
			case 'date':
				try {
					return new Date(val).toLocaleDateString(undefined, column.format);
				} catch {
					return val;
				}
			case 'datetime':
				try {
					return new Date(val).toLocaleString(undefined, column.format);
				} catch {
					return val;
				}
			case 'code':
				return String(val);
			default:
				return String(val);
		}
	}
</script>

{#if column.type === 'boolean'}
	<div class="inline-flex items-center gap-1" style={`text-align:${align}`}>
		{#if !!raw}
			<Check class="h-4 w-4" />
			<span class="text-sm">{column.trueLabel ?? 'Sí'}</span>
		{:else}
			<X class="h-4 w-4 opacity-60" />
			<span class="text-sm opacity-70">{column.falseLabel ?? 'No'}</span>
		{/if}
	</div>
{:else if column.type === 'link'}
	<a
		class={`inline-flex items-center gap-1 ${measuring ? '' : 'truncate'}`}
		style={`text-align:${align}`}
		href={String(raw)}
		target="_blank"
		rel="noreferrer"
		title={String(raw)}
	>
		<span>{String(raw)}</span>
		<ExternalLink class="h-3 w-3 opacity-60" />
	</a>
{:else if column.type === 'badge'}
	<span
		class={`inline-block rounded-full px-2 py-0.5 text-xs ${measuring ? '' : 'truncate'}`}
		style={`text-align:${align}`}
		title={fmt(raw)}>{fmt(raw)}</span
	>
{:else if column.type === 'code'}
	<code
		class={`rounded bg-gray-100 px-1 py-0.5 text-[12px] dark:bg-gray-800 ${measuring ? '' : 'truncate'}`}
		style={`text-align:${align}`}
		title={fmt(raw)}>{fmt(raw)}</code
	>
{:else}
	<div
		class={`${measuring ? '' : 'truncate'} text-sm`}
		style={`text-align:${align}`}
		title={fmt(raw)}
	>
		{fmt(raw)}
	</div>
{/if}
