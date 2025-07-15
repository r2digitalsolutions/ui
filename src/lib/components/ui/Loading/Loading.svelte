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

<div class={['flex justify-center gap-2', props.class]}>
	<Loader class="h-6 w-6 animate-spin" />
	<span> {loadingText} </span>
</div>
