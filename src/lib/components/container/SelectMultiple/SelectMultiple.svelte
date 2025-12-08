<script lang="ts">
	import type { Option, Props } from './type.js';
	import { BoxSelect, Check, ChevronDown, Save, Search, X, Plus } from 'lucide-svelte';
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
		required,
		errors = [],
		...props
	}: Props = $props();

	let open = $state(false);
	let search = $state('');

	let selected_items = $state(new SvelteMap<string, Option>());
	let pending_selection = $state(new SvelteMap<string, Option>());

	$effect(() => {
		selected_items = new SvelteMap((value ?? []).map((v) => [v.value, v] as [string, Option]));
	});

	function openDialog() {
		pending_selection = new SvelteMap(selected_items);
		search = '';
		open = true;
	}

	function toggleItem(item: Option) {
		if (!multiple) {
			pending_selection = new SvelteMap([[item.value, item]]);
			confirmSelection();
			return;
		}

		const next = new SvelteMap(pending_selection);

		if (next.has(item.value)) {
			next.delete(item.value);
		} else {
			next.set(item.value, item);
		}

		pending_selection = next;
	}

	function confirmSelection() {
		value = [...pending_selection.values()];
		selected_items = new SvelteMap(pending_selection);
		open = false;
		onConfirm?.(value);
	}

	function cancelSelection() {
		pending_selection = new SvelteMap(selected_items);
		open = false;
		onCancel?.();
	}

	function removeSelected(v: string) {
		const next = new SvelteMap(selected_items);
		next.delete(v);
		selected_items = next;
		value = [...selected_items.values()];
	}

	const filtered_options = $derived.by(() => {
		if (!search) return options;
		const term = search.toLowerCase();
		return options.filter((option) => option.label.toLowerCase().includes(term));
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
			{#each Array.from(selected_items.values()) as item, index (item.value)}
				<input type="hidden" name="{name}[{index}]" value={item.value} />
				<Tag
					onclose={() => removeSelected(item.value)}
					variant="solid"
					color="indigo"
					class="rounded-full bg-indigo-500/10 text-[11px] text-indigo-700 ring-1 ring-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200"
				>
					{item.label}
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
			{#if multiple}
				<div
					class="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400"
				>
					<span>
						Seleccionados:
						<span class="ml-1 font-semibold text-neutral-700 dark:text-neutral-200">
							{pending_selection.size}
						</span>
						{#if options.length}
							<span class="ml-1 text-neutral-400">/ {options.length}</span>
						{/if}
					</span>
					{#if pending_selection.size > 0}
						<button
							type="button"
							class="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px] text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
							onclick={() => (pending_selection = new SvelteMap())}
						>
							<X class="h-3 w-3" />
							Limpiar
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</DialogHeader>

	<DialogContent class="max-h-[70dvh] gap-1 py-2">
		{#each filtered_options as item (item.value)}
			{#if multiple}
				<label class="flex flex-row gap-1">
					<Checkbox
						class={[
							'group flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm transition-all',
							pending_selection.has(item.value)
								? 'border-indigo-500/70 bg-indigo-500/8 shadow-sm shadow-indigo-500/20 dark:border-indigo-400/70 dark:bg-indigo-500/10'
								: 'border-transparent bg-neutral-100/80 hover:bg-neutral-200/80 dark:bg-neutral-900/70 dark:hover:bg-neutral-800'
						]}
						value={item.value}
						label={item.label}
						checked={pending_selection.has(item.value)}
						onchange={() => toggleItem(item)}
					/>
					<div class="flex flex-col">
						<span>{item.label}</span>
						{#if item.description}
							<span
								class="block text-[11px] text-neutral-500 group-hover:text-neutral-600 dark:text-neutral-400 dark:group-hover:text-neutral-300"
							>
								{item.description}
							</span>
						{/if}
					</div>
				</label>
			{:else}
				<button
					type="button"
					onclick={() => toggleItem(item)}
					class={[
						'flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm transition-all',
						pending_selection.has(item.value)
							? 'border-indigo-500/70 bg-indigo-500/8 shadow-sm shadow-indigo-500/20 dark:border-indigo-400/70 dark:bg-indigo-500/10'
							: 'border-transparent bg-neutral-100/80 hover:bg-neutral-200/80 dark:bg-neutral-900/70 dark:hover:bg-neutral-800'
					].join(' ')}
				>
					<!-- icono left -->
					<div
						class={[
							'flex h-7 w-7 items-center justify-center rounded-full border text-neutral-500 transition-all',
							pending_selection.has(item.value)
								? 'border-transparent bg-linear-to-tr from-indigo-500 via-violet-500 to-blue-500 text-white shadow-sm shadow-indigo-500/40'
								: 'border-neutral-300 bg-white/90 dark:border-neutral-600 dark:bg-neutral-900/90'
						].join(' ')}
					>
						{#if pending_selection.has(item.value)}
							<Check class="h-3.5 w-3.5" />
						{:else}
							<Plus class="h-3.5 w-3.5" />
						{/if}
					</div>

					<div class="flex flex-1 flex-col text-left">
						<span class="text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
							{item.label}
						</span>
						{#if item.description}
							<span class="text-[11px] text-neutral-500 dark:text-neutral-400">
								{item.description}
							</span>
						{/if}
					</div>

					{#if pending_selection.has(item.value)}
						<div
							class="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-2.5 py-[3px] text-[10px] font-medium text-neutral-50 shadow-sm shadow-black/40 dark:bg-neutral-50/95 dark:text-neutral-900"
						>
							<Check class="h-3 w-3" />
							<span>Seleccionado</span>
						</div>
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
			<div class="text-[11px] text-neutral-500 dark:text-neutral-400">
				{footerMessage}
			</div>
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
					<span class="ml-1 text-[11px] tabular-nums">
						({pending_selection.size})
					</span>
				{/if}
			</Button>
		</div>
	</DialogFooter>
</Dialog>
