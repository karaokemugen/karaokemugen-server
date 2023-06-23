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
				v-if="tagMaxPage > 1"
				class="tile is-parent is-12"
			>
				<pagination
					:page="page"
					:last-page="tagMaxPage"
					@page="p => page = p"
				/>
			</div>

			<div class="tile is-parent is-12">
				<div
					v-if="tagMaxPage > 0"
					class="tags"
				>
					<tag
						v-for="tag in tags?.content"
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
				v-if="tagMaxPage > 1"
				class="tile is-parent is-12"
			>
				<pagination
					v-if="tagMaxPage > 1"
					:page="page"
					:last-page="tagMaxPage"
					@page="p => page = p"
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

	const page = ref(1);
	const sortLocal = ref(sort.value as 'az' | 'karacount');

	definePageMeta({
		validate({ params }) {
			return typeof tagTypes[params.id as string] === 'object';
		}
	});

	if (fullPath.includes('/search')) {
		setSearch('');
	}

	if (!['az', 'karacount'].includes(sort.value)) {
		sortLocal.value = 'karacount';
		onBeforeMount(() => {
			setSort(sortLocal.value);
		});
	}

	const reqParams = computed(() => {
		return {
			from: (page.value - 1) * 100,
			size: 100,
			order: sortLocal.value as 'az' | 'karacount',
			stripEmpty: true,
			filter: search.value || undefined,
			collections: enabledCollections.value.join(','),
			type: tagTypes[params.id as string].type as TagTypeNum
		} as TagsRequest;
	});

	const { data: tags, pending: loading } = await useCustomFetchAsync<TagList, TagList>('/api/karas/tags', {
		params: reqParams,
		transform: data => {
			data.content = data.content.filter(
				(tag: DBTag) => tag.karacount && Object.keys(tag.karacount).length > 0
			);
			return data;
		},
		default: () => ({ infos: { count: 0, from: 0, to: 0 }, content: [] })
	});

	const tagMaxPage = computed(() => {
		return tags.value.content.length > 0 ? Math.ceil(tags.value.content[0].count! / 100) : 0;
	});
	setResultsCount(tags.value.infos.count);

	watch(sort, (now) => ['az', 'karacount'].includes(now) ? sortLocal.value = now as 'az' | 'karacount' : null);
	watch(sort, () => page.value = 1);
	watch(search, () => page.value = 1);
	watch(enabledCollections, () => page.value = 1, { deep: true });
	watch(tags, (now) => setResultsCount(now!.infos.count), { deep: true });

</script>
