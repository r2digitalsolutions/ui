<script lang="ts">
	import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-svelte';
	import type { DataTableController } from '../core/DataTableController.svelte';
	import type {
		Filter,
		FilterOperator,
		LogicOperator,
		QueryGroup,
		QueryStructure,
		TQueryFilter
	} from '../core/types.js';

	interface Props {
		controller: DataTableController<any>;
	}

	const { controller }: Props = $props();

	type LocalRule = {
		id: string;
		kind: 'rule';
		field: string;
		operator: FilterOperator;
		value: string;
	};

	type LocalGroup = {
		id: string;
		kind: 'group';
		join: LogicOperator;
		children: Array<LocalRule | LocalGroup>;
		expanded: boolean;
	};

	let enabled = $state(false);

	let root: LocalGroup = $state({
		id: 'root',
		kind: 'group',
		join: 'AND',
		children: [],
		expanded: true
	});

	let counter = 1;

	const columns = $derived(controller.allColumns);

	function createRule(): LocalRule {
		return {
			id: `r-${counter++}`,
			kind: 'rule',
			field: columns[0]?.id ?? '',
			operator: 'contains',
			value: ''
		};
	}

	function createGroup(): LocalGroup {
		return {
			id: `g-${counter++}`,
			kind: 'group',
			join: 'AND',
			children: [],
			expanded: true
		};
	}

	function addRule(group: LocalGroup) {
		group.children = [...group.children, createRule()];
	}

	function addGroup(group: LocalGroup) {
		group.children = [...group.children, createGroup()];
	}

	function removeChild(parent: LocalGroup, id: string) {
		parent.children = parent.children.filter((c) => c.id !== id);
	}

	function toggleExpanded(group: LocalGroup) {
		group.expanded = !group.expanded;
	}

	function buildFilters(group: LocalGroup): TQueryFilter {
		const out: TQueryFilter = [];

		for (const child of group.children) {
			if (child.kind === 'rule') {
				if (!child.field) continue;
				const op = child.operator;
				const needsValue = op !== 'is_empty' && op !== 'is_not_empty';
				if (needsValue && !child.value) continue;

				out.push([child.field, child.operator, child.value] as Filter);
			} else {
				const nested = buildFilters(child);
				if (!nested.length) continue;

				const g: QueryGroup = {
					type: 'group',
					joinOperation: child.join,
					filters: nested
				};

				out.push(g);
			}
		}

		return out;
	}

	function apply() {
		const filters = buildFilters(root);

		const query: QueryStructure = {
			useQuery: enabled && filters.length > 0,
			joinOperation: root.join,
			filters
		};

		controller.setQuery(query);
	}

	function clear() {
		root = {
			id: 'root',
			kind: 'group',
			join: 'AND',
			children: [],
			expanded: true
		};
		enabled = false;

		const query: QueryStructure = {
			useQuery: false,
			joinOperation: 'AND',
			filters: []
		};

		controller.setQuery(query);
	}
</script>

