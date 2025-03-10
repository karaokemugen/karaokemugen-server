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
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="type"
								class="label"
							>{{ $t('modal.suggest.fields.type.label') }}</label>
						</div>
						<div class="field-body">
							<div class="control">
								<div class="select">
									<select
										id="type"
										v-model="formData.type"
										name="type"
										autocomplete="off"
										required
									>
										<option
											v-for="songtype in Object.keys(songtypes)"
											:key="songtype"
											:value="songtype"
										>
											{{ songtypes[songtype][locale] || songtypes[songtype]['eng'] || songtype }}
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

	defineProps<{
		active: boolean
	}>();

	const loading = ref(false);
	const submitted = ref(false);
	const gitlabUrl = ref('');
	const songtypes = ref<Record<string, Record<string, string>>>({});
	const formData = ref<{
		title: string,
		serie: string,
		singer: string,
		type: string,
		link: string,
		username: string
	}>({
		title: '',
		serie: '',
		singer: '',
		type: 'OP',
		link: '',
		username: ''
	});

	const emit = defineEmits<{(e: 'close'): void}>();
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { locale } = useI18n();
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
				type: 3
			}
		});
		if (res) {
			const songtypesUpdated: Record<string, Record<string, string>> = {};
			for (const songtype of res.content) {
				songtypesUpdated[songtype.name] = songtype.i18n as Record<string, string>;
			}
			songtypes.value = songtypesUpdated;
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
				type: 'OP',
				link: '',
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
