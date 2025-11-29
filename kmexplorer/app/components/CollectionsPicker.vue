<template>
	<o-dropdown
		v-if="collections.length > 0"
		v-model="enabledCollectionsModel"
		aria-role="list"
		multiple
	>
		<template #trigger="{ active }">
			<button class="button">
				<font-awesome-icon
					fixed-width
					:icon="['fas', active ? 'chevron-up' : 'chevron-down']"
				/>
				{{ $t('search.types.collections') }}
			</button>
		</template>
		<p>{{ $t('layout.collections', { instance: url.hostname }) }}</p>

		<o-dropdown-item
			v-for="collection in collections"
			:key="collection.tid"
			:value="collection.tid"
			aria-role="listitem"
		>
			{{ getTagInLocale(collection) }} ({{ getDescriptionInLocale(collection) }})
		</o-dropdown-item>
	</o-dropdown>
</template>

<script setup lang="ts">
	import type { DBTag } from '%/lib/types/database/tag';
	import type { TagList } from '%/lib/types/tag';
	import { storeToRefs } from 'pinia';
	import { useLocalStorageStore } from '~/store/localStorage';

	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const { setEnabledCollections } = useLocalStorageStore();

	const url = useRequestURL();

	const { data: collections } = await useCustomFetchAsync('/api/karas/tags', {
		query: {
			type: 16
		},
		transform: (data: TagList) => {
			return data.content;
		},
		default: () => [] as DBTag[]
	});

	const enabledCollectionsModel = computed({
		get(): string[] {
			return enabledCollections.value;
		},
		set(collecs: string[]) {
			setEnabledCollections(collecs);
		}
	});
</script>

<style scoped>
.dropdown-content > p {
	padding: .5em 1em;
	min-width: 18em;
}
.dropdown-item {
	font-size: 0.9rem;
}
</style>
