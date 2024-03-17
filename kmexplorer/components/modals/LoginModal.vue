<template>
	<div
		class="modal"
		:class="{'is-active': active}"
	>
		<form
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
						<nuxt-link
							class="modal-card-title"
							:class="{'is-active' : mode === 'login' }"
							@click="mode='login'"
						>
							{{ $t('modal.login.title') }}
						</nuxt-link>
						<nuxt-link
							class="modal-card-title"
							:class="{'is-active' : mode === 'signup' }"
							@click="mode='signup'"
						>
							{{ $t('modal.signup.title') }}
						</nuxt-link>
						<nuxt-link
							class="delete"
							aria-label="close"
							@click="closeModal"
						/>
					</div>
				</header>
				<section
					v-if="mode === 'login'"
					class="modal-card-body"
				>
					<h5 class="title is-5">
						{{ $t('modal.login.subtitle') }}
					</h5>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="title"
								class="label"
							>{{ $t('modal.login.fields.username.label') }}</label>
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
										{{ `@${instanceName}` }}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="password"
								class="label"
							>{{ $t('modal.login.fields.password.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="password_login"
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
									<font-awesome-icon
										:icon="['fas', 'lock']"
										:fixed-width="true"
									/>
								</button>
							</div>
						</div>
					</div>
				</section>
				<section
					v-if="mode === 'signup'"
					class="modal-card-body"
				>
					<h5 class="title is-5">
						{{ $t('modal.signup.subtitle') }}
					</h5>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="title"
								class="label"
							>{{ $t('modal.signup.fields.username.label') }}</label>
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
										{{ `@${instanceName}` }}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="password"
								class="label"
							>{{ $t('modal.signup.fields.password.label') }}</label>
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
							<label
								for="title"
								class="label"
							>{{ $t('modal.signup.fields.email.label') }}</label>
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
						:disabled="formIsDisabled()"
						type="submit"
					>
						{{ $t(mode === 'login' ? 'modal.login.submit' : 'modal.signup.submit') }}
					</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">
	import * as Toast from 'vue-toastification';
	import type { TokenResponseWithRoles } from '~/../kmserver-core/src/lib/types/user';
	import { useAuthStore } from '~/store/auth';

	// @ts-ignore
	const useToast = Toast.useToast ?? Toast.default.useToast;

	const props = defineProps<{
		active: boolean
	}>();

	const mode = ref<'login' | 'signup'>('login');
	const loading = ref(false);
	const login = ref<{
		username: string,
		password: string,
		password_confirmation: string,
		login?: string
		language?: string
		email?: string
	}>({
		username: '',
		password: '',
		password_confirmation: ''
	});

	const emit = defineEmits<{(e: 'close'|'login'): void}>();

	const { locale, t } = useI18n();
	const conf = useRuntimeConfig();
	const instanceName = conf.public.INSTANCE_NAME;
	const loginApi = useAuthStore().login;

	const toast = useToast();

	watch(() => props.active, (now) => {
		if(now) resetForm();
	});

	function passwordNotEquals() {
		return (
			mode.value === 'signup' &&
			login.value.password_confirmation !== '' &&
			login.value.password !== login.value.password_confirmation
		);
	}

	function formIsDisabled() {
		return (
			mode.value === 'signup' &&
			(login.value.password_confirmation === '' ||
				login.value.password !== login.value.password_confirmation)
		);
	}
	async function submitForm() {
		try {
			loading.value = true;
			if (mode.value === 'signup') {
				const signup = { ...login.value, password_confirmation: undefined };
				signup.login = login.value.username;
				signup.language = locale.value;
				await useCustomFetch('/api/users', {
					method: 'POST',
					body: signup
				});
			}
			const result = await useCustomFetch<TokenResponseWithRoles>('/api/auth/login', {
				method: 'POST',
				body: { ...login.value, password_confirmation: undefined }
			});
			await loginApi(result);
			emit('login');
			closeModal();
		} finally {
			loading.value = false;
		}
	}
	async function callForgetPasswordApi () {
		if (login.value) {
			try {
				await useCustomFetch(`/api/users/${login.value.username}/resetpassword`, {
					method: 'POST'
				}, false);
				toast.success(t('modal.login.fields.forgot_password.success'));
			} catch (e) {
				toast.error(t('modal.login.fields.forgot_password.error'), { icon: 'error' });
			}
		}
	}
	function closeModal() {
		emit('close');
	}
	function resetForm() {
		login.value = {
			username: '',
			password: '',
			password_confirmation: ''
		};
		mode.value = 'login';
	}
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

	.modal-card-head {
		padding: 0px;

		.modal-card-title {
			padding: 20px;
		}
		.delete {
			margin: 20px;
		}
	}
</style>
