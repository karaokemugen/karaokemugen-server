<template>
	<p>Huh? What do you do here? Not normal.</p>
</template>

<script lang="ts">
	import Vue from 'vue';

	export default Vue.extend({
		name: 'YearVue',

		// Dummy page to assure redirects
		asyncData({ redirect, params }) {
			redirect(301, '/search/', { q: `y:${params.year}` });
		},

		validate({ params }) {
			return !isNaN(parseInt(params.year));
		}
	});
</script>
