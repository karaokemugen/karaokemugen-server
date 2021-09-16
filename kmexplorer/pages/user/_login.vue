<template>
	<loading-nanami v-if="$fetchState.pending" class="tile is-parent is-12" />
	<div v-else>
		<div class="user-box">
			<div class="header">
				<img :src="`/banners/${user.banner}`" alt="User banner" class="banner">
				<div class="down">
					<div class="title-bar">
						<img :src="`/avatars/${user.avatar_file}`" alt="" class="profile">
						<span>
							{{ user.nickname }}
						</span>
						<client-only>
							<button v-if="viewingSelf" class="button" @click.prevent="openEdit">
								<font-awesome-icon :icon="['fas', 'edit']" fixed-width />
								<span class="is-hidden-mobile">{{ $t('profile.edit') }}</span>
							</button>
						</client-only>
					</div>
					<template v-if="bio || metadata">
						<div v-if="metadata" class="metadata">
							<div v-if="user.social_networks.twitter">
								<font-awesome-icon :icon="['fab', 'twitter']" :fixed-width="true" />
								<a :href="`https://twitter.com/${user.social_networks.twitter}/`" target="_blank">
									{{ user.social_networks.twitter }}
								</a>
							</div>
							<div v-if="user.social_networks.instagram">
								<font-awesome-icon :icon="['fab', 'instagram']" :fixed-width="true" />
								<a :href="`https://instagram.com/${user.social_networks.instagram}/`" target="_blank">
									{{ user.social_networks.instagram }}
								</a>
							</div>
							<div v-if="user.social_networks.discord">
								<font-awesome-icon :icon="['fab', 'discord']" :fixed-width="true" />
								{{ user.social_networks.discord }}
							</div>
							<div v-if="user.social_networks.twitch">
								<font-awesome-icon :icon="['fab', 'twitch']" :fixed-width="true" />
								<a :href="`https://twitch.tv/${user.social_networks.twitch}/`" target="_blank">
									{{ user.social_networks.twitch }}
								</a>
							</div>
							<div v-if="url">
								<font-awesome-icon :icon="['fas', 'link']" :fixed-width="true" />
								<a :href="user.url" target="_blank">
									{{ url }}
								</a>
							</div>
							<div v-if="user.location">
								<font-awesome-icon :icon="['fas', 'globe']" :fixed-width="true" />
								{{ getLocalizedCountry(user.location) }}
							</div>
						</div>
						<div v-if="bio" class="bio">
							<p>{{ user.bio }}</p>
						</div>
					</template>
				</div>
			</div>
		</div>
		<template v-if="(user.flag_displayfavorites && user.favorites_count > 0) || viewingSelf">
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
	import { menuBarStore, modalStore } from '~/store';

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
				user: {},
				VuexUnsubscribe: () => {}
			};
		},

		async fetch() {
			if (!process.env.USERS as unknown as boolean) {
				this.$nuxt.error({ statusCode: 404 });
			}
			const url = this.viewingSelf
				? '/api/myaccount'
				: `/api/users/${this.$route.params.login}`;
			const res: DBUser | false = await this.$axios.$get(url).catch(() => {
				this.$nuxt.error({ statusCode: 500 });
				return false;
			});
			if (res) {
				if (!this.viewingSelf && !res.flag_public) {
					this.$nuxt.error({ statusCode: 403, message: this.$t('error.private_profile') as string });
				}
				this.user = res;
			} else {
				this.$nuxt.error({ statusCode: 404 });
			}
		},

		computed: {
			viewingSelf(): boolean {
				return this.$auth.loggedIn && (this.$route.params.login === this.$auth.user.login);
			},
			metadata(): boolean {
				return !!(
					this.user?.social_networks?.discord ||
					this.user?.social_networks?.instagram ||
					this.user?.social_networks?.twitter ||
					this.user?.social_networks?.twitch ||
					this.user?.url ||
					this.user?.location
				);
			},
			bio(): boolean {
				return !!this.user?.bio;
			},
			url(): string {
				// Remove protocol if http(s) and trailing slash
				return this.user?.url?.replace(/^https?:\/\//i, '').replace(/\/$/, '') || '';
			}
		},

		beforeCreate() {
			menuBarStore.setSearch('');
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

	$user-box-radius: 8px;

	.user-box {
		flex-grow: 1;
		// margin-right: 0.75rem;
		display: flex;
		justify-content: center;
		border-radius: $user-box-radius;
		.header {
			position: relative;
			display: flex;
			flex-direction: column;
			@media screen and (max-width: 900px) {
				margin-right: 0.25em;
			}
			@supports (aspect-ratio: 16/9) {
				aspect-ratio: 16/9;
				height: clamp(450px, 60vh, 800px);
				@media screen and (max-width: 900px) {
					height: unset;
					width: 100%;
				}
				> img.banner {
					position: absolute;
					height: 100%;
					width: 100%;
					top: 0;
					object-fit: cover;
					border-radius: $user-box-radius;
				}
			}
			@supports not (aspect-ratio: 16/9) {
				width: 66%;
				padding-top: 56.25% * 0.66; // 56.25 is for 100% width, here we have 66M
				@media screen and (max-width: 900px) {
					width: 100%;
					padding-top: 56.25%;
				}
				> img.banner {
					position: absolute;
					top: 0;
					object-fit: cover;
					border-radius: $user-box-radius;
				}
			}
			.down {
				position: absolute;
				bottom: 0;
				width: 100%;
				border-radius: $user-box-radius;
				background-color: #000000bd;
			}
			.title-bar {
				display: flex;
				align-items: center;
				@media screen and (max-width: 1600px) {
					flex-wrap: wrap;
				}
				> img.profile {
					height: 6em;
					@media screen and (max-width: 1600px) {
						height: 3em;
					}
					width: auto;
					margin: .5rem;
					border-radius: $user-box-radius * 2;
				}
				> span {
					padding: .1em;
					line-height: 1em;
					font-size: 1.75em;
					font-weight: bold;
					max-height: 2em;
					// Dans ta gueule le mec avec son psuedo de 2 mètres !
					overflow-wrap: anywhere;
					overflow: hidden;
				}
				> button {
					margin-right: .5em;
					margin-left: auto;
					opacity: 0.75;
					&:hover {
						opacity: 1;
					}
				}
			}
			.metadata {
				display: flex;
				justify-content: space-around;
				flex-wrap: wrap;
				padding: 1em 0;
				border-top: 1px solid gray;
				> div {
					padding: 0 1em;
				}
			}
			.bio {
				padding: 1em;
				border-top: solid 1px gray;
			}
		}
	}
	.title.with-button {
		padding: 1rem .5rem;
		margin-bottom: .5rem;
	}
</style>
