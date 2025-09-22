<script lang="ts">
	import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-svelte';

	interface Props {
		page: number;
		perPage: number;
		total: number;
		perPageOptions?: number[];
		onchange?: (p: number) => void;
		onperpage?: (n: number) => void;
	}

	let {
		page,
		perPage = $bindable(10),
		total,
		perPageOptions = [10, 20, 50, 100],
		onchange,
		onperpage
	}: Props = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(total / perPage)));

	function go(n: number) {
		if (n < 1 || n > totalPages) return;
		onchange?.(n);
	}
</script>

<div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
	<div class="text-sm opacity-70">Página {page} de {totalPages} — {total} filas</div>
	<div class="flex items-center gap-2">
		<select
			class="rounded-xl border border-gray-200 px-2 py-1 pr-6 dark:border-gray-800"
			bind:value={perPage}
			onchange={(e) => onperpage?.(Number((e.target as HTMLSelectElement).value))}
		>
			{#each perPageOptions as n}<option value={n}>{n} / pág</option>{/each}
		</select>
		<div class="inline-flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
			<button
				class="flex items-center gap-2 px-3 py-1.5 disabled:opacity-40"
				disabled={page <= 1}
				onclick={() => go(page - 1)}
			>
				<ChevronLeftIcon class="h-4 w-4" />
				Prev
			</button>
			<button
				class="flex items-center gap-2 px-3 py-1.5 disabled:opacity-40"
				disabled={page >= totalPages}
				onclick={() => go(page + 1)}
			>
				Next
				<ChevronRightIcon class="h-4 w-4" />
			</button>
		</div>
	</div>
</div>
