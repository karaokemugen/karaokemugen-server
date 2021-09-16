<template>
	<div class="modal" :class="{'is-active': active}">
		<form v-if="!modal.avatar" action="#" @submit.prevent="submitForm">
			<div class="modal-background" @click="closeModal" />
			<div class="modal-card">
				<header>
					<div class="modal-card-head">
						<h1 class="modal-card-title">
							{{ $t('modal.profile.title') }}
						</h1>
						<a class="delete" aria-label="close" @click="closeModal" />
					</div>
				</header>
				<section v-if="mode === 'general'" class="modal-card-body">
					<div class="profile-pic-box">
						<img
							v-if="user.avatar_file"
							alt="Profile Picture"
							class="img"
							:src="user.avatar_file.startsWith('data:') ? user.avatar_file : `/avatars/${user.avatar_file}`"
						>
						<div class="data">
							<span class="login">{{ `${user.login}@${apiHost}` }}</span>
							<br>
							<label
								for="avatar"
								class="button"
							>
								<input id="avatar" type="file" accept="image/*" @change="openCropAvatarModal">
								<font-awesome-icon :icon="['fas', 'portrait']" :fixed-width="true" />
								{{ $t('modal.profile.select_avatar') }}
							</label>
						</div>
					</div>
					<h2 class="subtitle">
						<font-awesome-icon :icon="['fas', 'user']" fixed-width /> {{ $t('modal.profile.headers.profile') }}
					</h2>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="nickname" class="label">{{ $t('modal.profile.fields.nickname.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="nickname"
										v-model="user.nickname"
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
							<label for="email" class="label">{{ $t('modal.profile.fields.email.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="email"
										v-model="user.email"
										type="text"
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
							<label for="url" class="label">{{ $t('modal.profile.fields.url.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="url"
										v-model="user.url"
										type="text"
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
							<label for="bio" class="label">{{ $t('modal.profile.fields.bio.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="bio"
										v-model="user.bio"
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
										<b-autocomplete
											v-model="location"
											keep-first
											open-on-focus
											:data="getListCountries"
											@select="option => user.location = getCountryCode(option)"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="discord" class="label">{{ $t('modal.profile.fields.discord.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="discord"
										v-model="user.social_networks.discord"
										type="text"
										name="discord"
										class="input"
										pattern="[^@#:`]{2,32}#[0-9]{4}"
										:placeholder="$t('modal.profile.fields.discord.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="twitter" class="label">{{ $t('modal.profile.fields.twitter.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="twitter"
										v-model="user.social_networks.twitter"
										type="text"
										name="twitter"
										class="input"
										pattern="[A-Za-z0-9_]{1,15}"
										:placeholder="$t('modal.profile.fields.twitter.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="instagram" class="label">{{ $t('modal.profile.fields.instagram.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="instagram"
										v-model="user.social_networks.instagram"
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
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="twitch" class="label">{{ $t('modal.profile.fields.twitch.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="twitch"
										v-model="user.social_networks.twitch"
										type="text"
										name="twitch"
										class="input"
										pattern="[A-Za-z0-9]{4,25}"
										:placeholder="$t('modal.profile.fields.twitch.placeholder')"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<span class="label">Bannière</span>
						</div>
						<div class="field-body flex-column">
							<img
								:src="'/banners/' + user.banner"
								alt="User banner"
								class="banner"
							>
							<button
								class="button is-info"
								:class="{'is-loading': loading}"
								:disabled="loading || user.banner === 'default.jpg'"
								@click.prevent="restoreDefaultBanner"
							>
								<font-awesome-icon :icon="['fas', 'history']" fixed-width /> {{ $t('modal.profile.fields.banner.remove') }}
							</button>
							<div class="has-text-white">
								<font-awesome-icon :icon="['fas', 'search']" fixed-width /> {{ $t('modal.profile.fields.banner.change') }}
							</div>
						</div>
					</div>
					<h2 class="subtitle">
						<font-awesome-icon :icon="['fas', 'user-lock']" fixed-width /> {{ $t('modal.profile.headers.privacy') }}
					</h2>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.profile.fields.flag_public.label') }}</label>
						</div>
						<div class="field-body flex-column">
							<div class="has-text-white">
								{{ $t('modal.profile.fields.flag_public.desc') }}
							</div>
							<label for="public" class="field">
								<input
									v-model="user.flag_public"
									id="public"
									type="checkbox"
								>
								{{ $t('modal.profile.fields.flag_public.checkbox') }}
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
							<label for="favorites" class="field">
								<input
									v-model="user.flag_displayfavorites"
									id="favorites"
									type="checkbox"
									:disabled="!user.flag_public"
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
							<label for="sendstats" class="field">
								<input
									v-model="user.flag_sendstats"
									id="sendstats"
									type="checkbox"
								>
								{{ $t('modal.profile.fields.flag_sendstats.checkbox') }}
							</label>
						</div>
					</div>
					<h2 class="subtitle">
						<font-awesome-icon :icon="['fas', 'globe']" fixed-width /> {{ $t('modal.profile.headers.lang') }}
					</h2>
					<div class="field is-horizontal">
						<div class="field-label is-normal long">
							<label class="label">{{ $t('modal.profile.fields.lang_prefs.main_song_name_lang') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<div class="select">
										<b-autocomplete
											v-model="main_series_lang_name"
											keep-first
											open-on-focus
											:data="getListLangsMain"
											@select="option => user.main_series_lang = get3BCode(option)"
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
										<b-autocomplete
											v-model="fallback_series_lang_name"
											keep-first
											open-on-focus
											:data="getListLangsFallback"
											@select="option => user.fallback_series_lang = get3BCode(option)"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<h2 class="subtitle">
						<font-awesome-icon :icon="['fas', 'key']" fixed-width /> {{ $t('modal.profile.headers.password') }}
					</h2>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="password" class="label">{{ $t('modal.profile.fields.password.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="password"
										v-model="user.password"
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
										v-model="user.password_confirmation"
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
		<crop-avatar-modal :avatar="avatar" :active="modal.avatar" @close="modal.avatar=false" @uploadAvatar="uploadAvatar" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import clonedeep from 'lodash.clonedeep';
	import languages from '@karaokemugen/i18n-iso-languages';
	import isoCountriesLanguages from 'iso-countries-languages';

	import CropAvatarModal from './CropAvatarModal.vue';
	import { DBUser } from '%/lib/types/database/user';
	import { modalStore } from '~/store';

	languages.registerLocale(require('@karaokemugen/i18n-iso-languages/langs/en.json'));
	languages.registerLocale(require('@karaokemugen/i18n-iso-languages/langs/fr.json'));

	interface DBUserEdit extends DBUser {
		password_confirmation?: string
	}

	interface VState {
		apiHost?: string,
		user: DBUserEdit,
		location: string
		main_series_lang_name: string,
		fallback_series_lang_name: string,
		mode: 'general' | 'series',
		loading: boolean,
		modal: {
			avatar: boolean
		},
		avatar: string
	}

	export default Vue.extend({
		name: 'ProfileModal',

		components: {
			CropAvatarModal
		},

		props: {
			active: {
				type: Boolean,
				required: true
			}
		},

		data(): VState {
			return {
				apiHost: process.env.API_HOST,
				user: {
					login: '',
					nickname: '',
					password: '',
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
						twitter: '',
						instagram: ''
					}
				},
				location: '',
				main_series_lang_name: '',
				fallback_series_lang_name: '',
				mode: 'general',
				loading: false,
				modal: {
					avatar: false
				},
				avatar: ''
			};
		},

		computed: {
			getListLangsMain(): string[] {
				return this.listLangs(this.main_series_lang_name || '');
			},
			getListLangsFallback(): string[] {
				return this.listLangs(this.fallback_series_lang_name || '');
			},
			storeUser(): DBUserEdit {
				return this.$store.state.auth.user as unknown as DBUserEdit;
			},
			passwordNotEquals(): boolean {
				return this.user.password !== this.user?.password_confirmation;
			},
			getListCountries(): string[] {
				return this.listCountries(this.location);
			}
		},

		watch: {
			active(now, _old) {
				if (now) {
					this.getUser();
				}
			}
		},

		mounted() {
			this.getUser();
		},

		methods: {
			listCountries(name: string): string[] {
				const listCountries: string[] = [];
				for (const [_key, value] of Object.entries(isoCountriesLanguages.getCountries(this.$i18n.locale))) {
					listCountries.push(value as string);
				}
				return listCountries.filter(value =>
					value.toLowerCase().includes(name.toLowerCase()));
			},
			getCountryCode(name:string): string | undefined {
				for (const [key, value] of Object.entries(isoCountriesLanguages.getCountries(this.$i18n.locale))) {
					if (value === name) {
						return key;
					}
				}
				return undefined;
			},
			getCountryName(code:string): string | undefined {
				for (const [key, value] of Object.entries(isoCountriesLanguages.getCountries(this.$i18n.locale))) {
					if (key === code) {
						return value as string;
					}
				}
				return undefined;
			},
			listLangs(name: string): string[] {
				const listLangs = [];
				for (const [_key, value] of Object.entries(
					languages.getNames(this.$i18n.locale)
				)) {
					listLangs.push(value);
				}
				return listLangs.filter(value =>
					value.toLowerCase().includes(name.toLowerCase())
				);
			},
			get3BCode(language: string): string {
				return languages.getAlpha3BCode(
					language, this.$i18n.locale
				) as string;
			},
			getUser(): void {
				if (this.storeUser) {
					this.user = clonedeep(this.storeUser);
					if (this.storeUser.location) {
						this.location = this.getCountryName(this.storeUser.location) as string;
					}
				}
			},
			async submitForm(): Promise<void> {
				this.loading = true;
				await this.$axios.patch('/api/myaccount', {
					...this.user, avatar_file: undefined, type: undefined
				}).then(async (response) => {
					// Refresh auth
					await this.$auth.setUserToken(response.data.data.token);
					this.closeModal();
				}).finally(() => {
					this.loading = false;
				});
			},
			closeModal(): void {
				this.$emit('close');
			},
			openDeleteAccountModal() {
				modalStore.openModal('deleteAccount');
				this.closeModal();
			},
			openCropAvatarModal(e:any) {
				if (e.target.files?.length > 0) {
					const reader = new FileReader();
					reader.onload = (e) => {
						this.avatar = e.target?.result as string;
						this.modal.avatar = true;
					};
					reader.readAsDataURL(e.target.files[0]);
				}
			},
			async uploadAvatar(avatar:string): Promise<void> {
				const file = new File(
					[await (await fetch(avatar)).blob()],
					`avatar.${(/data:([a-z]+)\/([a-z]+)[,;]/.exec(avatar) as RegExpMatchArray)[2]}`
				);
				this.user.avatar_file = avatar;
				this.modal.avatar = false;
				const form = new FormData();
				form.set('avatarfile', file);
				this.loading = true;
				await this.$axios.patch('/api/myaccount', form, {
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				}).then(async (response) => {
					// Refresh auth
					await this.$auth.setUserToken(response.data.data.token);
				}).finally(() => {
					this.loading = false;
				});
			},
			restoreDefaultBanner() {
				if (this.loading) { return; }
				this.loading = true;
				this.$axios.$patch('/api/myaccount', {
					banner: 'default.jpg'
				}).then(async (response) => {
					// Refresh auth
					await this.$auth.setUserToken(response.data.token);
					this.user.banner = 'default.jpg';
				}).finally(() => {
					this.loading = false;
				});
			}
		}
	});
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
		color: white;
	}

	#avatar {
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
</style>
