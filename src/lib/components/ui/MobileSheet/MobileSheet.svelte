<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';

	type SheetContext = { close: (reason?: string) => void };

	type Props = {
		open: boolean;
		onOpenChange?: (open: boolean) => void;

		header?: Snippet<[SheetContext]>;
		content?: Snippet<[SheetContext]>;
		footer?: Snippet<[SheetContext]>;

		snapPoints?: number[];
		initialSnap?: number;

		closeOnOverlay?: boolean;
		closeOnEscape?: boolean;

		maxHeight?: string;

		overlayClass?: string;
		panelClass?: string;

		/** Evita que el sheet se cierre arrastrando hacia abajo (sólo cambia de snap) */
		disableDragClose?: boolean;

		/** Hace scroll-lock del body mientras el sheet está abierto (por defecto true) */
		lockScroll?: boolean;

		/** Callback cuando cambia el snap */
		onSnapChange?: (snap: { index: number; height: number }) => void;
	};

	const props: Props = $props();

	// --- Snap inicial: índice del snapPoint más pequeño, o initialSnap si es válido ---
	let snapIndex = 0;
	if (props.snapPoints && props.snapPoints.length) {
		let min = props.snapPoints[0];
		let minIndex = 0;
		for (let i = 1; i < props.snapPoints.length; i++) {
			if (props.snapPoints[i] < min) {
				min = props.snapPoints[i];
				minIndex = i;
			}
		}
		if (
			typeof props.initialSnap === 'number' &&
			props.initialSnap >= 0 &&
			props.initialSnap < props.snapPoints.length
		) {
			snapIndex = props.initialSnap;
		} else {
			snapIndex = minIndex;
		}
	}

	// --- Estado drag / altura ---

	let dragHeight = $state<number | null>(null);
	let isDragging = $state(false);
	let dragStartY = 0;
	let dragStartHeight = 0;
	let dragDelta = $state(0);

	const snapPoints = $derived(props.snapPoints ?? [0.4, 0.9]); // por defecto compacto
	const minSnap = $derived(Math.min(...snapPoints));
	const maxSnap = $derived(Math.max(...snapPoints));

	function baseHeight() {
		return snapPoints[snapIndex] ?? snapPoints[0] ?? 0.4;
	}

	const currentHeight = $derived(dragHeight ?? baseHeight());
	const handleStretch = $derived(Math.min(Math.abs(dragDelta) / 160, 0.45));
	const handleOffset = $derived(Math.max(Math.min(dragDelta / 12, 10), -6));

	let isOpening = $state(false);

	// Animación elástica al abrir
	$effect(() => {
		if (!props.open || typeof window === 'undefined') {
			isOpening = false;
			return;
		}

		isOpening = true;
		const timer = setTimeout(() => {
			isOpening = false;
		}, 260);

		return () => clearTimeout(timer);
	});

	// Scroll-lock del body mientras está abierto
	$effect(() => {
		if (typeof document === 'undefined') return;

		if (props.open && props.lockScroll !== false) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = 'hidden';

			return () => {
				document.body.style.overflow = prev;
			};
		}
	});

	function setOpen(next: boolean, _reason?: string) {
		props.onOpenChange?.(next);
		if (!next) {
			dragHeight = null;
			dragDelta = 0;
		}
	}

	function close(reason?: string) {
		if (!props.open) return;
		setOpen(false, reason);
	}

	const sheetContext: SheetContext = {
		close
	};

	function handleOverlayClick() {
		if (props.closeOnOverlay === false) return;
		close('overlay');
	}

	// Escape global
	$effect(() => {
		if (!props.open || props.closeOnEscape === false || typeof window === 'undefined') return;

		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				e.stopPropagation();
				close('escape');
			}
		}

		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function startDrag(e: PointerEvent) {
		if (!props.open || typeof window === 'undefined') return;
		isDragging = true;
		dragStartY = e.clientY;
		dragStartHeight = baseHeight();
		dragDelta = 0;

		window.addEventListener('pointermove', handleWindowPointerMove);
		window.addEventListener('pointerup', handleWindowPointerUp);
		window.addEventListener('pointercancel', handleWindowPointerUp);
	}

	function onHandlePointerDown(e: PointerEvent) {
		// Evita selección de texto y gesto accidental
		e.preventDefault();
		startDrag(e);
	}

	function handleWindowPointerMove(e: PointerEvent) {
		if (!isDragging || !props.open) return;

		const deltaY = e.clientY - dragStartY;
		dragDelta = deltaY;

		const vh = window.innerHeight || 1;
		let next = dragStartHeight - deltaY / vh; // arriba => más alto

		// “Esponja” debajo del mínimo
		if (next < minSnap) {
			const overshoot = minSnap - next;
			next = minSnap - overshoot * 0.25;
		}

		// “Esponja” por encima del máximo
		if (next > maxSnap) {
			const overshoot = next - maxSnap;
			next = maxSnap + overshoot * 0.25;
		}

		dragHeight = next;
	}

	function handleWindowPointerUp(e: PointerEvent) {
		if (!isDragging) return;
		isDragging = false;

		if (typeof window !== 'undefined') {
			window.removeEventListener('pointermove', handleWindowPointerMove);
			window.removeEventListener('pointerup', handleWindowPointerUp);
			window.removeEventListener('pointercancel', handleWindowPointerUp);
		}

		const vh = typeof window !== 'undefined' ? window.innerHeight || 1 : 1;
		const deltaY = e.clientY - dragStartY;
		const final = dragHeight ?? baseHeight();
		dragHeight = null;
		dragDelta = 0;

		const pulledDownHard = deltaY > vh * 0.18;
		const allowDragClose = props.disableDragClose !== true;

		if (allowDragClose && (pulledDownHard || final < minSnap * 0.7)) {
			close('drag-down');
			return;
		}

		// Snap al punto más cercano
		let targetIndex = 0;
		let bestDist = Number.POSITIVE_INFINITY;

		snapPoints.forEach((p, i) => {
			const d = Math.abs(p - final);
			if (d < bestDist) {
				bestDist = d;
				targetIndex = i;
			}
		});

		snapIndex = targetIndex;
		props.onSnapChange?.({ index: targetIndex, height: snapPoints[targetIndex] });
	}
