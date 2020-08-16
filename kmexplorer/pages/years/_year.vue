<template>
	<kara-query :year="parseInt($route.params.year)" />
</template>

<script lang="ts">
	import Vue from 'vue';
	import KaraQuery from '~/components/KaraQuery.vue';

	export default Vue.extend({
		name: 'YearVue',

		components: {
			KaraQuery
		},

		validate({ params }) {
			return !isNaN(parseInt(params.year));
		},

		transition: 'fade'
	});
</script>
