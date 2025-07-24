<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { DialogPropsgHeaderProps } from './type.js';

	let { children, ...props }: DialogPropsgHeaderProps = $props();
</script>

<header class={['flex flex-col px-6 text-center sm:text-left', props.class, children && 'pt-6']}>
	{@render children?.()}
	<form method="dialog" class="absolute top-0 right-0">
		<button
			type="submit"
			class="cursor-pointer p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
			aria-label="Close"
		>
			<X class="h-6 w-6" />
		</button>
	</form>
</header>
