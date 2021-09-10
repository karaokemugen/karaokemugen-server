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
			if (process.server && this.$route.params.query) {
				menuBarStore.setSearch(decodeURIComponent(this.$route.params.query));
			}
		}
	});
</script>
