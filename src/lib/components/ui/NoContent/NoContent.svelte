<script lang="ts">
	import type { Props } from './type.js';

	const { title, subtitle, children, icon: Icon, ...props }: Props = $props();
</script>

<div class={['w-full py-20 text-center', props.class]}>
	{#if Icon}
		<div
			class={[
				'mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100'
			]}
		>
			<Icon class="h-12 w-12 text-gray-400" />
		</div>
	{/if}
	<h3 class="text-2xl font-bold text-gray-900">{title}</h3>
	<p class="text-md mx-auto max-w-md text-gray-500">
		{subtitle}
	</p>
	{#if children}
		<div class="mt-4 flex items-center justify-center gap-4">
			{@render children?.()}
		</div>
	{/if}
</div>
