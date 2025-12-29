<script lang="ts">
	import type { Option, Props } from './type.js';
	import { BoxSelect, Check, ChevronDown, Save, Search, X, Plus, ChevronLeft } from 'lucide-svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import Tag from '$lib/components/ui/Tag/Tag.svelte';
	import Dialog from '$lib/components/ui/Dialog/Dialog.svelte';
	import DialogHeader from '$lib/components/ui/Dialog/DialogHeader.svelte';
	import DialogTitle from '$lib/components/ui/Dialog/DialogTitle.svelte';
	import DialogDescription from '$lib/components/ui/Dialog/DialogDescription.svelte';
	import Input from '$lib/components/ui/Input/Input.svelte';
	import DialogContent from '$lib/components/ui/Dialog/DialogContent.svelte';
	import Checkbox from '$lib/components/ui/Checkbox/Checkbox.svelte';
	import DialogFooter from '$lib/components/ui/Dialog/DialogFooter.svelte';
	import Button from '$lib/components/ui/Button/Button.svelte';
	import { i18n } from '$lib/settings/index.js';
	import NoContent from '$lib/components/ui/NoContent/NoContent.svelte';
	import Field from '$lib/components/ui/Field/Field.svelte';

	let {
		options,
		value = $bindable(),
		label,
		name,
		placeholder,
		multiple = true,
		onConfirm,
		onCancel,
		onValueChange, // ✅ NUEVO (para padre “controlado” sin bind)
		required,
		errors = [],
		item,

		tree = false,
		childrenKey = 'children',
		selectParents = false,
		showPathInSearch = true,

		// UX opcional: si single y quieres cerrar al elegir
		closeOnPick = false,

		debug = false,
		...props
	}: Props = $props();

	let open = $state(false);
	let search = $state('');

	let selected_items = $state(new SvelteMap<string, Option>());
	let pending_selection = $state(new SvelteMap<string, Option>());

	let navStack = $state<string[]>([]);

	const keyOf = (v: unknown) => String(v ?? '').trim();
	const getChildren = (opt: Option): Option[] => ((opt as any)?.[childrenKey] as Option[]) ?? [];
	const hasChildren = (opt: Option) => getChildren(opt)?.length > 0;

	function log(...args: any[]) {
		if (!debug) return;
		const safe = args.map((a) => {
			try {
				return $state.snapshot(a);
			} catch {
				return a;
			}
		});
		console.log(`[Select:${name}]`, ...safe);
	}

	// ===== indexado árbol
	function flattenTree(
		nodes: Option[],
		parentValue: string | null,
		out: Option[] = [],
		parentBy = new Map<string, string | null>(),
		childrenBy = new Map<string, string[]>(),
		byValue = new Map<string, Option>()
	) {
		for (const n of nodes ?? []) {
			const k = keyOf((n as any)?.value);
			const node: Option = { ...(n as any), value: k };

			byValue.set(k, node);
			parentBy.set(k, parentValue);
			out.push(node);

			const children = getChildren(n);
			if (children?.length) {
				childrenBy.set(
					k,
					children.map((c) => keyOf((c as any)?.value))
				);
				flattenTree(children, k, out, parentBy, childrenBy, byValue);
			}
		}
		return { out, parentBy, childrenBy, byValue };
	}

	const treeIndex = $derived.by(() => {
		const normalized = (options ?? []).map((o) => ({
			...(o as any),
			value: keyOf((o as any).value)
		}));
		return flattenTree(normalized, null);
	});

	const flatOptions = $derived.by(() => treeIndex.out);
	const byValue = $derived.by(() => treeIndex.byValue);
	const parentByValue = $derived.by(() => treeIndex.parentBy);
	const childrenByValue = $derived.by(() => treeIndex.childrenBy);

	function canonical(opt: Option) {
		const k = keyOf(opt?.value);
		return byValue.get(k) ?? { ...(opt as any), value: k };
	}

	function getPathValues(v: string) {
		const path: string[] = [];
		let cur: string | null | undefined = v;
		while (cur) {
			path.push(cur);
			cur = parentByValue.get(cur) ?? null;
		}
		return path.reverse();
	}

	function getPathLabel(v: string) {
		const parts = getPathValues(v)
			.map((pv) => byValue.get(pv)?.label)
			.filter(Boolean) as string[];
		return parts.join(' › ');
	}

	const pendingKeys = $derived.by(() => {
		const s = new Set<string>();
		for (const k of pending_selection.keys()) s.add(keyOf(k));
		return s;
	});

	// ===== IMPORTANTE:
	// Solo sincronizamos selected_items con value externo (edit inicial / controlado)
	$effect(() => {
		const next = new SvelteMap<string, Option>();
		for (const v of value ?? []) {
			const ov =
				v && typeof v === 'object'
					? (v as Option)
					: ({ label: String(v), value: String(v) } as Option);
			const c = canonical(ov);
			next.set(keyOf(c.value), c);
		}
		selected_items = next;
	});

	function firstKey(map: SvelteMap<string, Option>) {
		for (const k of map.keys()) return k;
		return null;
	}

	function computeNavStackForSelection(map: SvelteMap<string, Option>) {
		if (!tree) return [];
		if (!map.size) return [];

		const k = firstKey(map);
		if (!k) return [];

		const kk = keyOf(k);
		const selectedOpt = byValue.get(kk);

		// si no existe en index, no forzamos nav
		if (!selectedOpt) return [];

		const path = getPathValues(kk);

		// si tiene hijos, abrir dentro del seleccionado
		if (hasChildren(selectedOpt)) return path;

		// si es leaf, abrir en su padre
		return path.slice(0, -1);
	}

	function rebuildMapFromArray(arr: Option[] | undefined) {
		const next = new SvelteMap<string, Option>();
		for (const v of arr ?? []) {
			const c = canonical(v);
			next.set(keyOf(c.value), c);
		}
		return next;
	}

	function openDialog() {
		search = '';

		// Abrimos con lo que nos pasa el padre (value) si existe,
		// si no, con lo último confirmado internamente (selected_items).
		const base = value?.length ? rebuildMapFromArray(value) : new SvelteMap(selected_items);
		pending_selection = base;
		navStack = computeNavStackForSelection(base);

		open = true;

		if (debug) {
			const k = firstKey(base);
			log('OPEN', {
				valueIn: value,
				pendingKeys: [...base.keys()],
				selectedKey: k,
				path: k ? getPathValues(keyOf(k)) : [],
				navStack,
				flatTotal: flatOptions.length,
				byValueSize: byValue.size
			});
		}
	}

	function commitSelection(next: SvelteMap<string, Option>) {
		const arr = [...next.values()];

		// 1) actualiza el bind interno (si el padre usa bind, perfecto)
		value = arr;

		// 2) guarda interno
		selected_items = new SvelteMap(next);

		// 3) callback para padre “controlado” (tu caso real)
		onValueChange?.(arr);
	}

	function confirmSelection() {
		commitSelection(pending_selection);
		open = false;
		onConfirm?.([...pending_selection.values()]);
	}

	function cancelSelection() {
		pending_selection = new SvelteMap(selected_items);
		open = false;
		onCancel?.();
	}

	function removeSelected(v: string) {
		const k = keyOf(v);
		const next = new SvelteMap(selected_items);
		next.delete(k);

		selected_items = next;
		value = [...selected_items.values()];
		onValueChange?.([...selected_items.values()]);
	}

	function enterItem(opt: Option) {
		navStack = [...navStack, keyOf(opt.value)];
	}

	function goBack() {
		navStack = navStack.slice(0, -1);
	}

	const currentLevelOptions = $derived.by(() => {
		if (!tree) return (options ?? []).map(canonical);

		const currentParent = navStack.length ? navStack[navStack.length - 1] : null;

		if (!currentParent) {
			return flatOptions
				.filter((o) => (parentByValue.get(keyOf(o.value)) ?? null) === null)
				.map(canonical);
		}

		const childValues = childrenByValue.get(currentParent) ?? [];
		return childValues
			.map((v) => byValue.get(v))
			.filter(Boolean)
			.map(canonical) as Option[];
	});

	const filtered_options = $derived.by(() => {
		if (tree && search) {
			const term = search.toLowerCase();
			return flatOptions.map(canonical).filter((opt) => {
				const labelHit = opt.label.toLowerCase().includes(term);
				const descHit = (opt.description ?? '').toLowerCase().includes(term);
				const pathHit = showPathInSearch
					? getPathLabel(keyOf(opt.value)).toLowerCase().includes(term)
					: false;
				return labelHit || descHit || pathHit;
			});
		}

		if (tree && !search) return currentLevelOptions;

		if (!search) return (options ?? []).map(canonical);
		const term = search.toLowerCase();
		return (options ?? []).map(canonical).filter((opt) => opt.label.toLowerCase().includes(term));
	});

	const single_selected: Option | undefined = $derived.by(() => {
		if (!selected_items.size) return;
		return selected_items.values().next().value;
	});

	const footerMessage = $derived.by(() => {
		if (multiple) {
			if (pending_selection.size === 0) return 'No hay elementos seleccionados.';
			if (pending_selection.size === 1) return '1 elemento seleccionado.';
			return `${pending_selection.size} elementos seleccionados.`;
		} else {
			if (single_selected) return `Seleccionado: ${single_selected.label}`;
			return '';
		}
	});

	function canSelect(opt: Option) {
		if (!tree) return true;
		const has = hasChildren(opt);
		if (has && !selectParents) return false;
		return true;
	}

	function toggleItem(optRaw: Option) {
		const opt = canonical(optRaw);
		const k = keyOf(opt.value);

		const selectable = canSelect(opt);
		const optHasChildren = tree && hasChildren(opt);

		if (!selectable) {
			if (tree && !search && optHasChildren) enterItem(opt);
			return;
		}

		// single
		if (!multiple) {
			const next = new SvelteMap<string, Option>([[k, opt]]);
			pending_selection = next;

			// abrir dentro si tiene hijos
			navStack = computeNavStackForSelection(next);

			// opcional: commit inmediato
			if (closeOnPick) {
				commitSelection(next);
				open = false;
				onConfirm?.([...next.values()]);
			}

			return;
		}

		// multi
		const next = new SvelteMap(pending_selection);
		if (next.has(k)) next.delete(k);
		else next.set(k, opt);
		pending_selection = next;
	}

	function renderLabelLine(opt: Option) {
		return opt.label;
	}
