<script lang="ts">
	import type { DataTableController } from '../core/DataTableController.svelte';
	import { Eye, EyeOff, RotateCcw } from 'lucide-svelte';

	interface Props {
		controller: DataTableController<any>;
		onClose?: () => void;
	}

	const { controller, onClose }: Props = $props();

	const allColumns = $derived(controller.allColumns);
	const visibleColumns = $derived(controller.visibleColumns);

	function isVisible(id: string) {
		return visibleColumns.some((c) => c.id === id);
	}

	function toggleColumn(id: string, visible: boolean) {
		controller.setColumnVisibility(id, visible);
	}

	function showAll() {
		controller.showAllColumns();
	}

	function hideAll() {
		controller.hideAllColumns();
	}

	function resetLayout() {
		controller.resetLayout();
	}
</script>

<div class="space-y-2 text-xs">
	<div class="flex items-center justify-between gap-2 pb-1">
		<p class="text-[11px] font-semibold text-neutral-800 dark:text-neutral-100">
			Columnas visibles
		</p>
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={showAll}
				class="inline-flex items-center gap-1 rounded-full bg-neutral-100/90 px-2 py-0.5 text-[10px] text-neutral-700 hover:bg-neutral-200/90 dark:bg-neutral-800/90 dark:text-neutral-100 dark:hover:bg-neutral-700/90"
			>
				<Eye class="h-3 w-3" />
				Todas
			</button>
			<button
				type="button"
				onclick={hideAll}
				class="inline-flex items-center gap-1 rounded-full bg-neutral-100/90 px-2 py-0.5 text-[10px] text-neutral-700 hover:bg-neutral-200/90 dark:bg-neutral-800/90 dark:text-neutral-100 dark:hover:bg-neutral-700/90"
			>
				<EyeOff class="h-3 w-3" />
				Ninguna
			</button>
			<button
				type="button"
				onclick={resetLayout}
				class="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
			>
				<RotateCcw class="h-3 w-3" />
				Reset
			</button>
		</div>
	</div>

	<div class="max-h-64 space-y-1 overflow-y-auto pr-1">
		{#each allColumns as col}
			<label
				class="flex cursor-pointer items-center justify-between gap-2 rounded-2xl px-2 py-1.5 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/80"
			>
				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						checked={isVisible(col.id)}
						onchange={(e) => toggleColumn(col.id, (e.currentTarget as HTMLInputElement).checked)}
						class="h-3.5 w-3.5 rounded border-neutral-300 bg-neutral-50 text-purple-500 focus:ring-purple-500 dark:border-neutral-600 dark:bg-neutral-900"
					/>
					<div class="flex flex-col">
						<span class="text-[11px] text-neutral-800 dark:text-neutral-100">
							{col.label}
						</span>
						<span class="text-[10px] text-neutral-400 dark:text-neutral-500">
							{col.id}
						</span>
					</div>
				</div>
				{#if col.sticky === 'left'}
					<span
						class="rounded-full bg-purple-100/80 px-2 py-0.5 text-[9px] font-semibold text-purple-700 dark:bg-purple-900/50 dark:text-purple-200"
					>
						Sticky
					</span>
				{/if}
			</label>
		{/each}
	</div>

	{#if onClose}
		<div class="pt-1">
			<button
				type="button"
				onclick={onClose}
				class="w-full rounded-2xl bg-neutral-900 px-2 py-1.5 text-[11px] font-medium text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
			>
				Cerrar
			</button>
		</div>
	{/if}
</div>
