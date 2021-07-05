<template>
	<div class="tile is-ancestor">
		<div v-if="user" class="tile is-parent is-12">
			{{ user.nickname }}
		</div>

		<loading-nanami v-if="$fetchState.pending" class="tile is-parent is-12" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { DBUser } from '%/lib/types/database/user';
	import LoadingNanami from '~/components/LoadingNanami.vue';

	interface VState {
		user?: DBUser
	}

	export default Vue.extend({
		name: 'UserView',

		components: {
			LoadingNanami
		},

		data(): VState {
			return {};
		},

		async fetch() {
			const res: DBUser | false = await this.$axios.$get(`/api/users/${this.$route.params.login}`).catch(() => {
				this.$nuxt.error({ statusCode: 500 });
				return false;
			});
			if (res) {
				this.user = res;
			} else {
				this.$nuxt.error({ statusCode: 404 });
			}
		}
	});
</script>

<style scoped>

</style>
