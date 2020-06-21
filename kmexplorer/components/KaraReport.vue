<template>
	<div class="box">
		<h4 class="title is-4">{{ $t('kara.problem.title', {title: karaoke.title}) }}</h4>
		<button class="button is-warning" @click="toggleModal" :disabled="submitted">
			<font-awesome-icon :icon="['fas', 'meh']" />
			{{ $t('kara.problem.btn.report') }}
		</button>
		<nuxt-link :to="`/import/${karaoke.kid}`" class="button is-success">
			<font-awesome-icon :icon="['fas', 'pen']" />
			{{ $t('kara.problem.btn.edit') }}
		</nuxt-link>
		<!-- Report Modal -->
		<div class="modal" :class="{'is-active': modal}">
			<form action="#" @submit.prevent="submitProblem">
				<div class="modal-background"></div>
				<div class="modal-card">
					<header class="modal-card-head">
						<h4 class="modal-card-title">
							{{ $t('kara.problem.form.title') }}
						</h4>
						<a class="delete" aria-label="close" @click="toggleModal"></a>
					</header>
					<section class="modal-card-body" v-if="submitted">
						<i18n path="kara.problem.form.thanks.text" tag="h5" class="title is-5">
							<template v-slot:url>
								<a :href="gitlabUrl" target="_blank">
									{{ gitlabUrl }}
								</a>
							</template>
						</i18n>
					</section>
					<section class="modal-card-body" v-else>
						<h5 class="title is-5">{{ $t('kara.problem.form.subtitle') }}</h5>
						<div class="field is-horizontal">
							<div class="field-label is-normal">
								<label for="type" class="label">{{ $t('kara.problem.form.type.label') }}</label>
							</div>
							<div class="field-body">
								<div class="control">
									<div class="select">
										<select name="type" id="type" autocomplete="off" v-model="formData.type">
											<option value="time">{{ $t('kara.problem.form.type.time') }}</option>
											<option value="quality">{{ $t('kara.problem.form.type.quality') }}</option>
										</select>
									</div>
								</div>
							</div>
						</div>
						<div class="field is-horizontal">
							<div class="field-label is-normal">
								<label for="comment" class="label">{{ $t('kara.problem.form.comment.label') }}</label>
							</div>
							<div class="field-body">
								<div class="field">
									<div class="control">
										<input
											type="text"
											name="comment"
											id="comment"
											class="input"
											required
											:placeholder="$t('kara.problem.form.comment.placeholder')"
											autocomplete="off"
											v-model="formData.comment"
										/>
									</div>
								</div>
							</div>
						</div>
						<div class="field is-horizontal">
							<div class="field-label is-normal">
								<label for="comment" class="label">{{ $t('kara.problem.form.username.label') }}</label>
							</div>
							<div class="field-body">
								<div class="field">
									<div class="control">
										<input
											type="text"
											name="username"
											id="username"
											class="input"
											required
											:placeholder="$t('kara.problem.form.username.placeholder')"
											autocomplete="username"
											v-model="formData.username"
										/>
									</div>
								</div>
							</div>
						</div>
					</section>
					<footer class="modal-card-foot">
						<button
							class="button is-success"
							@click.prevent="toggleModal"
							v-if="submitted"
						>{{ $t('kara.problem.form.thanks.btn') }}</button>
						<button
							class="button is-success"
							:class="{'is-loading': loading}"
							type="submit"
							v-else
						>{{ $t('kara.problem.form.submit') }}</button>
					</footer>
				</div>
			</form>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';

    export default Vue.extend({
        name: 'KaraReport',

		props: ['karaoke'],

		data() {
        	return {
        		modal: false,
				loading: false,
				submitted: false,
				formData: {
        			type: 'time',
					comment: '',
					username: ''
				},
				gitlabUrl: ''
			}
		},

		methods: {
        	toggleModal() {
        		this.modal = !this.modal;
			},
			submitProblem() {
				this.loading = true;
				this.$axios.post(`/api/karas/${this.karaoke.kid}/problem`, this.formData).then(res => {
					this.gitlabUrl = res.data;
					this.loading = false;
					this.submitted = true;
				});
			}
		}
    });
</script>

<style scoped lang="scss">
	.field-label {
		flex-grow: 2;
	}
</style>
