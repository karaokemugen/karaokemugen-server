<template>
	<div class="modal" :class="{'is-active': active}">
		<form v-if="!modal.avatar" action="#" @submit.prevent="submitForm">
			<div class="modal-background" @click="closeModal" />
			<div class="modal-card">
				<header>
					<div class="modal-card-head">
						<a
							class="modal-card-title"
							:class="{'is-active' : mode === 'general' }"
							@click="mode='general'"
						>{{ $t('modal.profile.title') }}</a>
						<a
							class="modal-card-title"
							:class="{'is-active' : mode === 'series' }"
							@click="mode='series'"
						>{{ $t('modal.profile.series_name.label') }}</a>
						<a class="delete" aria-label="close" @click="closeModal" />
					</div>
				</header>
				<section v-if="mode === 'general'" class="modal-card-body">
					<div class="profile-pic-box">
						<img v-if="user.avatar_file" class="img" :src="user.avatarfile ? user.avatar_file : `/avatars/${user.avatar_file}`">
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
						<label class="checkbox">
							<div class="control">
								<input
									v-model="user.flag_sendstats"
									type="checkbox"
								>
								{{ $t('modal.profile.fields.flag_sendstats.label') }}
							</div>
						</label>
					</div>
					<h2 class="subtitle">
						{{ $t('modal.profile.fields.password.header') }}
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
				<section v-if="mode === 'series'" class="modal-card-body">
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="series_lang_mode" class="label">{{ $t('modal.profile.series_name.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<div class="select">
										<select id="series_lang_mode" v-model="user.series_lang_mode">
											<option :value="-1">
												{{ $t('modal.profile.series_name.mode_no_pref') }}
											</option>
											<option :value="0">
												{{ $t('modal.profile.series_name.original_name') }}
											</option>
											<option :value="1">
												{{ $t('modal.profile.series_name.song_lang') }}
											</option>
											<option :value="2">
												{{ $t('modal.profile.series_name.mode_admin') }}
											</option>
											<option :value="3">
												{{ $t('modal.profile.series_name.user_lang') }}
											</option>
											<option :value="4">
												{{ $t('modal.profile.series_name.force_lang_series') }}
											</option>
										</select>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div v-if="user.series_lang_mode === 4" class="field is-horizontal">
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.profile.series_name.force_lang_series_main') }}</label>
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
					<div v-if="user.series_lang_mode === 4" class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								class="label"
							>{{ $t('modal.profile.series_name.force_lang_series_fallback') }}</label>
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
				</section>
				<footer class="modal-card-foot">
					<button
						class="button is-success"
						:class="{'is-loading': loading}"
						:disabled="passwordNotEquals"
						type="submit"
					>
						{{ $t('modal.profile.submit') }}
					</button>
					<button
						type="button"
						class="button is-danger"
						@click.prevent="openDeleteAccountModal"
					>
						{{ $t('modal.profile.delete') }}
					</button>
				</footer>
			</div>
		</form>
		<crop-avatar-modal :avatar="avatar" :active="modal.avatar" @close="modal.avatar=false" @uploadAvatar="uploadAvatar" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import languages from '@cospired/i18n-iso-languages';
	import isoCountriesLanguages from 'iso-countries-languages';

	import CropAvatarModal from './CropAvatarModal.vue';
	import { DBUser } from '%/lib/types/database/user';
	import { modalStore } from '~/store';

	languages.registerLocale(require('@cospired/i18n-iso-languages/langs/en.json'));
	languages.registerLocale(require('@cospired/i18n-iso-languages/langs/fr.json'));

	interface DBUserEdit extends DBUser {
		password_confirmation?: string
		avatarfile?: Blob
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
					series_lang_mode: -1,
					main_series_lang: '',
					fallback_series_lang: '',
					url: '',
					avatar_file: '',
					flag_sendstats: undefined
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
					this.user = { ...this.storeUser };
					if (this.storeUser.location) {
						this.location = this.getCountryName(this.storeUser.location) as string;
					}
				}
			},
			async submitForm(): Promise<void> {
				this.loading = true;
				// Create formData
				const formData = new FormData();
				for (const obj of Object.entries(this.user)) {
					// skip avatar_file and type
					if (obj[0] === 'avatar_file' || obj[0] === 'type') {
						continue;
					}
					// cast null values to an empty string
					if (obj[1] === null) {
						formData.set(obj[0], '');
					} else {
						formData.set(obj[0], obj[1] as (string|Blob));
					}
				}
				const response = await this.$axios.put('/api/myaccount', formData, {
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				});
				// Refresh auth
				await this.$auth.setUserToken(response.data.data.token);
				this.loading = false;
				this.closeModal();
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
				this.user.avatarfile = new File(
					[await (await fetch(avatar)).blob()],
					`avatar.${(/data:([a-z]+)\/([a-z]+)(?:,|;)/.exec(avatar) as RegExpMatchArray)[2]}`
				);
				this.user.avatar_file = avatar;
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

	img {
		height: 10em;
	}

	#avatar {
		display: none
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

	.field > .checkbox {
		color: white;
		.control {
			font-size: 1.15em;
		}
	}

	.modal-card-foot {
		justify-content: space-between;
	}
</style>