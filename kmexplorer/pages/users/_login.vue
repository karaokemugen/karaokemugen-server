<template>
	<div class="tile is-ancestor">
		<div v-if="user" class="tile is-parent is-12">
			<div class="box">
				<h2>{{ user.nickname }}</h2>
				<p>{{ user.bio }}</p>
				<ul>
					<li v-if="user.social_networks.twitter">
						<font-awesome-icon :icon="['fab', 'twitter']" :fixed-width="true" />
						{{ user.social_networks.twitter }}
					</li>
					<li v-if="user.social_networks.instagram">
						<font-awesome-icon :icon="['fab', 'instagram']" :fixed-width="true" />
						{{ user.social_networks.instagram }}
					</li>
					<li v-if="user.social_networks.discord">
						<font-awesome-icon :icon="['fab', 'discord']" :fixed-width="true" />
						{{ user.social_networks.discord }}
					</li>
					<li v-if="user.social_networks.twitch">
						<font-awesome-icon :icon="['fab', 'twitch']" :fixed-width="true" />
						 {{ user.social_networks.twitter }}
					</li>
				</ul>
			</div>
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
			return {
				user: {}
			};
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
