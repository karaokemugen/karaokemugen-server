<template>
	<div>
		<div
			v-if="checkboxes"
			class="tags"
		>
			<label
				v-for="tag in availableTags"
				:key="tag.tid"
				class="checkbox"
			>
				<input
					v-model="values"
					type="checkbox"
					:value="tag"
					@change="check"
				>
				<span>
					<span class="tag-name">{{ localizedName(tag, false) }}</span>
					<div
						v-if="tag.description"
						class="description"
					>
						{{ getDescriptionInLocale(tag) }}
					</div>
				</span>
			</label>
		</div>
		<div v-if="!checkboxes">
			<div class="tags">
				<span
					v-for="tag in values"
					:key="tag.tid"
					class="tag"
				>
					{{ localizedName(tag) }}
					<nuxt-link
						class="delete is-small"
						@click.prevent="() => deleteValue(tag)"
					/>
				</span>
				<div
					class="button tag is-small"
					@click="inputVisible = true"
				>
					<font-awesome-icon :icon="['fas', 'plus']" />
					{{ $t('kara.import.add') }}
				</div>
			</div>
			<div v-if="inputVisible">
				<o-autocomplete
					ref="inputToFocus"
					v-model="currentVal"
					keep-first
					open-on-focus
					:data="availableTags"
					:loading="isFetching"
					:custom-formatter="localizedName"
					:clear-on-select="true"
					@typing="debouncedGetAsyncData"
					@select="addValue"
				>
					<template
						v-if="!noCreate"
						#header
					>
						<button
							class="button"
							:class="{ 'is-loading': loading }"
							:disabled="currentVal.length === 0"
							@click="() => openModal('createTag')"
						>
							<font-awesome-icon :icon="['fas', 'plus']" />
							<span>{{ $t('kara.import.create') }}</span>
						</button>
					</template>
				</o-autocomplete>
			</div>
		</div>
	</div>
	<create-tag-modal
		:active="!!currentVal && createTag"
		:initial-tag-types="[tagType]"
		:initial-name="currentVal"
		@add-value="addValue"
	/>
</template>

<script setup lang="ts">
	import _ from 'lodash';
	import type { DBTag } from '%/lib/types/database/tag';
	import type { KaraTag } from '%/lib/types/kara';
	import { useModalStore } from '~/store/modal';

	const props = withDefaults(defineProps<{
		checkboxes?: boolean
		tagType: number,
		params: string[],
		noCreate?: boolean
	}>(), {
		checkboxes: false,
		noCreate: false
	});

	const emit = defineEmits<{ (e: 'change', value: string[]): void }>();

	const availableTags = ref<DBTag[]>([]);
	const values = ref<DBTag[]>([]);
	const inputVisible = ref(false);
	const currentVal = ref('');
	const isFetching = ref(false);
	const loading = ref(false);
	const debouncedGetAsyncData = ref();
	const inputToFocus = ref<HTMLElement>();

	const { openModal } = useModalStore();
	const { createTag } = storeToRefs(useModalStore());

	watch([props, inputVisible], ([_newProps, newInputVisible]) => {
		if (newInputVisible) {
			nextTick(() => {
				inputToFocus.value?.focus();
			});
		}
		updateProps();
	}, { deep: true });

	onMounted(async () => {
		debouncedGetAsyncData.value = _.debounce(getAsyncData, 500, { leading: true, trailing: true, maxWait: 750 });
		updateProps();
	});

	async function updateProps() {
		if (props.checkboxes) {
			availableTags.value = await getTags(props.tagType);
		}
		if (props.params) {
			const tags: DBTag[] = [];
			for (const tag of props.params) {
				const tag2 = availableTags.value.find(val => val.tid === tag);
				if (tag2) {
					tags.push(tag2);
				} else {
					const data = await useCustomFetch<DBTag>(`/api/karas/tags/${tag}`);
					if (!data) {
						throw new TypeError(`Tag ${tag} unknown`);
					}
					tags.push(data);
				}
			}
			values.value = tags;
		}
	}

	async function getTags(type: number, filter?: string): Promise<DBTag[]> {
		const { content } = await useCustomFetch<{ content: DBTag[] }>('/api/karas/tags', {
			query: {
				type,
				filter,
				includeStaging: true,
				size: 1000
			}
		});
		return content;
	}
	function getAsyncData(val: string) {
		isFetching.value = true;
		getTags(props.tagType, val)
			.then((content) => {
				const tids = values.value.map(tag => tag.tid);
				availableTags.value = content
					? content.filter(tag => !tids.includes(tag.tid)).sort((a, b) =>
						a.name.localeCompare(b.name)
					)
					: [];
			})
			.finally(() => {
				isFetching.value = false;
			});
	}
	function localizedName(tag: DBTag, withName = true) {
		if (tag.i18n) {
			const labelI18n = getTagInLocale(tag);
			return `${labelI18n}${labelI18n !== tag.name && withName ? ` (${tag.name})` : ''}`;
		} else {
			return tag.name;
		}
	}
	function addValue(option: DBTag) {
		if (option) {
			inputVisible.value = false;
			currentVal.value = '';
			if (option) {
				const valuesUpdated: DBTag[] = values.value;
				valuesUpdated.push(option);
				values.value = valuesUpdated;
				emit('change', values.value.map((t: DBTag) => t.tid));
			}
		}
	}

	function deleteValue(option: KaraTag) {
		values.value = values.value.filter((tag: DBTag) => tag.name !== option.name);
		emit('change', values.value.map((t: DBTag) => t.tid));
	}
	function check() {
		values.value = availableTags.value.filter((tag: DBTag) => values.value.some(tag2 => tag.tid === tag2.tid));
		emit('change', values.value.map((t: DBTag) => t.tid));
	}
</script>

<style scoped lang="scss">
	.checkbox {
		width: 250px;
		padding-bottom: 0.3em
	}

	.tag-name {
		margin-left: 0.4em;
	}

	.description {
		font-size: 0.8em;
		margin-right: 0.7em;
	}
</style>
