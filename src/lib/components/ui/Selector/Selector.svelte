<script lang="ts" generics="M extends string">
	interface ModeOption<M extends string> {
		id: M;
		label: string;
		icon?: any;
		disabled?: boolean;
		tooltip?: string;
	}

	interface Props<M extends string> {
		modes: ModeOption<M>[];
		currentMode: M; // bindable
		onModeChange?: (m: M) => void;
		activation?: 'auto' | 'manual';
	}

	let {
		modes,
		currentMode = $bindable<M>(),
		onModeChange,
		activation = 'auto'
	}: Props<M> = $props();

	const buttons = new Map<M, HTMLButtonElement>();

	function focusActive() {
		const el = buttons.get(currentMode);
		queueMicrotask(() => el?.focus());
	}

	function change(m: M) {
		if (m === currentMode) return;
		currentMode = m;
		onModeChange?.(m);
		focusActive();
	}

	function onKeydown(e: KeyboardEvent) {
		const horiz = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
		const vert = e.key === 'ArrowUp' || e.key === 'ArrowDown';
		const home = e.key === 'Home';
		const end = e.key === 'End';

		if (!horiz && !vert && !home && !end) return;

		e.preventDefault();
		const enabled = modes.filter((m) => !m.disabled);
		if (enabled.length === 0) return;

		const curIdx = enabled.findIndex((m) => m.id === currentMode);
		const idx = curIdx === -1 ? 0 : curIdx;

		if (home) return change(enabled[0].id);
		if (end) return change(enabled[enabled.length - 1].id);

		const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
		const nextIndex = (idx + dir + enabled.length) % enabled.length;
		change(enabled[nextIndex].id);
	}
</script>

<div
	class="flex rounded-lg bg-gray-100 p-1"
	role="tablist"
	aria-label="Seleccionar vista"
	aria-orientation="horizontal"
	onkeydown={onKeydown}
	tabindex="0"
>
	{#each modes as m (m.id)}
		<button
			bind:this={
				() => buttons.get(m.id),
				(el) => {
					if (el) buttons.set(m.id, el);
				}
			}
			type="button"
			role="tab"
			aria-selected={currentMode === m.id}
			aria-controls={undefined}
			disabled={m.disabled}
			tabindex={currentMode === m.id ? 0 : -1}
			onfocus={() => {
				if (activation === 'auto' && !m.disabled && currentMode !== m.id) {
					change(m.id);
				}
			}}
			onclick={() => !m.disabled && change(m.id)}
			class={`flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-all
        ${currentMode === m.id ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
        ${m.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1`}
			title={m.tooltip ?? m.label}
		>
			{#if m.icon}
				<m.icon class="h-4 w-4" />
			{/if}
			<span class="hidden sm:inline">{m.label}</span>
		</button>
	{/each}
</div>
