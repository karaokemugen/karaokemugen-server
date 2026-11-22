<template>
	<ui-select
		v-if="collectionsList?.length > 0"
		v-model:model="enabledCollectionsList"
		:button-label="$t('search.types.collections')"
		:items="collectionsList"
		:description="$t('layout.collections', { instance: url.hostname })"
		key-attribute="tid"
		:is-disabled="(item: DBTag) => enabledCollections.length === 1 && enabledCollections.includes(item.tid)"
	/>
</template>

<script setup lang="ts">
import type { TagList } from '%/lib/types/tag';
import { storeToRefs } from 'pinia';
import { useLocalStorageStore } from '~/store/localStorage';
import { useConfigStore } from '~/store/config';
import type { DBTag } from '%/lib/types/database/tag';
const { enabledCollections } = storeToRefs(useLocalStorageStore());
const { setEnabledCollections } = useLocalStorageStore();
const { collections } = storeToRefs(useConfigStore());
const { setCollections } = useConfigStore();

const collectionsList = ref<{ label: string; value: DBTag; }[]>([]);
const enabledCollectionsList = ref<{ label: string; value: DBTag; }[]>([]);

const url = useRequestURL();

if (collections.value.length === 0) {
	setCollections((await useCustomFetch<TagList>('/api/karas/tags', {
		query: {
			type: 16
		},
	})).content);
}

watch(enabledCollectionsList, () => setEnabledCollections(enabledCollectionsList.value.map(c => c.value.tid)));
watch(collections, fetch);

function fetch() {
	collectionsList.value = collections.value.map(c => {
		return {label: `${getTagInLocale(c)} (${getDescriptionInLocale(c)})`, value: c };
	})
	enabledCollectionsList.value = collectionsList.value.filter(c => enabledCollections.value.includes(c.value.tid));
}

fetch();
</script>