<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Props } from './type.js';

	const { message, type = 'error', errors, children, ...props }: Props = $props();
</script>

<div
	in:fade={{ duration: 300 }}
	out:fade={{ duration: 300 }}
	class={[
		'rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-800/10 dark:text-red-500',
		props.class
	]}
	role="alert"
	tabindex="-1"
	aria-labelledby="hs-with-list-label"
>
	<div class="flex">
		<div class="shrink-0">
			<svg
				class="mt-0.5 size-4 shrink-0"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="10"></circle>
				<path d="m15 9-6 6"></path>
				<path d="m9 9 6 6"></path>
			</svg>
		</div>
		<div class="ms-4">
			<h3 id="hs-with-list-label" class="text-sm font-semibold">
				{message}
			</h3>
			{#if errors}
				<div class="mt-2 text-sm text-red-700 dark:text-red-400">
					<ul class="list-disc space-y-1 ps-5">
						{#each Object.entries(errors ?? {}) as [key, value]}
							<li>
								<strong>
									{key}
								</strong>:
								{#if value.length > 1}
									<ul class="list-disc space-y-1 pl-5">
										{#each value as error}
											<li>{error}</li>
										{/each}
									</ul>
								{:else}
									{value}
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
</div>
