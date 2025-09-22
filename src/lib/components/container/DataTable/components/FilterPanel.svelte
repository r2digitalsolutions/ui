<script lang="ts">
	import { Check, X } from 'lucide-svelte';
	import type { FilterField } from '../core/filters/types.js';
	import { buildFilterDefs } from '../core/filters/utils.js';
	import Input from '$lib/components/ui/Input/Input.svelte';
	import Checkbox from '$lib/components/ui/Checkbox/Checkbox.svelte';
	import Button from '$lib/components/ui/Button/Button.svelte';

	interface Props {
		fields: FilterField<any>[];
		values?: Record<string, any>;
		onapply?: (defs: any[], values: Record<string, any>) => void;
		onclear?: () => void;
	}

	const { fields, values = $bindable<Record<string, any>>({}), onapply, onclear }: Props = $props();

	let open = $state(false);

	const count = $derived(
		Object.values(values).reduce(
			(n, v) =>
				n +
				(v == null || v === ''
					? 0
					: Array.isArray(v)
						? v.length > 0
							? 1
							: 0
						: typeof v === 'object'
							? v.min != null || v.max != null
								? 1
								: 0
							: 1),
			0
		)
	);
	function setValue(id: string, v: any) {
		values[id] = v;
	}
	function toggleArray(id: string, v: any) {
		const arr = Array.isArray(values[id]) ? [...values[id]] : [];
		const i = arr.findIndex((x) => x === v);
		if (i >= 0) arr.splice(i, 1);
		else arr.push(v);
		values[id] = arr;
	}
	function apply() {
		const defs = buildFilterDefs(fields, values);
		onapply?.(defs, values);
		open = false;
	}
	function clear() {
		for (const k of Object.keys(values)) delete values[k];
		onclear?.();
	}
</script>

<div class="relative">
	<button
		class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
		onclick={() => (open = !open)}
	>
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"><polygon points="3 5 21 5 14 13 14 19 10 21 10 13 3 5" /></svg
		>
		Filtros
		{#if count > 0}
			<span class="rounded bg-purple-600 px-1 text-[11px] text-white">{count}</span>
		{/if}
	</button>
	{#if open}
		<div
			role="dialog"
			class="fixed inset-0 z-40"
			onclick={() => (open = false)}
			oncontextmenu={(e) => e.preventDefault()}
			aria-modal="true"
			tabindex="0"
		/>
		<div
			class="absolute z-50 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-black/5 dark:border-gray-800 dark:bg-gray-900"
		>
			<div class="mb-3 text-sm font-medium">Filtros</div>
			<div class="space-y-3">
				{#each fields as f}
					{#if f.type === 'text'}
						<label class="mb-1 block text-xs opacity-70">{f.label}</label>
						<Input
							type="text"
							placeholder={f.placeholder}
							value={values[f.id]}
							onchange={(e) => (values[f.id] = e)}
						/>
					{:else if f.type === 'number'}
						<label class="mb-1 block text-xs opacity-70">{f.label}</label>
						<Input
							type="number"
							min={f.min}
							max={f.max}
							step={f.step}
							value={values[f.id]}
							onchange={(e) => (values[f.id] = e)}
						/>
					{:else if f.type === 'date'}
						<label class="mb-1 block text-xs opacity-70">{f.label}</label>
						<Input type="date" value={values[f.id]} onchange={(e) => (values[f.id] = e)} />
					{:else if f.type === 'checkbox'}
						<Checkbox checked={values[f.id]} label={f.label} onchange={(e) => (values[f.id] = e)} />
					{:else if f.type === 'select'}
						<div>
							<label class="mb-1 block text-xs opacity-70">{f.label}</label>
							<select
								class="w-full rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-800"
								bind:value={values[f.id]}
							>
								<option value="">Todos</option>
								{#each f.options ?? [] as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
					{:else if f.type === 'multiselect'}
						<div>
							<label class="mb-1 block text-xs opacity-70">{f.label}</label>
							<div class="max-h-40 overflow-auto rounded-xl border p-2">
								{#each f.options ?? [] as opt}
									<Checkbox
										checked={(values[f.id] ?? []).includes(opt.value)}
										onchange={() => toggleArray(f.id, opt.value)}
										label={opt.label}
									/>
								{/each}
							</div>
						</div>
					{:else if f.type === 'range'}
						<div>
							<label class="mb-1 block text-xs opacity-70">{f.label}</label>
							<div class="grid grid-cols-2 gap-2">
								<Input
									type="number"
									placeholder="Min"
									min={f.min}
									max={f.max}
									step={f.step}
									value={values[f.id]?.min ?? 0}
									onchange={(e) => (values[f.id].min = e)}
								/>
								<Input
									type="number"
									placeholder="Max"
									min={f.min}
									max={f.max}
									step={f.step}
									value={values[f.id]?.max ?? 0}
									onchange={(e) => (values[f.id].max = e)}
								/>
							</div>
						</div>
					{:else if f.type === 'rating'}
						<div>
							<label class="mb-1 block text-xs opacity-70">{f.label}</label>
							<select class="w-full rounded-xl border px-3 py-2" bind:value={values[f.id]}>
								<option value="">Cualquiera</option>
								<option value="4">4+</option>
								<option value="3">3+</option>
								<option value="2">2+</option>
								<option value="1">1+</option>
							</select>
						</div>
					{/if}
				{/each}
			</div>
			<div class="mt-4 flex gap-2">
				<Button variant="outline" onclick={() => clear()}>
					<X class="h-4 w-4" />
					Limpiar
				</Button>
				<Button onclick={() => apply()}>
					<Check class="h-4 w-4" />
					Aplicar
				</Button>
			</div>
		</div>
	{/if}
</div>
