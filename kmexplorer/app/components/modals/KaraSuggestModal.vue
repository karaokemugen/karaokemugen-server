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
				@click.prevent="closeModal"
			/>
			<div class="modal-card">
				<header class="modal-card-head">
					<p class="modal-card-title">
						{{ $t('modal.suggest.title') }}
					</p>
					<button
						type="button"
						class="delete"
						aria-label="close"
						@click="closeModal"
					/>
				</header>
				<section
					v-if="!submitted"
					class="modal-card-body"
				>
					<h5 class="title is-5">
						{{ $t('modal.suggest.subtitle') }}
					</h5>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="title"
								class="label"
							>{{ $t('modal.suggest.fields.title.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="title"
										v-model="formData.title"
										type="text"
										name="title"
										class="input"
										required
										:placeholder="$t('modal.suggest.fields.title.label')"
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="series"
								class="label"
							>{{ $t('modal.suggest.fields.series.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="series"
										v-model="formData.serie"
										type="text"
										name="series"
										class="input"
										:placeholder="$t('modal.suggest.fields.series.label')"
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="singer"
								class="label"
							>{{ $t('modal.suggest.fields.singer.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="singer"
										v-model="formData.singer"
										type="text"
										name="singer"
										class="input"
										required
										:placeholder="$t('modal.suggest.fields.singer.label')"
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div v-if="versions.length > 0" class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="version"
								class="label"
							>{{ $t('modal.suggest.fields.version.label') }}</label>
						</div>
						<div class="field-body">
							<div class="control">
								<div class="select">
									<select
										id="version"
										v-model="formData.version"
										name="version"
										autocomplete="off"
									>
										<option
											v-for="version in versions"
											:key="version.tid"
											:value="version.name"
										>
											{{ getTagInLocale(version) }}
										</option>
									</select>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="link"
								class="label"
							>{{ $t('modal.suggest.fields.link.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="link"
										v-model="formData.link"
										type="url"
										name="link"
										class="input"
										required
										:placeholder="$t('modal.suggest.fields.link.label')"
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="lyrics_link"
								class="label"
							>{{ $t('modal.suggest.fields.lyrics_link.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="lyrics_link"
										v-model="formData.lyricsLink"
										type="url"
										name="lyrics_link"
										class="input"
										:placeholder="$t('modal.suggest.fields.lyrics_link.label')"
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
							>{{ $t('modal.suggest.fields.comment.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<textarea
										id="comment"
										v-model="formData.comment"
										name="comment"
										class="textarea"
										:placeholder="$t('modal.suggest.fields.comment.label')"
										autocomplete="off"
									/>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="name"
								class="label"
							>{{ $t('modal.suggest.fields.name.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="name"
										v-model="formData.username"
										type="text"
										name="name"
										class="input"
										:placeholder="$t('modal.suggest.fields.name.placeholder')"
										autocomplete="username"
									>
								</div>
							</div>
						</div>
					</div>
				</section>
				<section
					v-else
					class="modal-card-body"
				>
					<h5 class="title is-5">
						{{ $t('modal.suggest.submitted.subtitle') }}
					</h5>
					<i18n-t
						keypath="modal.suggest.submitted.text"
						tag="p"
					>
						<template #here>
							<nuxt-link
								:href="gitlabUrl"
								target="_blank"
							>
								{{ $t('modal.suggest.submitted.here') }}
							</nuxt-link>
						</template>
					</i18n-t>
				</section>
				<footer class="modal-card-foot">
					<button
						v-if="!submitted"
						class="button is-success"
						:disabled="!formData.title || !formData.singer || !formData.link"
						:class="{'is-loading': loading}"
						type="submit"
					>
						{{ $t('modal.suggest.submit') }}
					</button>
					<button
						v-else
						class="button is-success"
						type="button"
						@click="closeModal"
					>
						{{ $t('modal.suggest.submitted.close') }}
					</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import type { TagList } from '%/lib/types/tag';
	import { useAuthStore } from '~/store/auth';
	import type { DBTag } from '%/lib/types/database/tag';
	import type { SuggestionIssue } from '%/types/suggestions';

	defineProps<{
		active: boolean
	}>();

	const loading = ref(false);
	const submitted = ref(false);
	const gitlabUrl = ref('');
	const versions = ref<DBTag[]>([]);
	const formData = ref<SuggestionIssue>({
		title: '',
		serie: '',
		singer: '',
		version: '',
		link: '',
		lyricsLink: '',
		comment: '',
		username: ''
	});

	const emit = defineEmits<{(e: 'close'): void}>();
	const { loggedIn, user } = storeToRefs(useAuthStore());

	onMounted(() => {
		// Prefill the username field if user is logged in
		if (loggedIn.value && user?.value?.nickname) {
			formData.value.username = user.value.nickname;
		}
	});

	fetch();

	async function fetch() {
		const res = await useCustomFetch<TagList>('/api/karas/tags', {
			params: { 
				stripEmpty: true,
				type: 14
			}
		});
		if (res) {
			versions.value = res.content;
		}
	}

	function closeModal(): void {
		submitted.value = false;
		emit('close');
	}
	async function submitForm() {
		if (formData.value.title && formData.value.singer && formData.value.link) {
			loading.value = true;
			if (!formData.value.username) {
				formData.value.username = 'Anonymous';
			}
			gitlabUrl.value = await useCustomFetch<string>('/api/karas/suggest', {
				method: 'POST',
				body: formData.value
			});
			submitted.value = true;
			loading.value = false;
			formData.value = {
				title: '',
				serie: '',
				singer: '',
				version: '',
				link: '',
				lyricsLink: '',
				comment: '',
				username: ''
			};
		}
	}
</script>

<style scoped lang="scss">
	.field-label {
		flex-grow: 2;
	}

	.field:has(*:required) .label::before {
		content: '* ';
		color: red;
	}

	.select select option {
		color: #dbdee0;
	}
</style>
