<template>
	<loading-nanami v-if="$fetchState.pending" class="tile is-parent is-12" />
	<div v-else>
		<div class="box user-box">
			<div class="header">
				<img :src="`/banners/${user.banner}`" alt="User banner" class="banner">
				<div class="title-bar">
					<img :src="`/avatars/${user.avatar_file}`" alt="" class="profile">
					<span>
						{{
							user.nickname +
								(viewingSelf ? $t('profile.you'):'')
						}}
					</span>
				</div>
			</div>
			<div class="presentation">
				<div class="metadata">
					<ul v-if="user.social_networks">
						<li v-if="user.social_networks.twitter">
							<font-awesome-icon :icon="['fab', 'twitter']" :fixed-width="true" />
							<a :href="`https://twitter.com/${user.social_networks.twitter}/`" target="_blank">
								{{ user.social_networks.twitter }}
							</a>
						</li>
						<li v-if="user.social_networks.instagram">
							<font-awesome-icon :icon="['fab', 'instagram']" :fixed-width="true" />
							<a :href="`https://instagram.com/${user.social_networks.instagram}/`" target="_blank">
								{{ user.social_networks.instagram }}
							</a>
						</li>
						<li v-if="user.social_networks.discord">
							<font-awesome-icon :icon="['fab', 'discord']" :fixed-width="true" />
							{{ user.social_networks.discord }}
						</li>
						<li v-if="user.social_networks.twitch">
							<font-awesome-icon :icon="['fab', 'twitch']" :fixed-width="true" />
							<a :href="`https://twitch.tv/${user.social_networks.twitch}/`" target="_blank">
								{{ user.social_networks.twitch }}
							</a>
						</li>
						<li v-if="user.url">
							<font-awesome-icon :icon="['fas', 'link']" :fixed-width="true" />
							<a :href="user.url" target="_blank">
								{{ user.url }}
							</a>
						</li>
						<li v-if="user.location">
							<font-awesome-icon :icon="['fas', 'globe']" :fixed-width="true" />
							{{ getLocalizedCountry(user.location) }}
						</li>
					</ul>
				</div>
				<div class="bio">
					<p>{{ user.bio }}</p>
					<client-only>
						<button v-if="viewingSelf" class="button is-info" @click.prevent="openEdit">
							<font-awesome-icon :icon="['fas', 'edit']" fixed-width />
							{{ $t('profile.edit') }}
						</button>
					</client-only>
				</div>
			</div>
		</div>
		<template v-if="user.flag_displayfavorites || viewingSelf">
			<h1 class="title with-button">
				<font-awesome-icon :icon="['fas', 'star']" fixed-width />
				{{ $t('profile.favorites') }}
			</h1>
			<kara-query :favorites="user.login" />
		</template>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import isoCountriesLanguages from 'iso-countries-languages';

	import { DBUser } from '%/lib/types/database/user';
	import LoadingNanami from '~/components/LoadingNanami.vue';
	import KaraQuery from '~/components/KaraQuery.vue';
	import { modalStore } from '~/store';

	interface VState {
		user?: DBUser,
		VuexUnsubscribe?: Function
	}

	export default Vue.extend({
		name: 'UserView',

		components: {
			LoadingNanami,
			KaraQuery
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

		computed: {
			viewingSelf(): boolean {
				return this.$auth.loggedIn && (this.$route.params.login === this.$auth.user.login);
			}
		},

		mounted() {
			this.VuexUnsubscribe = this.$store.subscribe(
				(mutation: {type: string, payload: {key: 'user'|'loggedIn', value: any}}, _state: any) => {
					if (mutation.type === 'auth/SET') {
						if (mutation.payload.key === 'user' && this.$route.params.login === mutation.payload.value.login) {
							this.$fetch();
						} else if (mutation.payload.key === 'loggedIn' && mutation.payload.value === false) {
							this.$router.push('/');
						}
					}
				});
		},

		destroyed() {
			if (this.VuexUnsubscribe) { this.VuexUnsubscribe(); }
		},

		methods: {
			getLocalizedCountry(country: string): string {
				return isoCountriesLanguages.getCountry(this.$i18n.locale, country);
			},
			openEdit() {
				modalStore.openModal('profile');
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
	.title.with-button {
		padding: 1rem .5rem;
		margin-bottom: .5rem;
	}
</style>
