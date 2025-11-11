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
		forwardTabBehavior?: ForwardTabBehavior;
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

	$effect(() => {
		if (current > maxReached) maxReached = current;
	});

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
							'group relative inline-flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all duration-150',
							state === 'active'
								? 'border-indigo-500/80 bg-white/95 text-neutral-900 shadow-sm shadow-indigo-500/20 dark:border-indigo-400/80 dark:bg-neutral-900/95 dark:text-neutral-50'
								: state === 'done'
									? 'border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
									: 'border-transparent bg-transparent text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/80',
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
								'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
								state === 'active'
									? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-300'
									: state === 'done'
										? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-300'
										: 'border-neutral-300 bg-white text-neutral-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400'
							].join(' ')}
						>
							{#if state === 'done'}
								<svg viewBox="0 0 20 20" class="h-4 w-4" aria-hidden="true">
									<path d="M7.5 11.5l-2-2 -1 1 3 3 7-7 -1-1 -6 6z" class="fill-current" />
								</svg>
							{:else}
								{idx}
							{/if}
						</div>

						<div class="min-w-0 text-left">
							<div class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
								{s.label}
							</div>
							{#if state === 'active'}
								<div class="truncate text-xs text-indigo-500 dark:text-indigo-300">En curso</div>
							{:else if state === 'done'}
								<div class="truncate text-xs text-emerald-600 dark:text-emerald-300">
									Completado
								</div>
							{:else}
								<div class="truncate text-xs text-neutral-500 dark:text-neutral-500">Pendiente</div>
							{/if}
						</div>
					</button>

					{#if showConnectors && i < steps.length - 1}
						<div
							class="hidden h-px w-6 rounded-full bg-neutral-200/80 sm:block sm:w-8 dark:bg-neutral-800/80"
						></div>
					{/if}
				{/each}
			</div>

			{#if showProgressBar}
				<div class="mt-3 h-1.5 w-full rounded-full bg-neutral-200/80 dark:bg-neutral-800/80">
					<div
						class="h-1.5 rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-blue-500 transition-all duration-300"
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
			? 'sticky right-0 bottom-0 left-0 bg-linear-to-t from-neutral-50 via-neutral-50/95 to-transparent pt-4 dark:from-neutral-950 dark:via-neutral-950/95 dark:to-transparent'
			: 'mt-6'}
	>
		<div class="flex w-full gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
			{#if footer}
				{@render footer({ current, total, next, prev, goTo })}
			{:else}
				<Button type="button" variant="outline" onclick={prev} disabled={current === 1}>
					Anterior
				</Button>
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
