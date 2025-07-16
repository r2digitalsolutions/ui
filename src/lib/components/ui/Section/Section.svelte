<script lang="ts">
	import type { Props } from './type.js';

	const { children, ...props }: Props = $props();
</script>

<section class={['cu-section relative flex flex-col gap-2 py-32', props.class]}>
	{@render children()}
</section>