</script>

<div class={['flex w-full flex-col gap-2', props.parentClass].join(' ')}>
	<Field {name} {label} {errors} {required}>
		<button
			type="button"
			onclick={openDialog}
			class="flex h-11 w-full items-center gap-2 rounded-2xl border border-neutral-200/70 bg-neutral-50/80 px-3.5 text-left text-sm text-neutral-800 shadow-xs transition-all hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none dark:border-neutral-700/70 dark:bg-neutral-900/70 dark:text-neutral-100 dark:hover:border-neutral-500 dark:hover:bg-neutral-900"
		>
			<BoxSelect class="h-4 w-4 text-neutral-400 dark:text-neutral-500" />

			<span class="truncate text-[13px] text-neutral-600 dark:text-neutral-300">
				{#if multiple}
					{#if selected_items.size > 0}
						{selected_items.size === 1
							? Array.from(selected_items.values())[0].label
							: `${selected_items.size} seleccionados`}
					{:else}
						{placeholder}
					{/if}
				{:else if selected_items.size > 0}
					{single_selected?.label ?? placeholder}
				{:else}
					{placeholder}
				{/if}
			</span>

			{#if multiple && selected_items.size > 0}
				<span
					class="ml-1 rounded-full bg-neutral-200/80 px-2 py-[2px] text-[11px] text-neutral-700 tabular-nums dark:bg-neutral-800/90 dark:text-neutral-200"
				>
					{selected_items.size}
				</span>
			{/if}

			<ChevronDown
				class={[
					'ml-auto h-4 w-4 text-neutral-400 transition-transform dark:text-neutral-500',
					open ? 'rotate-180' : ''
				].join(' ')}
			/>
		</button>
	</Field>

	{#if multiple}
		<div class="flex flex-wrap gap-1.5">
			{#each Array.from(selected_items.values()) as sel, index (sel.value)}
				<input type="hidden" name="{name}[{index}]" value={sel.value} />
				<Tag
					onclose={() => removeSelected(sel.value)}
					variant="solid"
					color="indigo"
					class="rounded-full bg-indigo-500/10 text-[11px] text-indigo-700 ring-1 ring-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200"
				>
					{sel.label}
				</Tag>
			{/each}
		</div>
	{:else}
		<input type="hidden" {name} value={single_selected?.value ?? ''} />
	{/if}
</div>

<Dialog {open} onclose={cancelSelection}>
	<DialogHeader>
		<DialogTitle>{label}</DialogTitle>
		{#if placeholder}
			<DialogDescription>{placeholder}</DialogDescription>
		{/if}

		<div class="mt-4 space-y-2">
			<div class="relative">
				<Input
					type="search"
					class="w-full pl-8"
					placeholder="Buscar..."
					name="search"
					autofocus
					value={search}
					oninput={(e) => (search = e.currentTarget.value)}
				/>
				<div class="top absolute top-0 bottom-0 left-2 flex items-center justify-center">
					<Search class="h-4 w-4 text-neutral-400" />
				</div>
			</div>

			{#if tree && !search}
				<div
					class="flex items-center justify-between gap-2 text-[11px] text-neutral-500 dark:text-neutral-400"
				>
					<div class="flex min-w-0 items-center gap-2">
						{#if navStack.length > 0}
							<button
								type="button"
								class="inline-flex items-center gap-1 rounded-full px-2 py-[2px] hover:bg-neutral-100 dark:hover:bg-neutral-800"
								onclick={goBack}
							>
								<ChevronLeft class="h-3.5 w-3.5" />
								Atrás
							</button>
						{/if}

						<span class="truncate">
							{#if navStack.length === 0}
								Raíz
							{:else}
								{getPathLabel(navStack[navStack.length - 1])}
							{/if}
						</span>
					</div>

					{#if multiple}
						<span>
							Seleccionados:
							<span class="ml-1 font-semibold text-neutral-700 dark:text-neutral-200"
								>{pending_selection.size}</span
							>
							<span class="ml-1 text-neutral-400"
								>/ {tree ? flatOptions.length : options.length}</span
							>
						</span>
					{/if}
				</div>
			{/if}
		</div>
	</DialogHeader>

	<DialogContent class="max-h-[70dvh] gap-1 py-2">
		{#each filtered_options as opt (opt.value)}
			{@const k = keyOf(opt.value)}
			{@const optHasChildren = tree && hasChildren(opt)}
			{@const selected = pendingKeys.has(k)}
			{@const selectable = canSelect(opt)}

			{#if multiple}
				<label class="block">
					<div
						class={[
							'group flex w-full items-start gap-3 rounded-2xl border px-3.5 py-2.5 text-sm transition-all',
							selected
								? 'border-indigo-500/70 bg-indigo-500/8 shadow-sm shadow-indigo-500/20 dark:border-indigo-400/70 dark:bg-indigo-500/10'
								: 'border-transparent bg-neutral-100/80 hover:bg-neutral-200/80 dark:bg-neutral-900/70 dark:hover:bg-neutral-800',
							!selectable ? 'opacity-75' : ''
						].join(' ')}
					>
						<Checkbox
							class="mt-0.5"
							value={k}
							label=""
							checked={selected}
							onchange={() => toggleItem(opt)}
						/>

						<div class="flex min-w-0 flex-1 flex-col">
							{#if item}
								{@render item(opt)}
							{:else}
								<span
									class="truncate text-[13px] font-medium text-neutral-800 dark:text-neutral-100"
								>
									{renderLabelLine(opt)}
								</span>

								{#if opt.description}
									<span
										class="truncate text-[11px] text-neutral-500 group-hover:text-neutral-600 dark:text-neutral-400 dark:group-hover:text-neutral-300"
									>
										{opt.description}
									</span>
								{/if}

								{#if tree && search && showPathInSearch}
									<span class="mt-0.5 truncate text-[11px] text-neutral-400">{getPathLabel(k)}</span
									>
								{/if}

								{#if tree && !search && optHasChildren}
									<span class="mt-0.5 truncate text-[11px] text-neutral-400"
										>{getChildren(opt).length} subcategorías</span
									>
								{/if}
							{/if}
						</div>

						{#if tree && optHasChildren && !search}
							<button
								type="button"
								class="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px] text-neutral-500 hover:bg-neutral-200/70 dark:text-neutral-300 dark:hover:bg-neutral-800"
								onclick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									enterItem(opt);
								}}
							>
								<ChevronDown class="h-3.5 w-3.5 -rotate-90" />
								Ver
							</button>
						{/if}
					</div>
				</label>
			{:else}
				<button
					type="button"
					onclick={() => toggleItem(opt)}
					class={[
						'flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm transition-all',
						selected
							? 'border-indigo-500/70 bg-indigo-500/8 shadow-sm shadow-indigo-500/20 dark:border-indigo-400/70 dark:bg-indigo-500/10'
							: 'border-transparent bg-neutral-100/80 hover:bg-neutral-200/80 dark:bg-neutral-900/70 dark:hover:bg-neutral-800',
						!selectable ? 'opacity-75' : ''
					].join(' ')}
				>
					<div
						class={[
							'flex h-7 w-7 items-center justify-center rounded-full border text-neutral-500 transition-all',
							selected
								? 'border-transparent bg-linear-to-tr from-indigo-500 via-violet-500 to-blue-500 text-white shadow-sm shadow-indigo-500/40'
								: 'border-neutral-300 bg-white/90 dark:border-neutral-600 dark:bg-neutral-900/90'
						].join(' ')}
					>
						{#if selected}
							<Check class="h-3.5 w-3.5" />
						{:else}
							<Plus class="h-3.5 w-3.5" />
						{/if}
					</div>

					<div class="flex min-w-0 flex-1 flex-col text-left">
						{#if item}
							{@render item(opt)}
						{:else}
							<span class="truncate text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
								{renderLabelLine(opt)}
							</span>

							{#if opt.description}
								<span class="truncate text-[11px] text-neutral-500 dark:text-neutral-400"
									>{opt.description}</span
								>
							{/if}

							{#if tree && search && showPathInSearch}
								<span class="mt-0.5 truncate text-[11px] text-neutral-400">{getPathLabel(k)}</span>
							{/if}

							{#if tree && !search && optHasChildren}
								<span class="mt-0.5 truncate text-[11px] text-neutral-400"
									>{getChildren(opt).length} subcategorías</span
								>
							{/if}
						{/if}
					</div>

					{#if selected}
						<div
							class="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-2.5 py-[3px] text-[10px] font-medium text-neutral-50 shadow-sm shadow-black/40 dark:bg-neutral-50/95 dark:text-neutral-900"
						>
							<Check class="h-3 w-3" />
							<span>Seleccionado</span>
						</div>
					{/if}

					{#if tree && optHasChildren && !search}
						<button
							type="button"
							class="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px] text-neutral-500 hover:bg-neutral-200/70 dark:text-neutral-300 dark:hover:bg-neutral-800"
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								enterItem(opt);
							}}
						>
							<ChevronDown class="h-3.5 w-3.5 -rotate-90" />
							Ver
						</button>
					{/if}
				</button>
			{/if}
		{:else}
			<NoContent
				icon={Search}
				title="No se encontraron resultados"
				subtitle="Prueba con otros términos o limpia el buscador."
			/>
		{/each}
	</DialogContent>

	<DialogFooter class="flex items-center justify-between gap-2">
		{#if footerMessage}
			<div class="text-[11px] text-neutral-500 dark:text-neutral-400">{footerMessage}</div>
		{/if}

		<div class="ml-auto flex gap-2">
			<Button variant="secondary" onclick={cancelSelection}>
				<X class="h-4 w-4" />
				{i18n.t('common.cancel')}
			</Button>
			<Button variant="primary" onclick={confirmSelection}>
				<Save class="h-4 w-4" />
				{i18n.t('common.confirm')}
				{#if multiple}
					<span class="ml-1 text-[11px] tabular-nums">({pending_selection.size})</span>
				{/if}
			</Button>
		</div>
	</DialogFooter>
</Dialog>
