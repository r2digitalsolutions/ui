<script lang="ts">
	import type { Props } from './type.js';

	const { children, ...props }: Props = $props();
</script>

<div class={['mx-auto w-full max-w-full px-4 sm:max-w-[1920px]', props.class]}>
	{@render children()}
</div>
