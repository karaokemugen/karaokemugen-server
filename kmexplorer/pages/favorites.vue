<template>
	<kara-query favorites />
</template>

<script lang="ts">
	import Vue from 'vue';

	import KaraQuery from '~/components/KaraQuery.vue';

	export default Vue.extend({
		name: 'KaraFavorites',

		components: {
			KaraQuery
		},

		transition: 'fade'
	});
</script>
