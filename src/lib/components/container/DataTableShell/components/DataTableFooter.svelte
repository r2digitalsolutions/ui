<script lang="ts">
	import { useTable } from '../core/context.js';
	import Pagination from './Pagination.svelte';

	const controller = useTable<any>();

	function rangeLabel() {
		if (!controller.totalRows) return '';
		const start = (controller.page - 1) * controller.pageSize + 1;
		const end = Math.min(controller.page * controller.pageSize, controller.totalRows);
		return `${start}–${end} de ${controller.totalRows}`;
	}
</script>

<div
	class="flex flex-col gap-2 border-t border-neutral-200/80 bg-neutral-50/70 px-3 py-2 text-[11px] text-neutral-600 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/60 dark:text-neutral-300"
>
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
			<span>{rangeLabel()}</span>
			{#if controller.selectedCount}
				<span
					class="rounded-full bg-purple-100/80 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-200"
				>
					{controller.selectedCount} seleccionadas
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-3">
			{#if controller.options.mode === 'pagination'}
				<Pagination {controller} />
			{/if}
		</div>
	</div>
</div>
