<template>
	<div class="is-ancestor">
		<loading-nanami v-if="loading" />
		<div
			v-if="tags.length > 0"
			class="tags"
		>
			<tag
				v-for="tag in tags"
				:key="tag.name"
				:tag="tag"
				type="years"
				icon
				showkaracount
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import type { DBYear } from '%/lib/types/database/kara';
	import type { Tag as TagType } from '%/lib/types/tag';
	import { useMenubarStore } from '~/store/menubar';
	import { useLocalStorageStore } from '~/store/localStorage';

	const loading = ref(true);
	const years = ref<DBYear[]>([]);
	const { t } = useI18n();

	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const { setResultsCount } = useMenubarStore();

	setResultsCount(0);

	const tags = computed((): TagType[] => {
		const tags: TagType[] = [];
		for (const year of years.value) {
			tags.push(fakeYearTag(year.year.toString(), year.karacount));
		}
		return tags;
	});

	watch(() => enabledCollections, () => setPage(), { deep: true });

	await fetch();

	async function fetch() {
		loading.value = true;
		const res = await useCustomFetch<DBYear[]>('/api/karas/years/', {
			params: {
				collections: enabledCollections.value.join(',')
			}
		}).catch(_err => {
			throw createError({ statusCode: 404, message: t('error.not_found_tag') });
		});
		loading.value = false;
		if (res) {
			years.value = res;
			setResultsCount(res.length);
		} else {
			throw createError({ statusCode: 500, message: 'Huh?' });
		}
	}

	async function setPage(): Promise<void> {
		const res = await useCustomFetch<DBYear[]>('/api/karas/years/', {
			params: {
				collections: enabledCollections.value.join(',')
			}
		});
		years.value = res;
		setResultsCount(res.length);
	}
</script>

<style scoped lang="scss">
	span.karacount {
		font-size: 0.8em;
		opacity: 0.6;
	}
</style>
