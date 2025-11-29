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
							<div class="control">
								<o-dropdown  
									v-model="types"
									aria-role="list"
									multiple
									scrollable
									:teleport="true"
								>
									<template #trigger="{ openTagTypes }">
										<button class="button" type="button">
											<font-awesome-icon
												fixed-width
												:icon="['fas', openTagTypes ? 'chevron-up':'chevron-down']"
											/>
											{{ $t('modal.create_tag.types') }}
										</button>
									</template>
									<o-dropdown-item
										v-for="tagType in creatableTagTypes"
										:key="tagType.type"
										:value="tagType.type"
										aria-role="listitem"
										class="label-option"
									>
										{{ $t(`kara.tagtypes.${tagType.name}`) }}
									</o-dropdown-item>
								</o-dropdown>
							</div>
						</div>
					</div>
				</section>
				<footer class="modal-card-foot">
					<button class="button is-success" type="submit">
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
	import type { TagTypeNum } from '%/lib/types/tag';
	import { v4 as UUIDv4 } from 'uuid';

	const { config } = storeToRefs(useConfigStore());

	const props = defineProps<{
		active: boolean
		initialTagTypes?: number[];
		initialName?: string;
	}>();

	const types = ref(props.initialTagTypes || []);
	const name = ref(props.initialName);

	const emit = defineEmits<{ (e: 'sendNewTag', tag: DBTag): void }>();

	watch([props], ([_newProps]) => {
		if (props.active) {
			types.value = props.initialTagTypes || [];
			name.value = props.initialName;
		}
	}, { deep: true });


	const { closeModal } = useModalStore();

	const creatableTagTypes: TagType[] = Object.entries(tagTypes)
		// Remove year type
		.filter(e => e[1].type != 0)
		.filter(e => config?.value && !config.value.Frontend.Import.LimitedTagTypes.includes(e[1].type as TagTypeNum))
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
		if (name.value && types.value?.length > 0) {
			emit('sendNewTag', {
				tid : UUIDv4(),
				name: name.value,
				types: types.value as unknown as TagTypeNum[],
				i18n: {
					eng: name.value
				}
			});
			closeModal('createTag');
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

	.label-option {
		user-select: none;
	}
</style>
