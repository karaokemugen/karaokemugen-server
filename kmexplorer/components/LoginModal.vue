<template>
	<div class="modal is-active">
		<form action="#" @submit.prevent="submitForm">
			<div class="modal-background"></div>
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
							:class="{'is-active' : mode === 'signin' }"
							@click="mode='signin'"
						>{{ $t('modal.signin.title') }}</a>
						<a class="delete" aria-label="close" @click="closeModal"></a>
					</div>
				</header>
				<section class="modal-card-body" v-if="mode === 'login'">
					<h5 class="title is-5">{{ $t('modal.login.subtitle') }}</h5>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="title" class="label">{{ $t('modal.login.fields.username.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										type="text"
										name="title"
										id="title"
										class="input"
										required
										:placeholder="$t('modal.login.fields.username.placeholder')"
										autocomplete="username"
										v-model="login.username"
									/>
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
										type="password"
										name="password"
										id="password"
										class="input"
										required
										:placeholder="$t('modal.login.fields.password.placeholder')"
										autocomplete="current-password"
										v-model="login.password"
									/>
								</div>
							</div>
						</div>
					</div>
				</section>
				<section class="modal-card-body" v-if="mode === 'signin'">
					<h5 class="title is-5">{{ $t('modal.signin.subtitle') }}</h5>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="title" class="label">{{ $t('modal.signin.fields.username.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										type="text"
										name="title"
										id="title"
										class="input"
										required
										:placeholder="$t('modal.signin.fields.username.placeholder')"
										autocomplete="username"
										v-model="login.username"
									/>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="password" class="label">{{ $t('modal.signin.fields.password.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										type="password"
										name="password"
										id="password"
										class="input"
										required
										:placeholder="$t('modal.signin.fields.password.placeholder')"
										autocomplete="current-password"
										v-model="login.password"
									/>
								</div>
							</div>
						</div>
					</div>
				</section>
				<footer class="modal-card-foot">
					<button
						class="button is-success"
						:class="{'is-loading': loading}"
						type="submit"
						v-if="mode === 'login'"
					>{{ $t('modal.login.submit') }}</button>
					<button
						class="button is-success"
						:class="{'is-loading': loading}"
						type="submit"
						v-if="mode === 'signin'"
					>{{ $t('modal.signin.submit') }}</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
	name: "LoginModal",

	data() {
		return {
			login: {
				username: "",
				password: ""
			},
			mode: "login",
			loading: false
		};
	},

	methods: {
		submitForm() {
			this.loading = true;
			this.$auth.loginWith("local", { data: this.login }).then(res => {
				console.log(res);
				// Fetch user, its favorites
				/*const { data } = await this.$axios.get('/api/favorites');
                    let user = {name: res.username, favorites: data, role: res.role}
                    this.$auth.setUser(user);*/
				this.loading = false;
				this.closeModal();
			});
		},
		closeModal() {
			this.$emit("close");
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
</style>
