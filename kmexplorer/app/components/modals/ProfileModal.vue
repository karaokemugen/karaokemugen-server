<template>
	<div
		class="modal"
		:class="{'is-active': active}"
	>
		<form
			v-if="!crop_modal && user"
			action="#"
			@submit.prevent="submitForm"
		>
			<div
				class="modal-background"
				@click="closeModal"
			/>
			<div class="modal-card">
				<header>
					<div class="modal-card-head">
						<h1 class="modal-card-title">
							{{ $t('modal.profile.title') }}
						</h1>
						<nuxt-link
							class="delete"
							aria-label="close"
							@click="closeModal"
						/>
					</div>
				</header>
				<section class="modal-card-body">
					<div class="profile-pic-box">
						<img
							v-if="editedUser.avatar_file"
							alt="Profile Picture"
							class="img"
							:src="editedUser.avatar_file.startsWith('data:') ? editedUser.avatar_file : `${url.origin}/avatars/${editedUser.avatar_file}`"
						>
						<div class="data">
							<span class="login">{{ `${editedUser.login}@${url.hostname}` }}</span>
							<user-badges :roles="editedUser.roles" />
							<label
								for="avatar"
								class="button"
							>
								<input
									id="avatar"
									type="file"
									accept="image/jpg, image/jpeg, image/png, image/gif"
									@change="openCropModal"
								>
								<font-awesome-icon
									:icon="['fas', 'portrait']"
									:fixed-width="true"
								/>
								{{ $t('modal.profile.select_avatar') }}
							</label>
						</div>
					</div>
					<h2 class="subtitle">
						<font-awesome-icon
							:icon="['fas', 'user']"
							fixed-width
						/> {{ $t('modal.profile.headers.profile') }}
					</h2>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="nickname"
								class="label"
							>{{ $t('modal.profile.fields.nickname.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="nickname"
										v-model="editedUser.nickname"
										type="text"
										name="nickname"
										class="input"
										required
										autocomplete="username"
									>
								</div>
							</div>
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
							<div class="field">
								<div class="control">
									<input
										id="email"
										v-model="editedUser.email"
										type="email"
										name="email"
										class="input"
										required
										:placeholder="$t('modal.profile.fields.email.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="url"
								class="label"
							>{{ $t('modal.profile.fields.url.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="url"
										v-model="editedUser.url"
										type="url"
										name="url"
										class="input"
										:placeholder="$t('modal.profile.fields.url.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="bio"
								class="label"
							>{{ $t('modal.profile.fields.bio.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="bio"
										v-model="editedUser.bio"
										type="text"
										name="bio"
										class="input"
										:placeholder="$t('modal.profile.fields.bio.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.profile.fields.location.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<div class="select">
										<o-autocomplete
											v-model="location"
											keep-first
											open-on-focus
											:data="getListCountries"
											@select="(option: string) => editedUser.location = getCountryCode(option, locale)"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="editedUser.social_networks"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label
								for="discord"
								class="label"
							>{{ $t('modal.profile.fields.discord.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="discord"
										v-model="editedUser.social_networks.discord"
										type="text"
										name="discord"
										class="input"
										pattern="[^@#:`]{2,32}#[0-9]{4}|[A-Za-z0-9_.]{2,32}"
										:placeholder="$t('modal.profile.fields.discord.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="editedUser.social_networks"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label
								for="mastodon"
								class="label"
							>{{ $t('modal.profile.fields.mastodon.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="mastodon"
										v-model="editedUser.social_networks.mastodon"
										type="text"
										name="mastodon"
										class="input"
										pattern="^[a-zA-Z0-9.!#$%&'*+\/=?^_`\{\|\}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$"
										:placeholder="$t('modal.profile.fields.mastodon.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="editedUser.social_networks"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label
								for="bluesky"
								class="label"
							>{{ $t('modal.profile.fields.bluesky.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="mastodon"
										v-model="editedUser.social_networks.bluesky"
										type="text"
										name="bluesky"
										class="input"
										pattern="^[a-zA-Z0-9.!#$%&'*+\/=?^_`\{\|\}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$"
										:placeholder="$t('modal.profile.fields.bluesky.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="editedUser.social_networks"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label
								for="instagram"
								class="label"
							>{{ $t('modal.profile.fields.instagram.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="instagram"
										v-model="editedUser.social_networks.instagram"
										type="text"
										name="instagram"
										class="input"
										pattern="[A-Za-z0-9_.]{1,30}"
										:placeholder="$t('modal.profile.fields.instagram.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="editedUser.social_networks"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label
								for="twitch"
								class="label"
							>{{ $t('modal.profile.fields.twitch.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="twitch"
										v-model="editedUser.social_networks.twitch"
										type="text"
										name="twitch"
										class="input"
										pattern="[A-Za-z0-9_]{4,25}"
										:placeholder="$t('modal.profile.fields.twitch.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="editedUser.social_networks"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label
								for="myanimelist"
								class="label"
							>{{ $t('modal.profile.fields.myanimelist.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="myanimelist"
										v-model="editedUser.social_networks.myanimelist"
										type="text"
										name="myanimelist"
										class="input"
										pattern="[A-Za-z0-9_\-]{2,16}"
										:placeholder="$t('modal.profile.fields.myanimelist.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="editedUser.social_networks"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label
								for="anilist"
								class="label"
							>{{ $t('modal.profile.fields.anilist.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="anilist"
										v-model="editedUser.social_networks.anilist"
										type="text"
										name="anilist"
										class="input"
										pattern="[a-zA-Z0-9]{2,20}"
										:placeholder="$t('modal.profile.fields.anilist.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="editedUser.social_networks"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label
								for="kitsu"
								class="label"
							>{{ $t('modal.profile.fields.kitsu.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="kitsu"
										v-model="editedUser.social_networks.kitsu"
										type="text"
										name="kitsu"
										class="input"
										:placeholder="$t('modal.profile.fields.kitsu.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="editedUser.social_networks"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label
								for="gitlab"
								class="label"
							>{{ $t('modal.profile.fields.gitlab.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="gitlab"
										v-model="editedUser.social_networks.gitlab"
										type="text"
										name="gitlab"
										class="input"
										:placeholder="$t('modal.profile.fields.gitlab.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="anime_list_to_fetch"
								class="label"
							>{{ $t('modal.profile.fields.anime_list_to_fetch.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<div class="select">
										<select
											id="anime_list_to_fetch"
											v-model="editedUser.anime_list_to_fetch"
											name="anime_list_to_fetch"
											autocomplete="off"
										>
											<option value="myanimelist">
												MyAnimeList
											</option>
											<option value="anilist">
												AniList
											</option>
											<option value="kitsu">
												Kitsu
											</option>
										</select>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<span class="label">{{ $t('modal.profile.fields.banner.label') }}</span>
						</div>
						<div class="field-body flex-column">
							<img
								:src="editedUser.banner?.startsWith('data:') ? editedUser.banner: `${url.origin}/banners/${editedUser.banner}`"
								alt="User banner"
								class="banner"
							>
							<button
								class="button is-info"
								:class="{'is-loading': loading}"
								:disabled="loading || editedUser.banner === 'default.jpg'"
								@click.prevent="restoreDefaultBanner"
							>
								<font-awesome-icon
									:icon="['fas', 'history']"
									fixed-width
								/> {{ $t('modal.profile.fields.banner.remove') }}
							</button>
							<label
								for="banner"
								class="button is-yellow"
								:disabled="!user.roles?.donator && !user.roles?.admin ? true: undefined"
							>
								<input
									id="banner"
									:disabled="!user.roles?.donator && !user.roles?.admin"
									type="file"
									accept="image/jpg, image/jpeg, image/png"
									@change="openCropModal"
								>
								<font-awesome-icon
									:icon="['fas', 'file-import']"
									:fixed-width="true"
								/>
								{{ $t('modal.profile.fields.banner.upload') }}
							</label>
							<div
								v-if="editedUser.roles?.donator"
								class="has-text-white"
							>
								<font-awesome-icon
									:icon="['fas', 'heart']"
									fixed-width
								/> {{ $t('modal.profile.fields.banner.donator') }}
							</div>
							<div
								v-else
								class="has-text-white"
							>
								<font-awesome-icon
									:icon="['fas', 'search']"
									fixed-width
								/> {{ $t('modal.profile.fields.banner.change') }}
							</div>
						</div>
					</div>
					<h2 class="subtitle">
						<font-awesome-icon
							:icon="['fas', 'user-lock']"
							fixed-width
						/> {{ $t('modal.profile.headers.privacy') }}
					</h2>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.profile.fields.flag_public.label') }}</label>
						</div>
						<div class="field-body flex-column">
							<div class="has-text-white">
								{{ $t('modal.profile.fields.flag_public.desc') }}
							</div>
							<label
								for="public"
								class="field"
							>
								<input
									id="public"
									v-model="editedUser.flag_public"
									type="checkbox"
								>
								{{ $t('modal.profile.fields.flag_public.checkbox') }}
							</label>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.profile.fields.flag_contributor_emails.label') }}</label>
						</div>
						<div class="field-body flex-column">
							<div class="has-text-white">
								{{ $t('modal.profile.fields.flag_contributor_emails.desc') }}
							</div>
							<label
								for="favorites"
								class="field"
							>
								<input
									id="favorites"
									v-model="editedUser.flag_contributor_emails"
									type="checkbox"
								>
								{{ $t('modal.profile.fields.flag_contributor_emails.checkbox') }}
							</label>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.profile.fields.flag_displayfavorites.label') }}</label>
						</div>
						<div class="field-body flex-column">
							<div class="has-text-white">
								{{ $t('modal.profile.fields.flag_displayfavorites.desc') }}
							</div>
							<label
								for="favorites"
								class="field"
							>
								<input
									id="favorites"
									v-model="editedUser.flag_displayfavorites"
									type="checkbox"
									:disabled="!editedUser.flag_public"
								>
								{{ $t('modal.profile.fields.flag_displayfavorites.checkbox') }}
							</label>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.profile.fields.flag_sendstats.label') }}</label>
						</div>
						<div class="field-body flex-column">
							<div class="has-text-white">
								{{ $t('modal.stats.desc') }}
							</div>
							<div class="has-text-white">
								{{ $t('modal.stats.refuse_desc') }}
							</div>
							<label
								for="sendstats"
								class="field"
							>
								<input
									id="sendstats"
									v-model="editedUser.flag_sendstats"
									type="checkbox"
								>
								{{ $t('modal.profile.fields.flag_sendstats.checkbox') }}
							</label>
						</div>
					</div>
					<h2 class="subtitle">
						<font-awesome-icon
							:icon="['fas', 'globe']"
							fixed-width
						/> {{ $t('modal.profile.headers.lang') }}
					</h2>
					<div class="field is-horizontal">
						<div class="field-label is-normal long">
							<label class="label">{{ $t('modal.profile.fields.lang_prefs.main_song_name_lang') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<div class="select">
										<o-autocomplete
											v-model="main_series_lang_name"
											keep-first
											open-on-focus
											:data="getListLangsMain"
											@select="(option:string) => editedUser.main_series_lang = get3BCode(option, locale)"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal long">
							<label
								class="label"
							>{{ $t('modal.profile.fields.lang_prefs.fallback_song_name_lang') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<div class="select">
										<o-autocomplete
											v-model="fallback_series_lang_name"
											keep-first
											open-on-focus
											:data="getListLangsFallback"
											@select="(option:string) => editedUser.fallback_series_lang = get3BCode(option, locale)"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<h2 class="subtitle">
						<font-awesome-icon
							:icon="['fas', 'key']"
							fixed-width
						/> {{ $t('modal.profile.headers.password') }}
					</h2>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="password"
								class="label"
							>{{ $t('modal.profile.fields.password.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="password"
										v-model="editedUser.password"
										type="password"
										name="password"
										class="input"
										:placeholder="$t('modal.profile.fields.password.placeholder')"
										autocomplete="new-password"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="password_confirmation"
								class="label"
							>{{ $t('modal.profile.fields.password_confirmation.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="password_confirmation"
										v-model="editedUser.password_confirmation"
										type="password"
										name="password_confirmation"
										class="input"
										:placeholder="$t('modal.profile.fields.password_confirmation.placeholder')"
										autocomplete="new-password"
									>
									<p
										v-if="passwordNotEquals"
										class="help is-danger"
									>
										{{ $t('modal.profile.passwords_mismatch') }}
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>
				<footer class="modal-card-foot">
					<button
						type="button"
						class="button is-danger"
						@click.prevent="openDeleteAccountModal"
					>
						{{ $t('modal.profile.delete') }}
					</button>
					<button
						class="button is-success"
						:class="{'is-loading': loading}"
						:disabled="passwordNotEquals"
						type="submit"
					>
						{{ $t('modal.profile.submit') }}
					</button>
				</footer>
			</div>
		</form>
		<crop-modal
			:image="image"
			:active="!!crop_modal"
			:ratio="crop_modal === 'banner' ? 16/9:1"
			@close="crop_modal=undefined"
			@upload="uploadImage"
		/>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import _ from 'lodash';

	import type { DBUser } from '%/lib/types/database/user';
	import { useModalStore } from '~/store/modal';
	import { useAuthStore } from '~/store/auth';

	interface DBUserEdit extends DBUser {
		password_confirmation?: string
	}

	const props = defineProps<{
		active: boolean
	}>();

	const emit = defineEmits<{ (e: 'close'): void }>();

	const { user } = storeToRefs(useAuthStore());
	const { setToken } = useAuthStore();
	const { openModal } = useModalStore();
	const url = useRequestURL();

	const { locale } = useI18n();

	const location = ref('');
	const main_series_lang_name = ref('');
	const fallback_series_lang_name = ref('');
	const loading = ref(false);
	const crop_modal = ref<'avatar' | 'banner'>();
	const image = ref('');
	const editedUser = ref<DBUserEdit>({
		login: '',
		nickname: '',
		password: '',
		password_confirmation: '',
		bio: '',
		email: '',
		main_series_lang: '',
		fallback_series_lang: '',
		url: '',
		avatar_file: '',
		flag_sendstats: undefined,
		flag_public: undefined,
		flag_displayfavorites: undefined,
		banner: 'default.jpg',
		social_networks: {
			twitch: '',
			discord: '',
			mastodon: '',
			instagram: '',
			gitlab: '',
		},
		roles: {
			user: true
		}
	});

	const getListLangsMain = computed(() => listLangs(main_series_lang_name.value || '', locale.value));
	const getListLangsFallback = computed(() => listLangs(fallback_series_lang_name.value || '', locale.value));
	const passwordNotEquals = computed(() => editedUser.value.password !== editedUser.value?.password_confirmation);
	const getListCountries = computed(() => listCountries(location.value, locale.value));

	watch(() => props.active, (now) => {
		if(now) getUser();
	});

	getUser();

	function getUser(): void {
		if (user?.value) {
			editedUser.value = _.cloneDeep(user?.value);
			if (user?.value.location) {
				location.value = getCountriesInLocaleFromCode(user?.value.location, locale.value);
			}
			if (user?.value.main_series_lang) {
				main_series_lang_name.value = getLanguagesInLocaleFromCode(user?.value.main_series_lang, locale.value) as string;
			}
			if (user?.value.fallback_series_lang) {
				fallback_series_lang_name.value = getLanguagesInLocaleFromCode(user?.value.fallback_series_lang, locale.value) as string;
			}
			if (!editedUser.value.social_networks) {
				editedUser.value.social_networks = {
					twitch: '',
					discord: '',
					mastodon: '',
					instagram: '',
					gitlab: '',
				};
			}
		}
	}
	async function submitForm(): Promise<void> {
		if (!editedUser.value.social_networks || (!editedUser.value.social_networks.anilist && !editedUser.value.social_networks.myanimelist && !editedUser.value.social_networks.kitsu)) {
			editedUser.value.anime_list_to_fetch = undefined;
		} else if (editedUser.value.social_networks.anilist && !editedUser.value.social_networks.myanimelist && !editedUser.value.social_networks.kitsu) {
			editedUser.value.anime_list_to_fetch = 'anilist';
		} else if (!editedUser.value.social_networks.anilist && editedUser.value.social_networks.myanimelist && !editedUser.value.social_networks.kitsu) {
			editedUser.value.anime_list_to_fetch = 'myanimelist';
		} else if (!editedUser.value.social_networks.anilist && !editedUser.value.social_networks.myanimelist && editedUser.value.social_networks.kitsu) {
			editedUser.value.anime_list_to_fetch = 'kitsu';
		}
		loading.value = true;
		await useCustomFetch<{data: {token: string}}>('/api/myaccount', {
			method: 'PATCH',
			body: {
				...editedUser.value, avatar_file: undefined, roles: undefined, banner: undefined, password_confirmation: undefined
			}
		}).then(async (response) => {
			// Refresh auth
			await setToken(response.data.token);
			closeModal();
		}).finally(() => {
			loading.value = false;
		});
	}
	function closeModal(): void {
		emit('close');
	}
	function openDeleteAccountModal() {
		openModal('deleteAccount');
		closeModal();
	}
	function openCropModal(e:any) {
		if (e.target.files?.length > 0) {
			const reader = new FileReader();
			reader.onload = (re) => {
				image.value = re.target?.result as string;
				crop_modal.value = e.target.id;
			};
			reader.readAsDataURL(e.target.files[0]);
		}
	}
	async function uploadImage(blob:string|undefined): Promise<void> {
		if (blob) {
			const type = crop_modal.value;
			const file = new File(
				[await (await fetch(blob)).blob()],
				`${type}${Math.floor(Math.random() * 10000)}.${(/data:([a-z]+)\/([a-z]+)[,;]/.exec(blob) as RegExpMatchArray)[2]}`
			);
			if (type === 'avatar') {
				editedUser.value.avatar_file = blob;
			} else if (type === 'banner') {
				editedUser.value.banner = blob;
			}
			crop_modal.value = undefined;
			const form = new FormData();
			form.set(`${type}file`, file);
			loading.value = true;
			await useCustomFetch<{data: {token: string}}>('/api/myaccount', {
				method: 'PATCH',
				body: form
			}).then(async (response) => {
				// Refresh auth
				await setToken(response.data.token);
			}).finally(() => {
				loading.value = false;
			});
		}
	}
	function restoreDefaultBanner() {
		if (loading.value) { return; }
		loading.value = true;
		useCustomFetch<{data: {token: string}}>('/api/myaccount', {
			method: 'PATCH',
			body: {
				banner: 'default.jpg'
			}
		}).then(async (response) => {
			// Refresh auth
			await setToken(response.data.token);
			editedUser.value.banner = 'default.jpg';
		}).finally(() => {
			loading.value = false;
		});
	}
</script>

<style lang="scss" scoped>
	.field-body {
		flex-grow: 4;
	}

	.is-active {
		color: #1dd2af;
	}

	h2.subtitle {
		font-weight: bold;
		margin-top: 2rem;
	}

	.select select option {
		color: #dbdee0;
	}

	#avatar, #banner {
		display: none
	}

	.field-body.flex-column {
		flex-direction: column;
		> * {
			margin-bottom: 8px;
		}
	}

	.profile-pic-box {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1em;
		.img {
			max-height: 6rem;
			width: auto;
			border-radius: 8px;
			margin-right: 1em;
		}
		.data {
			.badges {
				padding-bottom: .5em;
			}
			.login {
				font-size: 2rem;
				color: white;
			}
		}
	}

	.field[for="sendstats"], .field[for="public"], .field[for="favorites"] {
		color: white;
		user-select: none;
	}

	.banner {
		border-radius: 8px;
	}

	.modal-card-foot {
		justify-content: space-between;
	}

	.field-label.long {
		flex-basis: 45%;
	}
	
	@media screen and (max-width: 768px) {
		.modal {
			align-items: stretch;

			.modal-card {
				width: calc(100vw - 0.5em);
				margin: 0 0.25em;
			}
		}
	}
</style>
