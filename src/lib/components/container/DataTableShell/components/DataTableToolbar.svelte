<script lang="ts" generics="T">
	import {
		Search,
		SlidersHorizontal,
		LayoutList,
		LayoutGrid,
		X,
		ChevronDown,
		ChevronRight
	} from 'lucide-svelte';
	import { useTable } from '../core/context.js';
	import type { DataTableController } from '../core/DataTableController.svelte';
	import type {
		QueryStructure,
		FilterOperator,
		Operator,
		Filter,
		QueryGroup,
		TQueryFilter
	} from '../core/filters-types.js';

	interface Props {
		density: 'comfortable' | 'compact';
		viewMode: 'list' | 'grid';
		onDensityChange?: (d: 'comfortable' | 'compact') => void;
		onViewModeChange?: (m: 'list' | 'grid') => void;
	}

	const { density, viewMode, onDensityChange, onViewModeChange }: Props = $props();
	const id = $props.id();

	const controller = useTable<T>() as DataTableController<T>;

	let search = $state('');
	let filtersOpen = $state(false);
	let currentQuery = $state<QueryStructure | null>(null);
	let filtersDialog: HTMLDivElement | null = $state(null);

	type LocalCondition = {
		id: number;
		kind: 'condition';
		field: string;
		operator: FilterOperator;
		value: string;
	};

	type LocalGroup = {
		id: number;
		kind: 'group';
		joinOperation: Operator;
		children: LocalFilterNode[];
		collapsed?: boolean;
	};

	type LocalFilterNode = LocalCondition | LocalGroup;

	let rootGroup = $state<LocalGroup>({
		id: 0,
		kind: 'group',
		joinOperation: 'AND',
		children: [],
		collapsed: false
	});

	let nextNodeId = 1;

	const operators: FilterOperator[] = [
		'equals',
		'contains',
		'not_contains',
		'greater_than',
		'less_than',
		'startsWith',
		'endsWith',
		'not_equals',
		'is_empty',
		'is_not_empty',
		'in',
		'not_in'
	];

	const columns = $derived(
		(((controller as any).allColumns ?? []) as { id: string; label: string }[]) || []
	);

	function isConditionUsable(c: LocalCondition) {
		if (!c.field || !c.operator) return false;
		if (c.operator === 'is_empty' || c.operator === 'is_not_empty') return true;
		return c.value != null && String(c.value).trim() !== '';
	}

	function countUsableInNode(node: LocalFilterNode): number {
		if (node.kind === 'condition') {
			return isConditionUsable(node) ? 1 : 0;
		}
		return node.children.reduce((acc, child) => acc + countUsableInNode(child), 0);
	}

	const activeFilterCount = $derived(countUsableInNode(rootGroup));

	function describeOperator(op: FilterOperator) {
		switch (op) {
			case 'equals':
				return '=';
			case 'not_equals':
				return '≠';
			case 'contains':
				return 'contiene';
			case 'not_contains':
				return 'no contiene';
			case 'greater_than':
				return '>';
			case 'less_than':
				return '<';
			case 'startsWith':
				return 'empieza por';
			case 'endsWith':
				return 'termina en';
			case 'is_empty':
				return 'vacío';
			case 'is_not_empty':
				return 'no vacío';
			case 'in':
				return 'en lista';
			case 'not_in':
				return 'no en lista';
			default:
				return op;
		}
	}

	function describeConditionChip(c: LocalCondition) {
		const col = columns.find((col) => col.id === c.field);
		const label = (col?.label ?? c.field) || 'sin columna';
		const op = describeOperator(c.operator);
		if (c.operator === 'is_empty' || c.operator === 'is_not_empty') {
			return `${label} · ${op}`;
		}
		const value =
			c.operator === 'in' || c.operator === 'not_in'
				? c.value
						.split(',')
						.map((v) => v.trim())
						.filter(Boolean)
						.slice(0, 3)
						.join(', ')
				: c.value;
		return `${label} · ${op} ${value}`;
	}

	type FilterChip = {
		id: number;
		label: string;
	};

	function collectChipsFromNode(node: LocalFilterNode, acc: FilterChip[]) {
		if (node.kind === 'condition') {
			if (isConditionUsable(node)) {
				acc.push({
					id: node.id,
					label: describeConditionChip(node)
				});
			}
			return;
		}
		for (const child of node.children) {
			collectChipsFromNode(child, acc);
		}
	}

	const filterChips = $derived.by(() => {
		const acc: FilterChip[] = [];
		collectChipsFromNode(rootGroup, acc);
		return acc;
	});

	$effect(() => {
		controller.setSearch(search.trim());
		controller.setPage(1);
	});

	function openFilters() {
		syncFromQuery();
		filtersOpen = true;
	}

	function closeFilters() {
		filtersOpen = false;
	}

	function mapFromFilters(filters: TQueryFilter): LocalFilterNode[] {
		const result: LocalFilterNode[] = [];
		for (const f of filters) {
			if (Array.isArray(f)) {
				const [field, operator, value] = f as Filter;
				result.push({
					id: nextNodeId++,
					kind: 'condition',
					field: String(field),
					operator: operator as FilterOperator,
					value:
						value == null
							? ''
							: Array.isArray(value)
								? (value as (string | number | boolean)[]).join(', ')
								: String(value)
				});
			} else if (f && (f as QueryGroup).type === 'group') {
				const g = f as QueryGroup;
				const group: LocalGroup = {
					id: nextNodeId++,
					kind: 'group',
					joinOperation: g.joinOperation,
					children: mapFromFilters(g.filters),
					collapsed: false
				};
				result.push(group);
			}
		}
		return result;
	}

	function syncFromQuery() {
		const q =
			((controller as any).query as QueryStructure | undefined | null) ?? currentQuery ?? null;

		nextNodeId = 1;

		if (!q || !q.useQuery || !q.filters?.length) {
			rootGroup = {
				id: nextNodeId++,
				kind: 'group',
				joinOperation: 'AND',
				children: [],
				collapsed: false
			};
			currentQuery = null;
			return;
		}

		rootGroup = {
			id: nextNodeId++,
			kind: 'group',
			joinOperation: q.joinOperation,
			children: mapFromFilters(q.filters),
			collapsed: false
		};

		currentQuery = q;
	}

	function updateGroup(
		node: LocalGroup,
		targetId: number,
		fn: (g: LocalGroup) => LocalGroup
	): LocalGroup {
		if (node.id === targetId) {
			return fn(node);
		}
		return {
			...node,
			children: node.children.map((child) => {
				if (child.kind === 'group') {
					return updateGroup(child, targetId, fn);
				}
				return child;
			})
		};
	}

	function removeNodeFromGroup(node: LocalGroup, targetId: number): LocalGroup {
		return {
			...node,
			children: node.children
				.filter((child) => child.id !== targetId)
				.map((child) => (child.kind === 'group' ? removeNodeFromGroup(child, targetId) : child))
		};
	}

	function addConditionToGroup(groupId: number) {
		rootGroup = updateGroup(rootGroup, groupId, (g) => ({
			...g,
			children: [
				...g.children,
				{
					id: nextNodeId++,
					kind: 'condition',
					field: '',
					operator: 'equals',
					value: ''
				} as LocalCondition
			]
		}));
	}

	function addGroupToGroup(groupId: number) {
		rootGroup = updateGroup(rootGroup, groupId, (g) => ({
			...g,
			children: [
				...g.children,
				{
					id: nextNodeId++,
					kind: 'group',
					joinOperation: 'AND',
					children: [],
					collapsed: false
				} as LocalGroup
			]
		}));
	}

	function removeFilterNode(id: number) {
		if (id === rootGroup.id) return;
		rootGroup = removeNodeFromGroup(rootGroup, id);
	}

	function toggleGroupCollapse(id: number) {
		rootGroup = updateGroup(rootGroup, id, (g) => ({
			...g,
			collapsed: !g.collapsed
		}));
	}

	function updateGroupJoinOperation(id: number, op: Operator) {
		rootGroup = updateGroup(rootGroup, id, (g) => ({
			...g,
			joinOperation: op
		}));
	}

	function toFilterNode(node: LocalFilterNode): Filter | QueryGroup | null {
		if (node.kind === 'condition') {
			if (!isConditionUsable(node)) return null;
			let value: string | number | boolean | string[] = node.value;
			if (node.operator === 'in' || node.operator === 'not_in') {
				value = node.value
					.split(',')
					.map((v) => v.trim())
					.filter(Boolean);
			}
			return [node.field, node.operator, value];
		}
		const children = node.children
			.map(toFilterNode)
			.filter((c): c is Filter | QueryGroup => c != null);
		if (!children.length) return null;
		return {
			type: 'group',
			joinOperation: node.joinOperation,
			filters: children
		};
	}

	function clearFilters() {
		rootGroup = {
			id: rootGroup.id || 0,
			kind: 'group',
			joinOperation: 'AND',
			children: [],
			collapsed: false
		};
		currentQuery = null;
		controller.setQuery(null as any);
	}

	function applyFilters() {
		const filters = rootGroup.children
			.map(toFilterNode)
			.filter((c): c is Filter | QueryGroup => c != null);

		if (!filters.length) {
			controller.setQuery(null as any);
			currentQuery = null;
			filtersOpen = false;
			return;
		}

		const q: QueryStructure = {
			useQuery: true,
			joinOperation: rootGroup.joinOperation,
			filters
		};

		controller.setQuery(q);
		currentQuery = q;
		filtersOpen = false;
		controller.setPage(1);
	}

	function handleDensityClick(d: 'comfortable' | 'compact') {
		if (onDensityChange) onDensityChange(d);
	}

	function handleViewModeClick(m: 'list' | 'grid') {
		if (onViewModeChange) onViewModeChange(m);
	}

	function clearSearch() {
		if (!search) return;
		search = '';
	}

	function removeChip(id: number) {
		removeFilterNode(id);
		applyFilters();
	}

	const styles_sidebar = $derived.by(() => {
		let styles = `
		  inset: auto;
			position-anchor: --filters-dialog-${id};
			position-area: right bottom;
  		position-try-fallbacks: flip-block;
			transform: translateX(-100%);
			margin-block-start: 0.5rem;
		`;

		return styles;
	});
