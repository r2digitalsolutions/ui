<script lang="ts">
	import type { FilterDef } from '../core/types';

	interface Props {
		filters: FilterDef<any>[];
		onapply: (filters: FilterDef<any>[]) => void;
	}

	const { filters, onapply }: Props = $props();

	let text = $state('');

	function submit() {
		const base = filters.filter((f) => f.meta?.kind !== 'quick');
		const q: FilterDef<any> = {
			id: 'q',
			label: 'Búsqueda',
			op: 'contains',
			value: text,
			meta: { kind: 'quick', column: 'all' }
		};
		onapply([...base, q]);
	}
</script>

<div class="flex items-center gap-2">
	<input
		class="w-64 rounded-xl border px-3 py-2"
		placeholder="Buscar…"
		bind:value={text}
		onkeydown={(e) => e.key === 'Enter' && submit()}
	/>
	<button
		type="button"
		class="rounded-xl bg-black px-3 py-2 text-white dark:bg-white dark:text-black"
		onclick={submit}>Aplicar</button
	>
</div>
