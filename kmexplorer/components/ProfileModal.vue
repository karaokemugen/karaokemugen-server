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
					<img v-if="user.avatar_file" :src="`/avatars/${user.avatar_file}`">
					<button
						type="button"
						class="button"
						@click="modal.avatar=true"
					>
						{{ $t('modal.profile.select_avatar') }}
					</button>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.profile.fields.username.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field has-addons">
								<div class="control">
									<div class="button is-static">
										{{ user.login }}
									</div>
								</div>
								<div class="control">
									<div class="button is-static">
										{{ `@${apiHost}` }}
									</div>
								</div>
							</div>
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
		<crop-avatar-modal :user="user" :active="modal.avatar" @close="modal.avatar=false" @uploadAvatar="uploadAvatar" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import languages from '@cospired/i18n-iso-languages';

	import { DBUser } from '%/lib/types/database/user';
	import { modalStore } from '~/store';
	import CropAvatarModal from './CropAvatarModal.vue';

	languages.registerLocale(require('@cospired/i18n-iso-languages/langs/en.json'));
	languages.registerLocale(require('@cospired/i18n-iso-languages/langs/fr.json'));

	interface DBUserEdit extends DBUser {
		password_confirmation?: string
	}

	interface VState {
		apiHost?: string,
		user: DBUserEdit,
		main_series_lang_name: string,
		fallback_series_lang_name: string,
		mode: 'general' | 'series',
		loading: boolean,
		modal: {
			avatar: boolean
		}
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
					avatar_file: ''
				},
				main_series_lang_name: '',
				fallback_series_lang_name: '',
				mode: 'general',
				loading: false,
				modal: {
					avatar: false
				}
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
			listLangs(name: string): string[] {
				const listLangs = [];
				for (const [_key, value] of Object.entries(
					languages.getNames(languages.alpha3BToAlpha2(this.$i18n.locale) as string)
				)) {
					listLangs.push(value);
				}
				return listLangs.filter(value =>
					value.toLowerCase().includes(name.toLowerCase())
				);
			},
			get3BCode(language: string): string {
				return languages.getAlpha3BCode(
					language,
					languages.alpha3BToAlpha2(this.$i18n.locale) as string
				) as string;
			},
			getUser(): void {
				if (this.storeUser) { this.user = { ...this.storeUser }; }
			},
			async submitForm(): Promise<void> {
				this.loading = true;
				const response = await this.$axios.put('/api/myaccount', this.user);
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
			uploadAvatar(file:string): void {
				console.log(file);
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
	}

	.select select option {
		color: white;
	}

	img {
		height: 10em;
	}
</style>
