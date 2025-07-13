<script>
	const { children } = $props();
</script>

<div class="flex flex-1 flex-col gap-2 p-6">
	{@render children()}
</div>
