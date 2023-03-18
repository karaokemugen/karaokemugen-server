<template>
	<div class="box">
		<h4 class="title is-4">
			{{ $t('kara.problem.title', {title: title}) }}
		</h4>
		<button
			class="button is-info"
			:disabled="submitted"
			@click="() => toggleModal('Media')"
		>
			<font-awesome-icon :icon="['fas', 'film']" />
			{{ $t('kara.problem.btn.media') }}
		</button>
		<button
			class="button is-warning"
			:disabled="submitted"
			@click="() => toggleModal('Metadata')"
		>
			<font-awesome-icon :icon="['fas', 'tag']" />
			{{ $t('kara.problem.btn.metadata') }}
		</button>
		<button
			class="button is-danger"
			:disabled="submitted"
			@click="() => toggleModal('Lyrics')"
		>
			<font-awesome-icon :icon="['fas', 'closed-captioning']" />
			{{ $t('kara.problem.btn.lyrics') }}
		</button>
		<nuxt-link
			:to="`/import/${karaoke.kid}`"
			class="button is-success"
		>
			<font-awesome-icon :icon="['fas', 'pen']" />
			{{ $t('kara.problem.btn.edit') }}
		</nuxt-link>
		<!-- Report Modal -->
		<div
			class="modal"
			:class="{'is-active': active}"
		>
			<form
				action="#"
				@submit.prevent="submitProblem"
			>
				<div
					class="modal-background"
					@click.prevent="() => toggleModal()"
				/>
				<div class="modal-card">
					<header class="modal-card-head">
						<h4 class="modal-card-title">
							{{ $t('kara.problem.form.title') }}
						</h4>
						<nuxt-link
							class="delete"
							aria-label="close"
							@click="() => toggleModal()"
						/>
					</header>
					<section
						v-if="submitted"
						class="modal-card-body"
					>
						<i18n-t
							keypath="kara.problem.form.thanks.text"
							tag="h5"
							class="title is-5"
						>
							<template #url>
								<nuxt-link
									:href="gitlabUrl"
									target="_blank"
								>
									{{ gitlabUrl }}
								</nuxt-link>
							</template>
						</i18n-t>
					</section>
					<section
						v-else
						class="modal-card-body"
					>
						<h5 class="title is-5">
							{{ $t('kara.problem.form.subtitle') }}
						</h5>
						<div class="field is-horizontal">
							<div class="field-label is-normal">
								<label
									for="type"
									class="label"
								>{{ $t('kara.problem.form.type.label') }}</label>
							</div>
							<div class="field-body">
								<div class="control">
									<div class="select">
										<select
											id="type"
											v-model="formData.type"
											name="type"
											autocomplete="off"
										>
											<option value="Media">
												{{ $t('kara.problem.form.type.media') }}
											</option>
											<option value="Metadata">
												{{ $t('kara.problem.form.type.metadata') }}
											</option>
											<option value="Lyrics">
												{{ $t('kara.problem.form.type.lyrics') }}
											</option>
										</select>
									</div>
								</div>
							</div>
						</div>
						<div class="field is-horizontal">
							<div class="field-label is-normal">
								<label
									for="comment"
									class="label"
								>{{ $t('kara.problem.form.comment.label') }}</label>
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
								<label
									for="comment"
									class="label"
								>{{ $t('kara.problem.form.username.label') }}</label>
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
							@click.prevent="() => toggleModal()"
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

<script setup lang="ts">
	import { DBKara } from '%/lib/types/database/kara';

	type ProblemsType = 'Media' | 'Metadata' | 'Lyrics';

	const props = defineProps<{
		karaoke: DBKara
	}>();

	const active = ref(false);
	const loading = ref(false);
	const submitted = ref(false);
	const gitlabUrl = ref('');
	const formData = ref<{
		type: ProblemsType,
		comment: string,
		username: string
	}>({
		type: 'Media',
		comment: '',
		username: ''
	});

	const title = computed(() => getTitleInLocale(props.karaoke.titles, props.karaoke.titles_default_language));

	function toggleModal(type?: ProblemsType) {
		if (type) {
			formData.value.type = type;
		}
		active.value = !active.value;
	}
	async function submitProblem() {
		loading.value = true;
		gitlabUrl.value = await useCustomFetch<string>(`/api/karas/${props.karaoke.kid}/problem`, {
			method: 'POST',
			body: formData.value
		});
		loading.value = false;
		submitted.value = true;
	}
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
