<template>
	<o-dropdown
		v-model="enabledCollectionsModel"
		aria-role="list"
		multiple
	>
		<template #trigger="{ active }">
			<button class="button">
				<font-awesome-icon
					fixed-width
					:icon="['fas', active ? 'chevron-up':'chevron-down']"
				/>
				{{ label }}
			</button>
		</template>
		<p>{{ $t('layout.collections') }}</p>

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
	import { storeToRefs } from 'pinia';
	import { DBTag } from '%/lib/types/database/tag';
	import { useLocalStorageStore } from '~/store/localStorage';

	const collections = ref<DBTag[]>([]);

	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const { setEnabledCollections } = useLocalStorageStore();

	defineProps<{
		label: string
	}>();

	await fetch();

	async function fetch() {
		const { content } = await useCustomFetch<{ content: DBTag[] }>('/api/karas/tags', {
			query: {
				type: 16
			}
		});
		collections.value = content;
	}

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
