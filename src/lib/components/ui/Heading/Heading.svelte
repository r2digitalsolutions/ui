<script lang="ts">
	import type { Props } from './type.js';

	const { title, description, ...props }: Props = $props();
</script>

<div class={['flex flex-col', props.class]}>
	<h2 class="text-3xl font-bold text-gray-900 md:text-4xl">{title}</h2>
	<p class="text-xl text-gray-600">{description}</p>
</div>
