<script lang="ts">
	import type { ColumnDef } from '../core/types';

	interface Props {
		columns?: ColumnDef<any>[];
		visible?: string[];
		onToggle: (id: string, show: boolean) => void;
		buttonText?: string;
	}

	const { columns = [], visible = [], onToggle, buttonText = 'Columnas' }: Props = $props();

	let open = $state(false);
	let q = $state('');
	let anchor: HTMLButtonElement | null = $state(null);
	let pop: HTMLDivElement | null = $state(null);

	const sorted = $derived([...columns].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)));
	const filtered = $derived(
		q.trim() ? sorted.filter((c) => c.header.toLowerCase().includes(q.toLowerCase())) : sorted
	);

	function toggleAll(show: boolean) {
		for (const c of filtered) onToggle(c.id, show);
	}

	$effect(() => {
		function onDoc(e: MouseEvent) {
			if (!open) return;
			const t = e.target as Node;
			if (pop?.contains(t) || anchor?.contains(t)) return;
			open = false;
		}
		document.addEventListener('click', onDoc);
		return () => document.removeEventListener('click', onDoc);
	});
</script>

<div class="relative">
	<button
		bind:this={anchor}
		class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
		onclick={() => (open = !open)}
		aria-haspopup="listbox"
		aria-expanded={open}
	>
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			><rect x="3" y="4" width="18" height="4"></rect><rect x="3" y="10" width="18" height="4"
			></rect><rect x="3" y="16" width="18" height="4"></rect></svg
		>
		{buttonText}
		<span class="rounded bg-gray-100 px-1 text-[11px] dark:bg-gray-800"
			>{visible.length}/{columns.length}</span
		>
		<svg width="14" height="14" viewBox="0 0 24 24" class="opacity-60"
			><polyline
				points="6 9 12 15 18 9"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/></svg
		>
	</button>

	{#if open}
		<div
			bind:this={pop}
			class="absolute z-50 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-gray-800 dark:bg-gray-900"
			style={`right:0;`}
			role="listbox"
		>
			<div class="flex items-center gap-2 p-2">
				<input
					class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
					placeholder="Filtrar columnas…"
					bind:value={q}
				/>
			</div>
			<div class="flex items-center justify-between gap-2 px-2 pb-2">
				<button
					class="text-xs underline opacity-80 hover:opacity-100"
					onclick={() => toggleAll(true)}>Mostrar todas</button
				>
				<button
					class="text-xs underline opacity-80 hover:opacity-100"
					onclick={() => toggleAll(false)}>Ocultar todas</button
				>
			</div>
			<div
				class="max-h-64 overflow-auto rounded-xl border border-gray-200 p-1 dark:border-gray-800 dark:bg-gray-950"
			>
				{#each filtered as c (c.id)}
					<label
						class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
					>
						<input
							type="checkbox"
							checked={visible.includes(c.id)}
							onclick={(e) => onToggle(c.id, (e.target as HTMLInputElement).checked)}
						/>
						<span class="text-sm">{c.header}</span>
					</label>
				{/each}
				{#if filtered.length === 0}
					<div class="p-3 text-center text-xs opacity-60">Sin coincidencias</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
