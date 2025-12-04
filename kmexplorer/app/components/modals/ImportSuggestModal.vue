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
						{{ $t('suggestions.header.import_suggestion') }}
					</p>
					<button
						type="button"
						class="delete"
						aria-label="close"
						@click="closeModal"
					/>
				</header>
				<section
					class="modal-card-body"
				>
					<h5 class="title is-5">
						{{ $t('modal.import_suggestion.subtitle') }}
					</h5>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="source"
								class="label"
							>{{ $t('modal.import_suggestion.source') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="source"
										v-model="formData.source"
										type="text"
										name="source"
										class="input"
										required
										:placeholder="$t('modal.import_suggestion.source')"
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="file"
								class="label"
							>{{ $t('modal.import_suggestion.file') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<div
											class="file has-name is-fullwidth"
										>
											<label class="file-label">
												<input
													required
													class="file-input"
													type="file"
													name="resume"
													accept=".csv"
													@change="importFile"
												>
												<span class="file-cta">
													<span class="file-icon">
														<font-awesome-icon
															:icon="['fas', 'upload']"
															:fixed-width="true"
														/>
													</span>
													<span class="file-label">{{ t('actions.choose_file') }}</span>
												</span>
												<span class="file-name">{{ filename }}</span>
											</label>
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
						type="submit"
					>
						{{ $t('actions.import') }}
					</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">

defineProps<{
	active: boolean
}>();

const { t } = useI18n();

const loading = ref(false);
const filename = ref('');
const formData = ref<{
	file: string,
	source: string,
}>({
	file: '',
	source: ''
});

const emit = defineEmits<{ (e: 'close'): void }>();

function closeModal(): void {
	emit('close');
}

function importFile(e: any) {
	if (!window.FileReader) return alert('FileReader API is not supported by your browser.');
	if (e.target.files && e.target.files[0]) {
		const file = e.target.files[0];
		filename.value = file.name;
		const fr = new FileReader();
		fr.onload = () => formData.value.file = fr.result as string;
		fr.readAsText(file);
	}
}

async function submitForm() {
	if (formData.value.file && formData.value.source) {
		loading.value = true;
		await useCustomFetch<string>('/api/suggestions/import', {
			method: 'POST',
			body: {
				fileData: formData.value.file,
				source: formData.value.source
			}
		});
		loading.value = false;
		closeModal();
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
</style>
