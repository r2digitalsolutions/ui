<script lang="ts">
	import Button from '$lib/components/ui/Button/Button.svelte';
	import type { Snippet } from 'svelte';
	import type { StepDef } from './core/types.js';

	type StepState = 'pending' | 'active' | 'done';
	type Mode = 'create' | 'edit';
	type ForwardTabBehavior = 'blocked' | 'validate' | 'free';

	type FooterApi = {
		current: number;
		total: number;
		next: () => Promise<void>;
		prev: () => Promise<void>;
		goTo: (idx: number) => Promise<void>;
	};

	type Props = {
		steps: StepDef[];
		current?: number;
		onChange?: (idx: number) => void;
		canGoNext?: (idx: number) => Promise<boolean> | boolean;
		canGoPrev?: (idx: number) => Promise<boolean> | boolean;

		mode?: Mode;
		forwardTabBehavior?: ForwardTabBehavior; // NUEVO
		stickyFooter?: boolean;
		showHeader?: boolean;
		showProgressBar?: boolean;
		showConnectors?: boolean;
		footer?: Snippet<[FooterApi]>;
	};

	let {
		steps,
		current = $bindable(1),
		onChange,
		canGoNext,
		canGoPrev,
		mode = 'create',
		forwardTabBehavior = 'blocked',
		stickyFooter = true,
		showHeader = true,
		showProgressBar = true,
		showConnectors = true,
		footer
	}: Props = $props();

	const total = $derived(steps.length);
	const pct = $derived(Math.max(0, Math.min(100, (current / total) * 100)));

	let maxReached = $state(current);

	// Si avanzamos, actualizamos maxReached
	$effect(() => {
		if (current > maxReached) maxReached = current;
	});

	// Ajustar si la cantidad de pasos cambia
	$effect(() => {
		if (maxReached > steps.length) maxReached = steps.length;
		if (current > steps.length) current = steps.length;
	});

	function stepState(i: number): StepState {
		const idx = i + 1;
		if (idx < current) return 'done';
		if (idx === current) return 'active';
		return 'pending';
	}

	function canJumpTo(idx: number) {
		if (steps[idx - 1]?.disabled) return false;
		if (mode === 'edit') return true;

		if (idx <= maxReached) return true;

		if (forwardTabBehavior === 'free') return true;
		if (forwardTabBehavior === 'validate') return idx === current + 1;
		return false;
	}

	async function goTo(idx: number) {
		if (idx < 1 || idx > total) return;

		if (!canJumpTo(idx)) return;

		const goingForward = idx > current;
		if (mode !== 'edit' && goingForward && forwardTabBehavior === 'validate') {
			const ok = canGoNext ? await canGoNext(current) : true;
			if (!ok) return;
		}

		current = idx;
		if (current > maxReached) maxReached = current;
		onChange?.(idx);
	}

	async function next() {
		if (current >= total) return;

		if (canGoNext) {
			const ok = await canGoNext(current);
			if (!ok) return;
		}

		const target = current + 1;
		current = target;
		if (current > maxReached) maxReached = current;
		onChange?.(target);
	}

	async function prev() {
		if (current <= 1) return;
		if (canGoPrev) {
			const ok = await canGoPrev(current);
			if (!ok) return;
		}
		await goTo(current - 1);
	}

	function onHeaderKeydown(e: KeyboardEvent) {
		const { key } = e;
		if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
		e.preventDefault();
		if (key === 'ArrowLeft') prev();
		else next();
	}
</script>

<div class="w-full">
	{#if showHeader}
		<div class="mb-5">
			<div
				class="flex flex-wrap items-center justify-start gap-2"
				role="tablist"
				tabindex="0"
				aria-label="Progreso del formulario"
				onkeydown={onHeaderKeydown}
			>
				{#each steps as s, i (s.id)}
					{@const state = stepState(i)}
					{@const idx = i + 1}
					{@const allowed = canJumpTo(idx)}

					<button
						type="button"
						class={[
							'group relative inline-flex items-center gap-3 rounded-xl border px-3 py-2 transition',
							state === 'active'
								? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
								: state === 'done'
									? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
									: 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
							allowed ? 'cursor-pointer' : 'pointer-events-none cursor-not-allowed opacity-60'
						].join(' ')}
						aria-current={state === 'active' ? 'step' : undefined}
						aria-disabled={allowed ? 'false' : 'true'}
						tabindex={allowed ? 0 : -1}
						title={allowed ? (s.tooltip ?? s.label) : 'Completa el paso anterior'}
						onclick={() => allowed && goTo(idx)}
					>
						<div
							class={[
								'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
								state === 'active'
									? 'border-purple-600 bg-white text-purple-700'
									: state === 'done'
										? 'border-emerald-500 bg-white text-emerald-700'
										: 'border-gray-300 bg-white text-gray-600'
							].join(' ')}
						>
							{#if state === 'done'}
								<svg viewBox="0 0 20 20" class="h-4 w-4" aria-hidden="true">
									<path d="M7.5 11.5l-2-2 -1 1 3 3 7-7 -1-1 -6 6z" />
								</svg>
							{:else}
								{idx}
							{/if}
						</div>

						<!-- Texto -->
						<div class="min-w-0 text-left">
							<div class="truncate text-sm font-medium">{s.label}</div>
							{#if state === 'active'}
								<div class="truncate text-xs text-purple-700/70">En curso</div>
							{:else if state === 'done'}
								<div class="truncate text-xs text-emerald-700/70">Completado</div>
							{:else}
								<div class="truncate text-xs text-gray-500">Pendiente</div>
							{/if}
						</div>
					</button>

					{#if showConnectors && i < steps.length - 1}
						<div class="h-px w-6 bg-gradient-to-r from-gray-300 to-gray-200 sm:w-8"></div>
					{/if}
				{/each}
			</div>

			{#if showProgressBar}
				<div class="mt-3 h-1.5 w-full rounded-full bg-gray-200">
					<div
						class="h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
						style:width={`${pct}%`}
					></div>
				</div>
			{/if}
		</div>
	{/if}

	<div class="relative">
		{#each steps as s, i (s.id)}
			<section
				class="animate-[fadeIn_160ms_ease-out] data-[active=false]:hidden"
				data-active={current === i + 1}
				aria-hidden={current === i + 1 ? 'false' : 'true'}
				inert={current === i + 1 ? undefined : true}
			>
				{@render s.content()}
			</section>
		{/each}
	</div>

	<div
		class={stickyFooter
			? 'sticky right-0 bottom-0 left-0 bg-gradient-to-t from-white via-white to-transparent pt-4'
			: 'mt-6'}
	>
		<div class="flex w-full gap-3 border-t border-gray-200 pt-4">
			{#if footer}
				{@render footer({ current, total, next, prev, goTo })}
			{:else}
				<Button type="button" onclick={prev} disabled={current === 1}>Anterior</Button>
				<Button type="button" onclick={next} disabled={current === total}>Siguiente</Button>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(2px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
