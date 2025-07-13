<script lang="ts">
	const { children } = $props();
</script>

<header class="flex flex-row gap-2">
	{@render children()}
</header>
