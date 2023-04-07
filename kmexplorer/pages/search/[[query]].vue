<template>
	<kara-query />
</template>

<script setup lang="ts">
	import { useMenubarStore } from '~/store/menubar';

	const { setSearch } = useMenubarStore();
	const { params } = useRoute();
	
	onBeforeMount(() =>  {
		if (params.query) {
			setSearch(decodeURIComponent(params.query as string));
		}
	});
</script>
