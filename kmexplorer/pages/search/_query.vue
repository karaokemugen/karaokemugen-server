<template>
	<kara-query />
</template>

<script lang="ts">
	import Vue from 'vue';

	import KaraQuery from '~/components/KaraQuery.vue';
	import { menuBarStore } from '~/store';

	export default Vue.extend({
		name: 'KaraSearch',

		components: {
			KaraQuery
		},

		created() {
			menuBarStore.setSearch(this.$route.params.query ? this.$route.params.query : '');
			if (menuBarStore.sort === 'karacount') {
				menuBarStore.setSort('recent');
			}
		},

		transition: 'fade'
	});
</script>
