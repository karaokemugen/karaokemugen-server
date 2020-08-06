<template>
	<div class="modal" :class="{'is-active': active}">
		<form action="#" @submit.prevent="submitForm">
			<div class="modal-background" @click="closeModal" />
			<div class="modal-card">
				<header>
					<div class="modal-card-head">
						<a
							class="modal-card-title"
							:class="{'is-active' : mode === 'login' }"
							@click="mode='login'"
						>{{ $t('modal.login.title') }}</a>
						<a
							class="modal-card-title"
							:class="{'is-active' : mode === 'signup' }"
							@click="mode='signup'"
						>{{ $t('modal.signup.title') }}</a>
						<a class="delete" aria-label="close" @click="closeModal" />
					</div>
				</header>
				<section v-if="mode === 'login'" class="modal-card-body">
					<h5 class="title is-5">
						{{ $t('modal.login.subtitle') }}
					</h5>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="title" class="label">{{ $t('modal.login.fields.username.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field has-addons">
								<div class="control">
									<input
										id="title"
										v-model="login.username"
										type="text"
										name="title"
										class="input"
										required
										:placeholder="$t('modal.login.fields.username.placeholder')"
										autocomplete="username"
									>
								</div>
								<div class="control is-expanded">
									<div class="button is-static">
										{{ `@${apiHost}` }}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="password" class="label">{{ $t('modal.login.fields.password.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="password"
										v-model="login.password"
										type="password"
										name="password"
										class="input"
										required
										:placeholder="$t('modal.login.fields.password.placeholder')"
										autocomplete="current-password"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.login.fields.forgot_password.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<button
									class="button"
									type="button"
									@click="callForgetPasswordApi"
								>
									<font-awesome-icon :icon="['fas', 'lock']" :fixed-width="true"/>
								</button>
							</div>
						</div>
					</div>
				</section>
				<section v-if="mode === 'signup'" class="modal-card-body">
					<h5 class="title is-5">
						{{ $t('modal.signup.subtitle') }}
					</h5>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="title" class="label">{{ $t('modal.signup.fields.username.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field has-addons">
								<div class="control">
									<input
										id="title"
										v-model="login.username"
										type="text"
										name="title"
										class="input"
										required
										:placeholder="$t('modal.signup.fields.username.placeholder')"
										autocomplete="username"
									>
								</div>
								<div class="control is-expanded">
									<div class="button is-static">
										{{ `@${apiHost}` }}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="password" class="label">{{ $t('modal.signup.fields.password.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="password"
										v-model="login.password"
										type="password"
										name="password"
										class="input"
										required
										:placeholder="$t('modal.signup.fields.password.placeholder')"
										autocomplete="current-password"
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
							>{{ $t('modal.signup.fields.password_confirmation.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="password_confirmation"
										v-model="login.password_confirmation"
										type="password"
										name="password_confirmation"
										class="input"
										required
										:placeholder="$t('modal.signup.fields.password_confirmation.placeholder')"
										autocomplete="current-password"
									>
								</div>
								<p
									v-if="passwordNotEquals()"
									class="help is-danger"
								>
									{{ $t('modal.signup.passwords_mismatch') }}
								</p>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="title" class="label">{{ $t('modal.signup.fields.email.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="title"
										v-model="login.email"
										type="text"
										name="title"
										class="input"
										required
										:placeholder="$t('modal.signup.fields.email.placeholder')"
										autocomplete="email"
									>
								</div>
							</div>
						</div>
					</div>
				</section>
				<footer class="modal-card-foot">
					<button
						class="button is-success"
						:class="{'is-loading': loading}"
						:disabled="passwordNotEquals()"
						type="submit"
					>
						{{ $t(mode === 'login' ? 'modal.login.submit' : 'modal.signup.submit') }}
					</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';

	interface VState {
		apiHost?: string,
		login: {
			username: string,
			password: string,
			password_confirmation?: string,
			login?: string
		},
		mode: 'login' | 'signup',
		loading: boolean
	}

	export default Vue.extend({
		name: 'LoginModal',

		props: ['active'],

		data(): VState {
			return {
				apiHost: process.env.API_HOST,
				login: {
					username: '',
					password: ''
				},
				mode: 'login',
				loading: false
			};
		},

		methods: {
			passwordNotEquals() {
				return (
					this.mode === 'signup' &&
					this.login.password_confirmation &&
					this.login.password !== this.login.password_confirmation
				);
			},
			async submitForm() {
				this.loading = true;
				if (this.mode === 'signup') {
					const signup = this.login;
					signup.login = this.login.username;
					await this.$axios.post('/api/users', signup);
					this.loading = false;
					this.closeModal();
				}
				this.$auth.loginWith('local', { data: this.login }).then((_res) => {
					this.$emit('login');
					this.loading = false;
					this.closeModal();
				}).catch((err) => {
					console.error(err);
					this.loading = false;
				});
			},
			async callForgetPasswordApi () {
				if (this.login) {
					try {
						await this.$axios.post(`/users/${this.login.username}/resetpassword`);
						this.$toast.success(this.$t('modal.login.fields.forgot_password.success') as string);
					} catch (e) {
						this.$toast.error(this.$t('modal.login.fields.forgot_password.error') as string);
					}
				}
			},
			closeModal() {
				this.$emit('close');
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

	.control.is-expanded .button {
		width: 100%;
	}
</style>
