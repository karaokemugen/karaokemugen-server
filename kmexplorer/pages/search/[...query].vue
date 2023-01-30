<template>
	<kara-query />
</template>

<script setup lang="ts">
	import { useMenubarStore } from '~/store/menubar';

	const { setSearch } = useMenubarStore();
	const { params } = useRoute();
	const { replace } = useRouter();

	replace(generateNavigation());

	onMounted(() =>  {
		if (process.server && params.query) {
			setSearch(decodeURIComponent(params.query as string));
		}
	});
</script>
