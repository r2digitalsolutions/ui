<script lang="ts" generics="T">
	import { ChevronLeft } from 'lucide-svelte';
	import type { DataTableController } from '../core/DataTableController.svelte';

	interface Props<T> {
		controller: DataTableController<T>;
	}

	const { controller }: Props<T> = $props();

	const pageWindow = 5;

	const pages = $derived.by(() => {
		const total = controller.totalPages;
		const current = controller.page;
		if (total <= 1) return [1];
		const half = Math.floor(pageWindow / 2);
		let start = Math.max(1, current - half);
		let end = Math.min(total, start + pageWindow - 1);
		if (end - start + 1 < pageWindow) {
			start = Math.max(1, end - pageWindow + 1);
		}
		const arr: number[] = [];
		for (let i = start; i <= end; i++) arr.push(i);
		return arr;
	});
</script>

<div
	class="flex items-center justify-between gap-3 text-[11px] text-neutral-400 md:text-neutral-600"
>
	<div class="flex items-center gap-2">
		<span>
			Mostrando
			<span class="font-semibold text-neutral-100 md:text-neutral-900 dark:md:text-neutral-50">
				{controller.currentRows.length}
			</span>
			de
			<span class="font-semibold text-neutral-100 md:text-neutral-900 dark:md:text-neutral-50">
				{controller.totalFilteredRows}
			</span>
			resultados
		</span>
	</div>

	<div class="flex items-center gap-2">
		<button
			type="button"
			class="inline-flex h-7 items-center rounded-full border border-neutral-600/70 bg-neutral-950/80 px-2 text-[11px] text-neutral-300 disabled:opacity-40 md:bg-white/90 md:text-neutral-700 dark:md:bg-neutral-900 dark:md:text-neutral-100"
			onclick={() => controller.setPage(controller.page - 1)}
			disabled={controller.page <= 1}
		>
			<ChevronLeft class="h-3 w-3" />
		</button>

		<div class="flex items-center gap-1">
			{#if pages[0] > 1}
				<button
					type="button"
					class="h-7 min-w-[1.75rem] rounded-full border border-neutral-600/70 bg-neutral-950/80 px-2 text-[11px] text-neutral-300 hover:border-purple-500/70 hover:text-purple-300 md:bg-white/90 md:text-neutral-700 md:hover:text-purple-600 dark:md:bg-neutral-900 dark:md:text-neutral-100"
					onclick={() => controller.setPage(1)}
				>
					1
				</button>
				<span class="px-1 text-[10px] text-neutral-500">…</span>
			{/if}

			{#each pages as page}
				<button
					type="button"
					class={`h-7 min-w-[1.75rem] rounded-full px-2 text-[11px] ${
						page === controller.page
							? 'bg-purple-500 text-white shadow-sm'
							: 'border border-neutral-600/70 bg-neutral-950/80 text-neutral-300 hover:border-purple-500/70 hover:text-purple-300 md:bg-white/90 md:text-neutral-700 md:hover:text-purple-600 dark:md:bg-neutral-900 dark:md:text-neutral-100'
					}`}
					onclick={() => controller.setPage(page)}
				>
					{page}
				</button>
			{/each}

			{#if pages[pages.length - 1] < controller.totalPages}
				<span class="px-1 text-[10px] text-neutral-500">…</span>
				<button
					type="button"
					class="h-7 min-w-[1.75rem] rounded-full border border-neutral-600/70 bg-neutral-950/80 px-2 text-[11px] text-neutral-300 hover:border-purple-500/70 hover:text-purple-300 md:bg-white/90 md:text-neutral-700 md:hover:text-purple-600 dark:md:bg-neutral-900 dark:md:text-neutral-100"
					onclick={() => controller.setPage(controller.totalPages)}
				>
					{controller.totalPages}
				</button>
			{/if}
		</div>

		<button
			type="button"
			class="inline-flex h-7 items-center rounded-full border border-neutral-600/70 bg-neutral-950/80 px-2 text-[11px] text-neutral-300 disabled:opacity-40 md:bg-white/90 md:text-neutral-700 dark:md:bg-neutral-900 dark:md:text-neutral-100"
			onclick={() => controller.setPage(controller.page + 1)}
			disabled={controller.page >= controller.totalPages}
		>
			›
		</button>

		<select
			class="rounded-2xl border border-neutral-200/80 bg-white/70 px-2 py-1 text-[11px] text-neutral-700 shadow-sm dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-100"
			onchange={(e) => {
				const value = Number((e.currentTarget as HTMLSelectElement).value);
				controller.setPageSize(value);
			}}
		>
			{#each [10, 20, 50, 100] as size}
				<option value={size} selected={size === controller.pageSize}>
					{size} / página
				</option>
			{/each}
		</select>
	</div>
</div>
