<script lang="ts">
	import type { Props } from './type.js';

	const { src, alt, size = 'md', fallback, online = false }: Props = $props();

	const sizes: Record<typeof size, string> = {
		xs: 'w-4 h-4',
		sm: 'w-5 h-5',
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
		xl: 'w-10 h-10',
		'2xl': 'w-12 h-12',
		'3xl': 'w-14 h-14',
		'4xl': 'w-16 h-16',
		'5xl': 'w-20 h-20',
		'6xl': 'w-24 h-24',
		'7xl': 'w-28 h-28',
		'8xl': 'w-32 h-32'
	};
</script>

<div class="relative">
	<div
		class={[
			'flex items-center justify-center overflow-hidden rounded-full bg-gray-900 font-semibold text-white ring-2 ring-gray-100',
			sizes[size]
		]}
	>
		{#if src}
			<img {src} {alt} class="h-full w-full object-cover" />
		{:else}
			<span>{fallback}</span>
		{/if}
	</div>
	{#if online}
		<div
			class="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"
		></div>
	{/if}
</div>
