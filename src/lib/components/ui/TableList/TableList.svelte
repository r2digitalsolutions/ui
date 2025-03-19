<script lang="ts">
	import { Database, RefreshCw, Table2 } from 'lucide-svelte';
	import type { Props } from './type.js';

	const {
		items,
		selected_table,
		is_loading_tables,
		search_term,
		title,
		onSelectTable,
		onRefreshTables,
		onSearchChange
	}: Props = $props();

	const filteredTables = $derived(
		items.filter((table) => table.name.toLowerCase().includes(search_term.toLowerCase()))
	);
</script>

<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
	<div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
		<div class="flex items-center">
			<Database class="mr-2 h-5 w-5 text-indigo-500 dark:text-indigo-300" />
			<h3 class="text-sm font-medium text-gray-700 dark:text-white">{title}</h3>
		</div>
		<button
			onclick={onRefreshTables}
			disabled={is_loading_tables}
			class="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700"
			title="Refresh tables"
		>
			<RefreshCw class={`h-4 w-4 dark:text-white ${is_loading_tables ? 'animate-spin' : ''}`} />
		</button>
	</div>

	<div class="border-b border-gray-200 p-3 dark:border-gray-700">
		<div class="relative">
			<input
				type="text"
				value={search_term}
				onchange={(e) => onSearchChange(e.currentTarget.value)}
				placeholder="Search tables..."
				class="w-full rounded-md border border-gray-300 py-1.5 pr-10 pl-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
			/>
			{#if search_term}
				<button
					type="button"
					aria-label="Clear search"
					onclick={() => onSearchChange('')}
					class="absolute top-1/2 right-2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-400"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<div class="max-h-96 overflow-y-auto">
		{#if is_loading_tables}
			<div class="flex items-center justify-center py-8">
				<div
					class="h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500 dark:border-indigo-300"
				></div>
			</div>
		{:else}
			<ul class="divide-y divide-gray-200 dark:divide-gray-700">
				{#each filteredTables as table}
					<li>
						<a
							href={table?.href}
							onclick={(e) => {
								if (table.href) {
									e.preventDefault();
								}

								onSelectTable(table.name);
							}}
							class={[
								'flex cursor-pointer items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800',
								{
									'bg-indigo-50 dark:bg-indigo-900': selected_table === table.name
								}
							]}
						>
							<Table2
								class={`mr-2 h-4 w-4 ${selected_table === table.name ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400 dark:text-gray-300'}`}
							/>
							<span
								class={`text-sm ${selected_table === table.name ? 'font-medium text-indigo-600 dark:text-indigo-300' : 'font-normal text-gray-700 dark:text-gray-300'}`}
							>
								{table.name}
							</span>
							<span class="ml-auto text-xs text-gray-500 dark:text-gray-400">
								{table.right}
							</span>
						</a>
					</li>
				{:else}
					<li class="py-8 text-center text-gray-500 dark:text-gray-400">
						<p>No tables found</p>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
