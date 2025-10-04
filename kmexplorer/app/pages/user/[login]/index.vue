<template>
	<loading-nanami
		v-if="!user?.login"
		class="tile is-parent is-12"
	/>
	<div v-else>
		<div class="user-box">
			<div class="header">
				<img
					:src="`${requestUrl.origin}/banners/${user.banner}`"
					alt="User banner"
					class="banner"
				>
				<div class="down">
					<div class="is-flex is-justify-content-space-between is-align-items-center">
						<div class="title-bar">
							<img
								:src="`/avatars/${user.avatar_file}`"
								alt=""
								class="profile"
							>
							<div class="name-badges">
								<div
									v-if="!edit"
									class="name"
								>
									{{ user.nickname }}
									<font-awesome-icon
										v-if="!edit && !user.flag_public"
										:icon="['fas', 'lock']"
										fixed-width
										:title="$t('profile.private')"
									/>
								</div>
								<div v-if="edit" class="m-2">
									<div class="field is-horizontal">
										<div class="field-label is-normal">
											<label
												for="nickname"
												class="label"
											>{{ $t('modal.profile.fields.nickname.label') }}</label>
										</div>
										<div class="field-body">
											<input
												id="nickname"
												v-model="user.nickname"
												type="text"
												name="nickname"
												class="input"
												required
											>
										</div>
									</div>
									<div class="field is-horizontal">
										<div class="field-label is-normal">
											<label
												for="email"
												class="label"
											>{{ $t('modal.profile.fields.email.label') }}</label>
										</div>
										<div class="field-body">
											<input
												id="email"
												v-model="user.email"
												type="email"
												name="email"
												class="input"
												required
											>
										</div>
									</div>
								</div>
								<user-badges
									:roles="user.roles"
									:edit="edit"
									@toggle="toggleRole"
								/>
							</div>
						</div>
						<client-only>
							<div class="is-flex is-justify-content-flex-end">
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
								<button
									v-if="!edit && canDeleteAdmin"
									type="button"
									class="button is-danger"
									@click.prevent="openDeleteAccountModal"
								>
									{{ $t('modal.profile.delete') }}
								</button>
							</div>
						</client-only>
					</div>
					<template v-if="bio || metadata">
						<div
							v-if="metadata"
							class="metadata"
						>
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
							<div v-if="user.social_networks && user.social_networks.bluesky">
								<font-awesome-icon
									:icon="['fab', 'bluesky']"
									:fixed-width="true"
								/>
								<nuxt-link
									:href="`https://bsky.app/profile/${user.social_networks.bluesky}/`"
									target="_blank"
								>
									{{ user.social_networks.bluesky }}
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
		<div v-if="playlists.length > 0">
			<div class="title-box">
				<h1 class="title with-button">
					<font-awesome-icon
						:icon="['fas', 'list']"
						fixed-width
					/>
					{{ $t('profile.playlists_count', playlists.length) }}
				</h1>
			</div>
			<playlist-list
				:playlists="playlists"
				:chunk-size="10"
			/>
		</div>
		<template v-if="(user.flag_displayfavorites && user.favorites_count && user.favorites_count > 0) || viewingSelf">
			<div class="title-box">
				<h1 class="title with-button">
					<font-awesome-icon
						:icon="['fas', 'star']"
						fixed-width
					/>
					{{ $t('profile.favorites_count', user.favorites_count || 0) }}
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
							:icon="['fas', user.flag_displayfavorites ? 'eye' : 'eye-slash']"
							fixed-width
						/>
						{{ $t(user.flag_displayfavorites ? 'profile.public_favorites' : 'profile.private_favorites') }}
					</button>
				</div>
			</div>
			<kara-query :favorites="user.login" />
		</template>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';

	import type { DBUser } from '%/lib/types/database/user';
	import type { Roles } from '%/lib/types/user';
	import { useModalStore } from '~/store/modal';
	import { useAuthStore } from '~/store/auth';
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';
	import { useConfigStore } from '~/store/config';

	type RoleKey = keyof Roles;

	const user = ref<DBUser>();
	const edit = ref(false);
	const loading = ref(false);
	const playlists = ref<DBPL[]>([]);

	const { loggedIn, user: userConnected } = storeToRefs(useAuthStore());
	const { openModal } = useModalStore();
	const { params } = useRoute();
	const { t, locale } = useI18n();
	const { config } = storeToRefs(useConfigStore());

	const requestUrl = useRequestURL();

	const viewingSelf = computed(() => loggedIn.value && (params.login === userConnected?.value?.login));
	const canEdit = computed(() => (loggedIn.value && !!userConnected?.value?.roles?.admin) || viewingSelf.value);
	const canDeleteAdmin = computed(() => loggedIn.value && !!userConnected?.value?.roles?.admin && !viewingSelf.value);
	const metadata = computed(() => !!(
		user.value?.social_networks?.discord ||
		user.value?.social_networks?.instagram ||
		user.value?.social_networks?.mastodon ||
		user.value?.social_networks?.bluesky ||
		user.value?.social_networks?.twitch ||
		user.value?.url ||
		user.value?.location
	));
	const bio = computed(() => !!user.value?.bio);
	// Remove protocol if http(s) and trailing slash
	const url = computed(() => user.value?.url?.replace(/^https?:\/\//i, '').replace(/\/$/, '') || '');

	await fetch();
	getPlaylists();

	async function fetch() {
		if (config?.value && !config.value.Users.Enabled) {
			throw createError({ statusCode: 404 });
		}
		const url = viewingSelf.value
			? '/api/myaccount'
			: `/api/users/${params.login}`;
		const res = await useCustomFetch<DBUser>(url, {
			params: {
				forcePublic: loggedIn.value && !!userConnected?.value?.roles?.admin
			}
		}).catch((err) => {
			if (err?.response?.status === 404) {
				throw createError({ statusCode: 404, message: t('error.not_found_profile') });
			}
			throw createError({ statusCode: 500 });
		});
		if (res) {
			if (!viewingSelf.value && !res.flag_public && !(loggedIn.value && userConnected?.value?.roles?.admin)) {
				throw createError({ statusCode: 403, message: t('error.private_profile') });
			}
			user.value = res;
		} else {
			throw createError({ statusCode: 404, message: t('error.not_found_profile') });
		}
	}

	async function getPlaylists() {
		playlists.value = await useCustomFetch<DBPL[]>('/api/playlist', {
			params: {
				byUsername: user?.value?.login
			}
		});
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
				nickname: user.value?.nickname,
				email: user.value?.email,
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

	function openDeleteAccountModal() {
		openModal('deleteAccount');
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
