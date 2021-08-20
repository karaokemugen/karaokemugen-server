<template>
	<div class="box">
		<h4 class="title is-4">
			{{ $t('kara.problem.title', {title: karaoke.title}) }}
		</h4>
		<button class="button is-warning" :disabled="submitted" @click="toggleModal">
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
				<div class="modal-background" />
				<div class="modal-card">
					<header class="modal-card-head">
						<h4 class="modal-card-title">
							{{ $t('kara.problem.form.title') }}
						</h4>
						<a class="delete" aria-label="close" @click="toggleModal" />
					</header>
					<section v-if="submitted" class="modal-card-body">
						<i18n path="kara.problem.form.thanks.text" tag="h5" class="title is-5">
							<template #url>
								<a :href="gitlabUrl" target="_blank">
									{{ gitlabUrl }}
								</a>
							</template>
						</i18n>
					</section>
					<section v-else class="modal-card-body">
						<h5 class="title is-5">
							{{ $t('kara.problem.form.subtitle') }}
						</h5>
						<div class="field is-horizontal">
							<div class="field-label is-normal">
								<label for="type" class="label">{{ $t('kara.problem.form.type.label') }}</label>
							</div>
							<div class="field-body">
								<div class="control">
									<div class="select">
										<select id="type" v-model="formData.type" name="type" autocomplete="off">
											<option value="time">
												{{ $t('kara.problem.form.type.time') }}
											</option>
											<option value="quality">
												{{ $t('kara.problem.form.type.quality') }}
											</option>
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
											id="comment"
											v-model="formData.comment"
											type="text"
											name="comment"
											class="input"
											required
											:placeholder="$t('kara.problem.form.comment.placeholder')"
											autocomplete="off"
										>
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
											id="username"
											v-model="formData.username"
											type="text"
											name="username"
											class="input"
											required
											:placeholder="$t('kara.problem.form.username.placeholder')"
											autocomplete="username"
										>
									</div>
								</div>
							</div>
						</div>
					</section>
					<footer class="modal-card-foot">
						<button
							v-if="submitted"
							class="button is-success"
							@click.prevent="toggleModal"
						>
							{{ $t('kara.problem.form.thanks.btn') }}
						</button>
						<button
							v-else
							class="button is-success"
							:class="{'is-loading': loading}"
							type="submit"
						>
							{{ $t('kara.problem.form.submit') }}
						</button>
					</footer>
				</div>
			</form>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import { DBKara } from '%/lib/types/database/kara';

	interface VState {
		modal: boolean,
		loading: boolean,
		submitted: boolean,
		formData: {
			type: 'time' | 'quality',
			comment: string,
			username: string
		},
		gitlabUrl: string
	}

	export default Vue.extend({
		name: 'KaraReport',

		props: {
			karaoke: {
				type: Object,
				required: true
			} as PropOptions<DBKara>
		},

		data(): VState {
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
			};
		},

		methods: {
			toggleModal() {
				this.modal = !this.modal;
			},
			submitProblem() {
				this.loading = true;
				this.$axios.post(`/api/karas/${this.karaoke.kid}/problem`, this.formData).then((res) => {
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

	.button {
		margin: 4px;
	}

	.select select option {
		color: white;
	}
</style>
