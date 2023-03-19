<template>
	<loading-nanami
		v-if="!user.login"
		class="tile is-parent is-12"
	/>
	<div v-else>
		<div class="user-box">
			<div class="header">
				<img
					:src="`${apiUrl}banners/${user.banner}`"
					alt="User banner"
					class="banner"
				>
				<div class="down">
					<div class="title-bar">
						<img
							:src="`/avatars/${user.avatar_file}`"
							alt=""
							class="profile"
						>
						<div class="name-badges">
							<div
								ref="name"
								class="name"
								:class="{edit}"
								:contenteditable="edit"
							>
								{{ user.nickname }}
								<font-awesome-icon
									v-if="!edit && !user.flag_public"
									:icon="['fas', 'lock']"
									fixed-width
									:title="$t('profile.private')"
								/>
							</div>
							<user-badges
								:roles="user.roles"
								:edit="edit"
								@toggle="toggleRole"
							/>
						</div>
						<client-only>
							<button
								v-if="edit"
								class="button is-success"
								:class="{'is-loading': loading}"
								@click.prevent="submitEdit"
							>
								<font-awesome-icon
									:icon="['fas', 'sign-in-alt']"
									fixed-width
								/>
								<span class="is-hidden-mobile">{{ $t('modal.profile.submit') }}</span>
							</button>
							<button
								v-else-if="canEdit"
								class="button"
								@click.prevent="openEdit"
							>
								<font-awesome-icon
									:icon="['fas', 'edit']"
									fixed-width
								/>
								<span class="is-hidden-mobile">{{ $t('profile.edit') }}</span>
							</button>
						</client-only>
					</div>
					<template v-if="bio || metadata">
						<div
							v-if="metadata"
							class="metadata"
						>
							<div v-if="user.social_networks && user.social_networks.twitter">
								<font-awesome-icon
									:icon="['fab', 'twitter']"
									:fixed-width="true"
								/>
								<nuxt-link
									:href="`https://twitter.com/${user.social_networks.twitter}/`"
									target="_blank"
								>
									{{ user.social_networks.twitter }}
								</nuxt-link>
							</div>
							<div v-if="user.social_networks && user.social_networks.mastodon">
								<font-awesome-icon
									:icon="['fab', 'mastodon']"
									:fixed-width="true"
								/>
								<nuxt-link
									:href="`https://${user.social_networks.mastodon.split('@')[1]}/@${user.social_networks.mastodon.split('@')[0]}/`"
									target="_blank"
								>
									{{ user.social_networks.mastodon }}
								</nuxt-link>
							</div>
							<div v-if="user.social_networks && user.social_networks.instagram">
								<font-awesome-icon
									:icon="['fab', 'instagram']"
									:fixed-width="true"
								/>
								<nuxt-link
									:href="`https://instagram.com/${user.social_networks.instagram}/`"
									target="_blank"
								>
									{{ user.social_networks.instagram }}
								</nuxt-link>
							</div>
							<div v-if="user.social_networks && user.social_networks.discord">
								<font-awesome-icon
									:icon="['fab', 'discord']"
									:fixed-width="true"
								/>
								{{ user.social_networks.discord }}
							</div>
							<div v-if="user.social_networks && user.social_networks.twitch">
								<font-awesome-icon
									:icon="['fab', 'twitch']"
									:fixed-width="true"
								/>
								<nuxt-link
									:href="`https://twitch.tv/${user.social_networks.twitch}/`"
									target="_blank"
								>
									{{ user.social_networks.twitch }}
								</nuxt-link>
							</div>
							<div v-if="url">
								<font-awesome-icon
									:icon="['fas', 'link']"
									:fixed-width="true"
								/>
								<nuxt-link
									:href="user.url"
									target="_blank"
								>
									{{ url }}
								</nuxt-link>
							</div>
							<div v-if="user.location">
								<font-awesome-icon
									:icon="['fas', 'globe']"
									:fixed-width="true"
								/>{{ getCountriesInLocaleFromCode(user.location, locale) }}
							</div>
						</div>
						<div
							v-if="bio"
							class="bio"
						>
							<p>{{ user.bio }}</p>
						</div>
					</template>
				</div>
			</div>
		</div>
		<template v-if="(user.flag_displayfavorites && user.favorites_count && user.favorites_count > 0) || viewingSelf">
			<div class="title-box">
				<h1 class="title with-button">
					<font-awesome-icon
						:icon="['fas', 'star']"
						fixed-width
					/>
					{{ $t('profile.favorites_count', { x: user.favorites_count }) }}
				</h1>
				<div
					v-if="viewingSelf"
					class="title is-4 with-button"
				>
					<button
						class="button"
						:class="{'is-loading': loading}"
						:disabled="!user.flag_public"
						:title="$t('modal.profile.fields.flag_displayfavorites.desc')"
						@click="toggleFavorite"
					>
						<font-awesome-icon
							:icon="['fas', user.flag_displayfavorites ? 'eye':'eye-slash']"
							fixed-width
						/>
						{{ $t(user.flag_displayfavorites ? 'profile.public_favorites': 'profile.private_favorites') }}
					</button>
				</div>
			</div>
			<kara-query :favorites="user.login" />
		</template>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';

	import { DBUser } from '%/lib/types/database/user';
	import { Roles } from '%/lib/types/user';
	import { useModalStore } from '~/store/modal';
	import { useAuthStore } from '~/store/auth';

	type RoleKey = keyof Roles;

	const user = ref<DBUser>({});
	const edit = ref(false);
	const loading = ref(false);
	const name = ref<HTMLDivElement>();

	const { loggedIn, user:userConnected } = storeToRefs(useAuthStore());
	const { openModal } = useModalStore();
	const { params } = useRoute();
	const { t, locale } = useI18n();

	const conf = useRuntimeConfig();
	const usersEnabled = conf.public.USERS;
	const apiUrl = conf.public.API_URL;

	const viewingSelf = computed(() => loggedIn.value && (params.login === userConnected?.value?.login));
	const canEdit = computed(() => (loggedIn.value && !!userConnected?.value?.roles?.admin) || viewingSelf.value);
	const metadata = computed(() => !!(
		user.value?.social_networks?.discord ||
		user.value?.social_networks?.instagram ||
		user.value?.social_networks?.twitter ||
		user.value?.social_networks?.mastodon ||
		user.value?.social_networks?.twitch ||
		user.value?.url ||
		user.value?.location
	));
	const bio = computed(() => !!user.value?.bio);
	// Remove protocol if http(s) and trailing slash
	const url = computed(() => user.value?.url?.replace(/^https?:\/\//i, '').replace(/\/$/, '') || '');

	fetch();

	async function fetch() {
		if (!usersEnabled) {
			throw createError({ statusCode: 404 });
		}
		const url = viewingSelf.value
			? '/api/myaccount'
			: `/api/users/${params.login}`;
		const res  = await useCustomFetch<DBUser>(url).catch(() => {
			throw createError({ statusCode: 500 });
		});
		if (res) {
			if (!viewingSelf.value && !res.flag_public) {
				throw createError({ statusCode: 403, message: t('error.private_profile') as string });
			}
			user.value = res;
		} else {
			throw createError({ statusCode: 404, message: t('error.not_found_profile') as string });
		}
	}

	function openEdit() {
		if (viewingSelf.value) {
			openModal('profile');
		} else {
			edit.value = true;
		}
	}
	function toggleRole(name: RoleKey) {
		if (!user.value) {
			throw new Error('User is not loaded');
		}
		if (!user.value.roles) {
			user.value.roles = {};
		}
		user.value.roles[name] = !user.value.roles[name];
	}
	function submitEdit() {
		loading.value = true;
		useCustomFetch(`/api/users/${params.login}`, {
			method: 'PATCH',
			body: {
				nickname: name.value?.innerText || user.value?.nickname,
				roles: user.value?.roles
			}
		}).then(() => {
			fetch();
		}).finally(() => {
			edit.value = false;
			loading.value = false;
		});
	}
	function toggleFavorite() {
		loading.value = true;
		useCustomFetch('/api/myaccount', {
			method: 'PATCH',
			body: {
				flag_displayfavorites: !user.value?.flag_displayfavorites
			}
		}).then(() => {
			if (user.value) {
				user.value.flag_displayfavorites = !user.value?.flag_displayfavorites;
			}
		}).finally(() => {
			loading.value = false;
		});
	}
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
				> div.name-badges {
					> div.name {
						padding: .1em;
						line-height: 1em;
						font-size: 1.75em;
						font-weight: bold;
						max-height: 2em;
						// Dans ta gueule le mec avec son psuedo de 2 mètres !
						overflow-wrap: anywhere;
						overflow: hidden;

						transition: padding 150ms ease, margin 150ms ease;
						&.edit {
							padding: .5em;
							margin: .25em;
							background-color: #343b3d;
							border-bottom: whitesmoke 1px solid;
						}
					}
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

					svg {
						margin-right: 0.20em;
					}
				}
			}
			.bio {
				padding: 1em;
				border-top: solid 1px gray;
			}
		}
	}
	.title-box {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		@media screen and (max-width: 769px) {
			flex-direction: column;
			align-items: flex-start;
		}
	}
	.title.with-button {
		padding: 1rem .5rem;
		margin-bottom: .5rem;
	}
</style>
