<script lang="ts">
	import { useDialogContext } from './context.svelte.js';
	import type { DialogPropsgHeaderProps } from './type.js';
	import { X } from 'lucide-svelte';

	let { children, ...props }: DialogPropsgHeaderProps = $props();
	const dialog = useDialogContext();

	const handleClose = () => {
		dialog.onclose?.();
	};

	const handleMinimize = () => {
		dialog.onRequestMinimize?.();
	};

	const handleMaximize = () => {
		dialog.onRequestMaximize?.();
	};
</script>

<header
	class={[
		'relative flex flex-col px-6 pb-3 text-center sm:text-left',
		'border-b border-neutral-200/80 dark:border-neutral-800/80',
		children && 'pt-8',
		props.class
	]}
>
	<div class="absolute top-3 left-6 flex items-center gap-2">
		<button
			type="button"
			class="
				inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full
				border border-black/10 bg-[#ff5f57]
				transition hover:border-black/20
			"
			aria-label="Cerrar"
			onclick={handleClose}
		></button>
		<button
			type="button"
			class="
				inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center
				rounded-full
				border border-black/10 bg-[#febc2e]
				transition hover:border-black/20
			"
			aria-label="Minimizar"
			onclick={handleMinimize}
		></button>
		<button
			type="button"
			class="
				inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center
				rounded-full
				border border-black/10 bg-[#28c840]
				transition hover:border-black/20
			"
			aria-label="Maximizar"
			onclick={handleMaximize}
		></button>
	</div>

	<form method="dialog" class="absolute top-2 right-2">
		<button
			type="submit"
			class="
				cursor-pointer rounded-full p-1.5
				text-neutral-400 hover:bg-neutral-100/70 hover:text-neutral-700
				focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70
				dark:text-neutral-500 dark:hover:bg-neutral-800/80 dark:hover:text-neutral-100
			"
			aria-label="Cerrar"
		>
			<X class="h-4 w-4" />
		</button>
	</form>

	{@render children?.()}
</header>