</script>

{#if props.open}
	<div class="fixed inset-0 z-99 flex flex-col md:hidden">
		<!-- Overlay -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			in:fade={{ duration: 150 }}
			out:fade={{ duration: 120 }}
			class={['flex-1 bg-neutral-950/70 backdrop-blur-sm', props.overlayClass ?? '']}
			onclick={handleOverlayClick}
		></div>

		<!-- Panel -->
		<div
			role="dialog"
			aria-modal="true"
			in:slide={{ duration: 220, easing: cubicOut }}
			out:slide={{ duration: 190, easing: cubicIn }}
			class={[
				'relative w-full overflow-hidden rounded-t-3xl border-t border-neutral-800/70 bg-neutral-950/95 text-neutral-50 shadow-[0_-18px_45px_rgba(0,0,0,0.7)]',
				props.panelClass ?? ''
			]}
			style={`max-height:${props.maxHeight ?? '80vh'};height:${currentHeight * 100}vh;`}
		>
			<div class={['flex h-full flex-col', isOpening ? 'sheet-inner-opening' : '']}>
				<!-- Handle drag -->
				<div
					class="flex items-center justify-center pt-2 pb-1 select-none"
					style="touch-action:none;"
					onpointerdown={onHandlePointerDown}
				>
					<div
						class="h-1.5 w-10 rounded-full bg-neutral-700/80 transition-transform duration-150"
						style={`transform: translateY(${handleOffset}px) scaleX(${
							1 + handleStretch
						}); opacity:${0.9 - handleStretch * 0.3};`}
					></div>
				</div>

				<!-- Header opcional -->
				{#if props.header}
					<div class="px-4 pb-2">
						{@render props.header(sheetContext)}
					</div>
				{/if}

				<!-- Body -->
				<div class="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3">
					{#if props.content}
						<div class="min-h-0 flex-1 overflow-y-auto">
							{@render props.content(sheetContext)}
						</div>
					{/if}
				</div>

				<!-- Footer siempre abajo, con pequeño safe-area -->
				{#if props.footer}
					<div
						class="border-t border-neutral-800/70 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
					>
						{@render props.footer(sheetContext)}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes sheet-inner-elastic-in {
		0% {
			transform: scaleY(0.9);
		}
		60% {
			transform: scaleY(1.03);
		}
		100% {
			transform: scaleY(1);
		}
	}

	.sheet-inner-opening {
		transform-origin: bottom;
		animation: sheet-inner-elastic-in 260ms cubic-bezier(0.22, 1, 0.36, 1);
	}
</style>