{#snippet Group({ group, parent }: { group: LocalGroup; parent: LocalGroup | null })}
	<div
		class={`rounded-2xl border border-neutral-200/80 bg-white/80 px-3 py-2 text-[11px] text-neutral-800 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/85 dark:text-neutral-100 ${
			group.id === 'root' ? '' : 'mt-2 ml-3'
		}`}
	>
		<div class="mb-2 flex items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => toggleExpanded(group)}
					class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100/90 text-neutral-500 hover:bg-neutral-200/90 dark:bg-neutral-800/90 dark:text-neutral-300 dark:hover:bg-neutral-700/90"
				>
					{#if group.expanded}
						<ChevronDown class="h-3 w-3" />
					{:else}
						<ChevronRight class="h-3 w-3" />
					{/if}
				</button>
				<div
					class="flex items-center gap-1 rounded-full bg-neutral-900/95 px-2 py-0.5 text-[10px] font-medium text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
				>
					<span>Grupo</span>
					<select
						bind:value={group.join}
						class="ml-1 rounded-full border border-neutral-700/60 bg-neutral-900/95 px-1.5 py-0.5 text-[10px] text-neutral-50 focus:outline-none dark:border-neutral-300/80 dark:bg-neutral-50/95 dark:text-neutral-900"
					>
						<option value="AND">AND</option>
						<option value="OR">OR</option>
					</select>
				</div>
			</div>

			<div class="flex items-center gap-1">
				<button
					type="button"
					onclick={() => addRule(group)}
					class="inline-flex items-center gap-1 rounded-full bg-neutral-100/95 px-2 py-0.5 text-[10px] text-neutral-700 hover:bg-neutral-200/95 dark:bg-neutral-800/95 dark:text-neutral-100 dark:hover:bg-neutral-700/95"
				>
					<Plus class="h-3 w-3" />
					Condición
				</button>
				<button
					type="button"
					onclick={() => addGroup(group)}
					class="inline-flex items-center gap-1 rounded-full bg-neutral-100/95 px-2 py-0.5 text-[10px] text-neutral-700 hover:bg-neutral-200/95 dark:bg-neutral-800/95 dark:text-neutral-100 dark:hover:bg-neutral-700/95"
				>
					<Plus class="h-3 w-3" />
					Grupo
				</button>
				{#if parent}
					<button
						type="button"
						onclick={() => parent && removeChild(parent, group.id)}
						class="inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200/80 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700/80 dark:hover:text-neutral-100"
					>
						<Trash2 class="h-3 w-3" />
					</button>
				{/if}
			</div>
		</div>

		{#if group.expanded}
			{#if group.children.length}
				<div class="space-y-1">
					{#each group.children as child (child.id)}
						{#if child.kind === 'rule'}
							<div
								class="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_auto] items-center gap-1 rounded-2xl bg-neutral-50/95 px-2 py-1.5 dark:bg-neutral-950/80"
							>
								<select
									bind:value={child.field}
									class="w-full rounded-xl border border-neutral-200/80 bg-white/95 px-2 py-0.5 text-[10px] text-neutral-800 focus:outline-none dark:border-neutral-700/80 dark:bg-neutral-900/95 dark:text-neutral-50"
								>
									{#each columns as col}
										<option value={col.id}>{col.label}</option>
									{/each}
								</select>
								<select
									bind:value={child.operator}
									class="w-full rounded-xl border border-neutral-200/80 bg-white/95 px-2 py-0.5 text-[10px] text-neutral-800 focus:outline-none dark:border-neutral-700/80 dark:bg-neutral-900/95 dark:text-neutral-50"
								>
									<option value="contains">contiene</option>
									<option value="equals">igual a</option>
									<option value="not_equals">distinto de</option>
									<option value="greater_than">mayor que</option>
									<option value="less_than">menor que</option>
									<option value="startsWith">empieza por</option>
									<option value="endsWith">termina en</option>
									<option value="is_empty">vacío</option>
									<option value="is_not_empty">no vacío</option>
									<option value="in">en lista</option>
									<option value="not_in">fuera de lista</option>
									<option value="not_contains">no contiene</option>
								</select>
								<input
									type="text"
									bind:value={child.value}
									placeholder="Valor"
									class="w-full rounded-xl border border-neutral-200/80 bg-white/95 px-2 py-0.5 text-[10px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none dark:border-neutral-700/80 dark:bg-neutral-900/95 dark:text-neutral-50 dark:placeholder:text-neutral-500"
									disabled={child.operator === 'is_empty' || child.operator === 'is_not_empty'}
								/>
								<button
									type="button"
									onclick={() => removeChild(group, child.id)}
									class="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200/80 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700/80 dark:hover:text-neutral-100"
								>
									<Trash2 class="h-3 w-3" />
								</button>
							</div>
						{:else}
							{@render Group({ group: child as LocalGroup, parent: group })}
						{/if}
					{/each}
				</div>
			{:else}
				<div class="text-[11px] text-neutral-400 dark:text-neutral-500">
					Este grupo aún no tiene condiciones.
				</div>
			{/if}
		{/if}
	</div>
{/snippet}

<div
	class="mt-2 rounded-2xl border border-dashed border-neutral-200/80 bg-gradient-to-br from-neutral-50/95 via-white/95 to-purple-50/80 px-3 py-3 text-[11px] text-neutral-700 shadow-[0_14px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-neutral-800/80 dark:bg-gradient-to-br dark:from-neutral-950/95 dark:via-neutral-950/90 dark:to-purple-950/40 dark:text-neutral-200"
>
	<div class="mb-2 flex items-center justify-between gap-2">
		<div>
			<p class="text-[11px] font-semibold text-neutral-800 dark:text-neutral-100">
				Filtro avanzado
			</p>
			<p class="text-[10px] text-neutral-500 dark:text-neutral-400">
				Combina condiciones con grupos AND/OR. Los filtros simples siguen funcionando aparte.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<label
				class="flex cursor-pointer items-center gap-1 rounded-full bg-neutral-100/90 px-2 py-0.5 text-[10px] text-neutral-700 dark:bg-neutral-800/90 dark:text-neutral-100"
			>
				<input
					type="checkbox"
					bind:checked={enabled}
					class="h-3 w-3 rounded border-neutral-300 bg-neutral-50 text-purple-500 focus:ring-purple-500 dark:border-neutral-600 dark:bg-neutral-900"
				/>
				<span>Activar</span>
			</label>
			<button
				type="button"
				onclick={clear}
				class="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
			>
				<Trash2 class="h-3 w-3" />
				Limpiar
			</button>
			<button
				type="button"
				onclick={apply}
				class="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400"
			>
				Aplicar
			</button>
		</div>
	</div>

	{@render Group({ group: root, parent: null })}
</div>
