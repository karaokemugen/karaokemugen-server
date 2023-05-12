<template>
	<div class="tile is-ancestor">
		<div class="tile is-vertical">
			<div class="tile is-parent is-12 is-hidden-desktop">
				<search-tags />
				<search-bar
					:filter="false"
					:results="false"
				/>
				<search-edit />
			</div>

			<div
				v-if="total > 1"
				class="tile is-parent is-12"
			>
				<pagination
					:page="page"
					:last-page="total"
					@page="setPage"
				/>
			</div>

			<div class="tile is-parent is-12">
				<div
					v-if="tags.content.length > 0"
					class="tags"
				>
					<tag
						v-for="tag in tags.content"
						:key="tag.tid"
						icon
						:type="(params.id as string)"
						:tag="tag"
						:i18n="tag.i18n"
						showkaracount
					/>
				</div>
			</div>

			<div
				v-if="total > 1"
				class="tile is-parent is-12"
			>
				<pagination
					v-if="total > 1"
					:page="page"
					:last-page="total"
					@page="setPage"
				/>
			</div>

			<loading-nanami
				v-if="loading"
				class="tile is-parent is-12"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { TagList, TagParams, TagTypeNum } from '%/lib/types/tag';
	import { storeToRefs } from 'pinia';
	import { DBTag } from '~/../kmserver-core/src/lib/types/database/tag';
	import { tagTypes } from '~/assets/constants';
	import { useLocalStorageStore } from '~/store/localStorage';
	import { useMenubarStore } from '~/store/menubar';

	interface TagsRequest extends TagParams {
		collections: string
	}

	const { search, sort } = storeToRefs(useMenubarStore());
	const { setSort, setResultsCount, setSearch } = useMenubarStore();
	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const { fullPath, params } = useRoute();

	const tags = ref({ infos: { count: 0, from: 0, to: 0 }, content: [] } as TagList);
	const page = ref(1);
	const loading = ref(true);
	const total = ref(1);

	definePageMeta({
		validate({ params }) {
			return typeof tagTypes[params.id as string] === 'object';
		}
	});

	if (fullPath.includes('/search')) {
		setSearch('');
	}

	setResultsCount(0);
	if (!['az', 'karacount'].includes(sort.value)) {
		setSort('karacount');
	}

	watch(sort, () => setPage(1));
	watch(search, () => setPage(1));
	watch(enabledCollections, () => setPage(1), { deep: true });
	watch(tags, (now) => setResultsCount(now.infos.count), { deep: true });

	await setPage(1);

	async function setPage(e: number): Promise<void> {
		page.value = e;
		loading.value = true;
		const data = await useCustomFetch<TagList>('/api/karas/tags', {
			params: reqParams()
		});
		data.content = data.content.filter(
			(tag: DBTag) => tag.karacount && Object.keys(tag.karacount).length > 0
		);
		total.value = data.content.length > 0 ? Math.ceil(data.content[0].count! / 100) : 0;
		tags.value = data;
		loading.value = false;
	}

	function reqParams(): TagsRequest {
		return {
			from: (page.value - 1) * 100,
			size: 100,
			order: sort.value as 'az' | 'karacount',
			stripEmpty: true,
			filter: search.value || undefined,
			collections: enabledCollections.value.join(','),
			type: tagTypes[params.id as string].type as TagTypeNum
		};
	}
</script>
