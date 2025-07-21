<script lang="ts">
	import { Loader } from 'lucide-svelte';
	import type { ClassValue } from 'svelte/elements';

	const {
		loadingText = 'Cargando...',
		...props
	}: {
		loadingText?: string;
		class?: ClassValue;
	} = $props();
</script>

<div class={['flex items-center justify-center gap-2 text-sm', props.class]}>
	<Loader class="h-4 w-4 animate-spin" />
	<span> {loadingText} </span>
</div>
