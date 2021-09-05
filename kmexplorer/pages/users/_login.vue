<template>
	<div class="tile is-ancestor">
		<div v-if="user" class="tile is-parent is-12">
			<div class="box user-box">
				<div class="header">
					<img :src="`/previews/${user.banner}`" alt="User banner" class="banner">
					<div class="title-bar">
						<img :src="`/avatars/${user.avatar_file}`" alt="" class="profile">
						<span>{{ user.nickname }}</span>
					</div>
				</div>
				<div class="presentation">
					<div class="metadata">
						<ul v-if="user.social_networks">
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
								{{ user.social_networks.twitch }}
							</li>
							<li v-if="user.location">
								<font-awesome-icon :icon="['fas', 'globe']" :fixed-width="true" />
								{{ getLocalizedCountry(user.location) }}
							</li>
						</ul>
					</div>
					<div class="bio">
						<p>{{ user.bio }}</p>
					</div>
				</div>
			</div>
		</div>

		<loading-nanami v-if="$fetchState.pending" class="tile is-parent is-12" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import isoCountriesLanguages from 'iso-countries-languages';

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
		},

		methods: {
			getLocalizedCountry(country: string): string {
				return isoCountriesLanguages.getCountry(this.$i18n.locale, country);
			}
		}
	});
</script>

<style scoped lang="scss">
	@mixin height-hack($factor: 1) {
		height: 25rem * $factor;
		@media screen and (max-width: 1600px) {
			height: 20rem * $factor;
		}
		@media screen and (max-width: 1200px) {
			height: 15rem * $factor;
		}
		@media screen and (max-width: 680px) {
			height: 10rem * $factor;
		}
	}

	.box.user-box {
		flex-grow: 1;
		margin-right: 0.75rem;
		.header {
			position: relative;
			transform: translate(-1.25rem, -1.25rem);
			width: calc(100% + 2.5rem);
			@include height-hack;
			> img.banner {
				@include height-hack;
				width: 100%;
				object-fit: cover;
				border-top-left-radius: 8px;
				border-top-right-radius: 8px;
			}
			.title-bar {
				position: absolute;
				display: flex;
				align-items: center;
				bottom: 0;
				width: 100%;
				background-color: #000000bb;
				> img.profile {
					@include height-hack(0.25);
					width: auto;
				}
				> span {
					padding: .25em;
					line-height: 1em;
					font-size: 1.75em;
					font-weight: bold;
				}
			}
		}
		.presentation {
			padding: .25em;
			@media screen and (min-width: 769px) {
				display: flex;
				.metadata {
					padding-right: 1em;
				}
				.bio {
					border-left: gray 1px solid;
					padding-left: 1em;
					flex-grow: 1;
				}
			}
		}
	}
</style>
