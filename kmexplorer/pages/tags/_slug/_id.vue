<template>
	<p>Huh? What do you do here? Not normal.</p>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { tagRegex } from '~/assets/constants';

	export default Vue.extend({
		name: 'KaraListTag',

		validate({ params }) {
			return tagRegex.test(params?.id);
		},

		// Dummy page to assure redirects
		asyncData({ redirect, params }) {
			redirect(301, '/search/', { q: `t:${params.id}` });
		}
	});
</script>
