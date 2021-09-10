<template>
	<p>Huh? What do you do here? Not normal.</p>
</template>

<script lang="ts">
	import Vue from 'vue';

	export default Vue.extend({
		name: 'KaraFavorites',

		// Dummy page to assure redirects
		asyncData({ redirect, $auth }) {
			if ($auth.loggedIn) {
				redirect(301, `/user/${$auth.user.login}`);
			} else {
				redirect(302, '/');
			}
		}
	});
</script>