</script>

{#snippet FilterCondition({ condition }: { condition: LocalCondition })}
	<div
		class="rounded-2xl border border-neutral-200/80 bg-white/90 px-3 py-2 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/90"
	>
		<div class="mb-1 flex items-center justify-between gap-2">
			<span
				class="text-[10px] font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400"
			>
				Condición
			</span>
			<button
				type="button"
				class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-red-50 hover:text-red-500 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
				onclick={() => removeFilterNode(condition.id)}
			>
				Quitar
			</button>
		</div>

		<div class="grid grid-cols-1 gap-1.5">
			<select
				class="w-full rounded-xl border border-neutral-200/80 bg-white/95 px-2 py-1.5 text-[11px] text-neutral-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/70 dark:border-neutral-700/80 dark:bg-neutral-900/90 dark:text-neutral-50"
				bind:value={condition.field}
			>
				<option value="">Columna…</option>
				{#each columns as col}
					<option value={col.id}>{col.label}</option>
				{/each}
			</select>

			<select
				class="w-full rounded-xl border border-neutral-200/80 bg-white/95 px-2 py-1.5 text-[11px] text-neutral-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/70 dark:border-neutral-700/80 dark:bg-neutral-900/90 dark:text-neutral-50"
				bind:value={condition.operator}
			>
				{#each operators as op}
					<option value={op}>{op}</option>
				{/each}
			</select>

			{#if condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty'}
				<input
					type="text"
					placeholder={condition.operator === 'in' || condition.operator === 'not_in'
						? 'Valores separados por coma…'
						: 'Valor…'}
					bind:value={condition.value}
					class="w-full rounded-xl border border-neutral-200/80 bg-white/95 px-2 py-1.5 text-[11px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/70 dark:border-neutral-700/80 dark:bg-neutral-900/90 dark:text-neutral-50 dark:placeholder:text-neutral-500"
				/>
			{:else}
				<div
					class="rounded-xl border border-dashed border-neutral-200/80 bg-neutral-50/90 px-2 py-1.5 text-[10px] text-neutral-500 dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-400"
				>
					Este operador no necesita valor.
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet FilterGroup({ group, isRoot }: { group: LocalGroup; isRoot: boolean })}
	<div
		class="rounded-2xl border border-neutral-200/80 bg-gradient-to-b from-white/98 to-neutral-50/95 px-3 py-2.5 shadow-md dark:border-neutral-800/80 dark:from-neutral-950/98 dark:to-neutral-900/95"
	>
		<div class="mb-2 flex items-center justify-between gap-2">
			<div class="flex items-center gap-1.5">
				<button
					type="button"
					class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
					onclick={() => toggleGroupCollapse(group.id)}
				>
					{#if group.collapsed}
						<ChevronRight class="h-3.5 w-3.5" />
					{:else}
						<ChevronDown class="h-3.5 w-3.5" />
					{/if}
				</button>
				<div class="flex flex-col">
					<span class="text-[11px] font-semibold text-neutral-900 dark:text-neutral-50">
						{isRoot ? 'Grupo raíz' : 'Grupo'}
					</span>
					<span class="text-[10px] text-neutral-500 dark:text-neutral-400">
						Condiciones unidas con
						<span class="font-semibold"> {group.joinOperation}</span>
					</span>
				</div>
			</div>

			<div class="flex items-center gap-1">
				<div
					class="inline-flex items-center rounded-full border border-neutral-200/80 bg-neutral-100/80 p-0.5 text-[10px] text-neutral-700 dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-200"
				>
					<button
						type="button"
						class={`inline-flex items-center rounded-full px-2 py-0.5 ${
							group.joinOperation === 'AND'
								? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
								: 'hover:text-neutral-900 dark:hover:text-neutral-50'
						}`}
						onclick={() => updateGroupJoinOperation(group.id, 'AND')}
					>
						AND
					</button>
					<button
						type="button"
						class={`inline-flex items-center rounded-full px-2 py-0.5 ${
							group.joinOperation === 'OR'
								? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
								: 'hover:text-neutral-900 dark:hover:text-neutral-50'
						}`}
						onclick={() => updateGroupJoinOperation(group.id, 'OR')}
					>
						OR
					</button>
				</div>

				{#if !isRoot}
					<button
						type="button"
						class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-red-50 hover:text-red-500 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
						onclick={() => removeFilterNode(group.id)}
					>
						Quitar
					</button>
				{/if}
			</div>
		</div>

		{#if !group.collapsed}
			<div
				class="space-y-2 border-l border-dashed border-neutral-200/80 pl-3 dark:border-neutral-700/80"
			>
				{#if !group.children.length}
					<div
						class="rounded-xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-2.5 py-2 text-[10px] text-neutral-500 dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-400"
					>
						Este grupo no tiene condiciones. Añade una condición o un subgrupo.
					</div>
				{:else}
					<div class="space-y-1.5">
						{#each group.children as child (child.id)}
							{#if child.kind === 'group'}
								{@render FilterGroup({ group: child, isRoot: false })}
							{:else}
								{@render FilterCondition({ condition: child })}
							{/if}
						{/each}
					</div>
				{/if}

				<div class="mt-2 flex flex-wrap items-center gap-1.5">
					<button
						type="button"
						class="inline-flex items-center justify-center rounded-xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-2.5 py-1 text-[10px] text-neutral-700 hover:border-purple-500 hover:text-purple-600 dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:border-purple-500 dark:hover:text-purple-200"
						onclick={() => addConditionToGroup(group.id)}
					>
						+ Condición
					</button>
					<button
						type="button"
						class="inline-flex items-center justify-center rounded-xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-2.5 py-1 text-[10px] text-neutral-700 hover:border-purple-500 hover:text-purple-600 dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:border-purple-500 dark:hover:text-purple-200"
						onclick={() => addGroupToGroup(group.id)}
					>
						+ Subgrupo
					</button>
				</div>
			</div>
		{/if}
	</div>
{/snippet}

<div
	class="flex flex-col gap-1 border-b border-neutral-200/80 bg-gradient-to-r from-neutral-50/95 via-white/95 to-neutral-50/95 px-3 py-2 text-[11px] text-neutral-600 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-neutral-800/80 dark:from-neutral-950/90 dark:via-neutral-950/85 dark:to-neutral-900/85 dark:text-neutral-300"
>
	<div class="flex items-center justify-between gap-3">
		<div class="flex min-w-0 flex-1 items-center gap-3">
			<div class="relative max-w-xs flex-1">
				<input
					type="search"
					placeholder="Buscar…"
					bind:value={search}
					class="w-full rounded-xl border border-neutral-200/80 bg-white/80 py-1.5 pr-7 pl-7 text-[11px] text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/60 dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-50 dark:placeholder:text-neutral-500"
				/>
				<div class="pointer-events-none absolute inset-y-0 left-2 flex items-center">
					<Search class="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
				</div>
				{#if search}
					<button
						type="button"
						class="absolute inset-y-0 right-1 flex items-center justify-center rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
						onclick={clearSearch}
					>
						<X class="h-3 w-3" />
					</button>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-2">
			<div
				class="hidden items-center gap-0.5 rounded-full border border-neutral-200/80 bg-white/80 p-0.5 text-[10px] text-neutral-500 shadow-sm sm:inline-flex dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-300"
			>
				<button
					type="button"
					class={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
						density === 'comfortable'
							? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
							: 'hover:text-neutral-800 dark:hover:text-neutral-100'
					}`}
					onclick={() => handleDensityClick('comfortable')}
				>
					<span class="hidden md:inline">Cómodo</span>
					<span class="md:hidden">C</span>
				</button>
				<button
					type="button"
					class={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
						density === 'compact'
							? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
							: 'hover:text-neutral-800 dark:hover:text-neutral-100'
					}`}
					onclick={() => handleDensityClick('compact')}
				>
					<span class="hidden md:inline">Compacto</span>
					<span class="md:hidden">X</span>
				</button>
			</div>

			<div
				class="inline-flex items-center gap-0.5 rounded-full border border-neutral-200/80 bg-white/80 p-0.5 text-[10px] text-neutral-500 shadow-sm dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-300"
			>
				<button
					type="button"
					class={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
						viewMode === 'list'
							? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
							: 'hover:text-neutral-800 dark:hover:text-neutral-100'
					}`}
					onclick={() => handleViewModeClick('list')}
				>
					<LayoutList class="h-3 w-3" />
					<span class="hidden sm:inline">Lista</span>
				</button>
				<button
					type="button"
					class={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
						viewMode === 'grid'
							? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
							: 'hover:text-neutral-800 dark:hover:text-neutral-100'
					}`}
					onclick={() => handleViewModeClick('grid')}
				>
					<LayoutGrid class="h-3 w-3" />
					<span class="hidden sm:inline">Grid</span>
				</button>
			</div>

			<button
				type="button"
				class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-neutral-200/80 bg-white/80 px-2.5 py-1.5 text-[10px] font-medium text-neutral-600 shadow-sm transition-colors hover:border-purple-300 hover:text-purple-600 dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-300 dark:hover:border-purple-500/60 dark:hover:text-purple-100"
				popovertarget="filters-dialog-{id}"
				style="anchor-name: --filters-dialog-{id};"
			>
				<SlidersHorizontal class="h-3.5 w-3.5" />
				<span class="hidden sm:inline">Filtros</span>
				{#if activeFilterCount}
					<span
						class="ml-1 rounded-full bg-purple-600 px-1.5 py-[1px] text-[9px] font-semibold text-white shadow-sm dark:bg-purple-500"
					>
						{activeFilterCount}
					</span>
				{/if}
			</button>
		</div>
	</div>

	{#if filterChips.length}
		<div class="flex min-w-0 flex-wrap items-center gap-1.5">
			{#each filterChips as chip}
				<button
					type="button"
					class="group inline-flex max-w-xs items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
					onclick={() => removeChip(chip.id)}
				>
					<span class="truncate">
						{chip.label}
					</span>
					<span
						class="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-300/70 text-[9px] text-neutral-700 group-hover:bg-neutral-400 dark:bg-neutral-700/70 dark:text-neutral-100 dark:group-hover:bg-neutral-600"
					>
						<X class="h-2.5 w-2.5" />
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<div
	popover
	id="filters-dialog-{id}"
	bind:this={filtersDialog}
	style={styles_sidebar}
	class="overflow-visible rounded-2xl border border-neutral-200/80 bg-gradient-to-b from-neutral-50/98 via-neutral-50/95 to-neutral-100/95 text-[11px] text-neutral-900 shadow-sm dark:border-neutral-800/80 dark:from-neutral-950/98 dark:via-neutral-950/95 dark:to-neutral-900/95 dark:text-neutral-50"
>
	<div class="flex max-h-[80vh] w-[min(360px,100vw-16px)] flex-col p-3">
		<header class="mb-2 flex items-center justify-between gap-2">
			<div class="flex flex-col gap-0.5">
				<h3 class="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
					Filtros avanzados
				</h3>
				<p class="text-[10px] text-neutral-500 dark:text-neutral-400">
					Combina grupos AND/OR para refinar los resultados.
				</p>
			</div>
		</header>

		<div
			class="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-neutral-200/80 bg-white/80 px-3 py-2 text-[10px] shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/80"
		>
			<div class="flex flex-col">
				<span class="font-medium text-neutral-800 dark:text-neutral-100"> Operador raíz </span>
				<span class="text-neutral-500 dark:text-neutral-400">
					Une los grupos superiores con
					<span class="font-semibold"> {rootGroup.joinOperation}</span>
				</span>
			</div>
			<div
				class="inline-flex items-center rounded-full border border-neutral-200/80 bg-neutral-100/80 p-0.5 text-[10px] text-neutral-700 dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-200"
			>
				<button
					type="button"
					class={`inline-flex items-center rounded-full px-2 py-0.5 ${
						rootGroup.joinOperation === 'AND'
							? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
							: 'hover:text-neutral-900 dark:hover:text-neutral-50'
					}`}
					onclick={() => updateGroupJoinOperation(rootGroup.id, 'AND')}
				>
					AND
				</button>
				<button
					type="button"
					class={`inline-flex items-center rounded-full px-2 py-0.5 ${
						rootGroup.joinOperation === 'OR'
							? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
							: 'hover:text-neutral-900 dark:hover:text-neutral-50'
					}`}
					onclick={() => updateGroupJoinOperation(rootGroup.id, 'OR')}
				>
					OR
				</button>
			</div>
		</div>

		<div class="flex-1 space-y-2 overflow-auto pr-1">
			{#if !columns.length}
				<div
					class="rounded-xl border border-dashed border-neutral-300/80 bg-white/90 px-3 py-2 text-[10px] text-neutral-500 shadow-inner dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-400"
				>
					No hay columnas configuradas para filtrar.
				</div>
			{/if}

			{@render FilterGroup({ group: rootGroup, isRoot: true })}
		</div>

		<footer
			class="mt-3 flex items-center justify-between gap-2 border-t border-neutral-200/80 pt-2 dark:border-neutral-800/80"
		>
			<button
				type="button"
				class="rounded-xl px-2.5 py-1.5 text-[10px] text-neutral-500 hover:bg-neutral-200/80 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
				onclick={clearFilters}
			>
				Limpiar filtros
			</button>
			<div class="flex items-center gap-2">
				{#if activeFilterCount}
					<div
						class="hidden items-center gap-1 rounded-full bg-neutral-900/90 px-2 py-1 text-[9px] text-neutral-100 shadow-sm md:inline-flex dark:bg-neutral-800/90"
					>
						<span>{activeFilterCount} condición{activeFilterCount === 1 ? '' : 'es'}</span>
					</div>
				{/if}
				<button
					type="button"
					class="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-purple-500 disabled:opacity-40"
					onclick={applyFilters}
					disabled={!activeFilterCount}
				>
					<span>Aplicar</span>
					{#if activeFilterCount}
						<span class="rounded-full bg-white/15 px-1.5 py-[1px] text-[9px]">
							{activeFilterCount}
						</span>
					{/if}
				</button>
			</div>
		</footer>
	</div>
</div>
