<template>
	<form
		action="#"
		@submit.prevent="submitForm"
	>
		<div class="modal-card">
			<section
				class="modal-card-body"
			>
				<h5 class="title is-5">
					{{ $t('modal.reset_password.description') }}
				</h5>
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
			</section>
			<footer class="modal-card-foot">
				<button
					class="button is-success"
					:class="{'is-loading': loading}"
					:disabled="formIsDisabled()"
					type="submit"
				>
					{{ $t('modal.reset_password.button') }}
				</button>
			</footer>
		</div>
	</form>
</template>

<script setup lang="ts">
	import type { TokenResponseWithRoles } from '~/../kmserver-core/src/lib/types/user';
	import { useModalStore } from '~/store/modal';

	const loading = ref(false);
	const login = ref<{
		password: string,
		password_confirmation: string,
	}>({
		password: '',
		password_confirmation: ''
	});

	const { params } = useRoute();
	const { closeAll } = useModalStore();

	closeAll();

	function passwordNotEquals() {
		return (
			login.value.password_confirmation !== '' &&
			login.value.password !== login.value.password_confirmation
		);
	}

	function formIsDisabled() {
		return (
			(login.value.password_confirmation === '' ||
				login.value.password !== login.value.password_confirmation)
		);
	}
	async function submitForm() {
		loading.value = true;
		await useCustomFetch<TokenResponseWithRoles>(`/api/users/${params.login}/resetpasswordaction`, {
			method: 'POST',
			body: {
				requestCode : params.code,
				newPassword : login.value.password
			}
		}).then(() => {
			resetForm();
		}).finally(() => {
			loading.value = false;
		});
	}
	function resetForm() {
		login.value = {
			password: '',
			password_confirmation: ''
		};
	}
</script>

<style lang="scss" scoped>
	.field-body {
		flex-grow: 4;
	}
</style>
