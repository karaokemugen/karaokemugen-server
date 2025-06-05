<template>
	<div
		class="modal"
		:class="{ 'is-active': active }"
	>
		<form
			action="#"
			@submit.prevent="submitForm"
		>
			<div
				class="modal-background"
				@click.prevent="cancel"
			/>
			<div class="modal-card">
				<header class="modal-card-head">
					<p class="modal-card-title">
						{{
							$t('modal.create_tag.title')
						}}
					</p>
					<button
						type="button"
						class="delete"
						aria-label="close"
						@click="cancel"
					/>
				</header>
				<section class="modal-card-body">
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="name"
								class="label"
							>{{ $t('modal.create_tag.name') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="name"
										v-model="name"
										type="text"
										name="name"
										class="input"
										required
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="types"
								class="label"
							>{{ $t('modal.create_tag.types') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<span class="select is-multiple">
										<select
											id="types"
											v-model="types"
											name="types"
											autocomplete="off"
											multiple
											size="4"
										>
											<option
												v-for="tagType in creatableTagTypes"
												:key="tagType"
												:value="tagType.type"
												:class="{'is-active': types.includes(tagType.type as number)}"
											>
												{{ $t(`kara.tagtypes.${tagType.name}`) }}
											</option>
										</select>
									</span>
								</div>
							</div>
						</div>
					</div>
				</section>
				<footer class="modal-card-foot">
					<button
						class="button is-success"
						:class="{ 'is-loading': loading }"
						type="submit"
					>
						{{
							$t('modal.create_tag.submit')
						}}
					</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">
	import { useModalStore } from '~/store/modal';
	import type { DBTag } from '%/lib/types/database/tag';
	import { tagTypes, type TagType } from '~/assets/constants';
	import { useConfigStore } from '~/store/config';

	const { config } = storeToRefs(useConfigStore());

	const props = defineProps<{
		active: boolean
		initialTagTypes?: number[];
		initialName?: string;
	}>();

	const loading = ref(false);
	const types = ref(props.initialTagTypes || []);
	const name = ref(props.initialName);

	const emit = defineEmits<{ (e: 'addValue', tag: DBTag): void }>();

	watch([props], ([_newProps]) => {
		if (props.active) {
			types.value = props.initialTagTypes || [];
			name.value = props.initialName;
		}
	}, { deep: true });


	const { closeModal } = useModalStore();

	const creatableTagTypes: TagType = Object.entries(tagTypes)
		.filter(e => config?.Frontend?.CreatableTagTypes.includes(e[1].type) ?? true)
		// map into TagType
		.map(e => {
			return {
			name: e[0],
			...e[1],
			}
		});

	function cancel(): void {
		closeModal('createTag');
	}
	async function submitForm() {
		if (name && types.value?.length > 0) {
			loading.value = true;
			const { tag } = await useCustomFetch<{ tag: DBTag }>('/api/tags/createStaging', {
				method: 'POST',
				body: {
					name: name.value,
					types: types.value,
					i18n: {
						eng: name.value
					}
				}
			}).finally(() => {
				loading.value = false;
			});
			closeModal('createTag');
			emit('addValue', tag);
		}
	}
</script>

<style scoped lang="scss">
	.field-label {
		flex-grow: 2;
	}

	input[type="checkbox"] {
		margin-top: 0.75em;
	}

	.field:has(*:required) .label::before {
		content: '* ';
		color: red;
	}

	.select select option {
		color: #dbdee0;
		&.is-active {
			background-color: #3ee4c4;
			color: rgba(0,0,0,.7);
		}
	}
</style>
