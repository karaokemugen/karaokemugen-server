<template>
	<div class="tile is-ancestor">
		<div class="tile is-vertical">
			<div
				v-if="withSearch"
				class="tile is-parent is-12 is-hidden-desktop"
			>
				<search-tags />
				<search-bar
					:filter="false"
					:results="false"
				/>
				<search-edit />
				<div class="field is-expanded">
					<collections-picker :label="$t('search.types.karaokes')" />
				</div>
			</div>
			<kara-list
				:karaokes="karaokes"
				:loading="loading"
				:favorites="favorites"
				:with-suggest="withSuggest"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { KaraList as KaraListType } from '%/lib/types/kara';
	import { storeToRefs } from 'pinia';
	import { DBTag } from '~/../kmserver-core/src/lib/types/database/tag';
	import { tagRegex, tagTypes, tagTypesMap } from '~/assets/constants';
	import { useLocalStorageStore } from '~/store/localStorage';
	import { TagExtend, useMenubarStore } from '~/store/menubar';

	interface KaraRequest {
		from: number,
		size: number,
		order?: string,
		filter?: string,
		q?: string,
		favorites?: string,
		collections: string
	}

	const { search, sort, tags: menuTags } = storeToRefs(useMenubarStore());
	const { setSort, setResultsCount, setTags } = useMenubarStore();
	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const { setEnabledCollections } = useLocalStorageStore();
	const route = useRoute();

	const loading = ref(true);
	const karaokes = ref<KaraListType>({ infos: { count: 0, from: 0, to: 0 }, i18n: {}, content: [] });
	const from = ref(-1);

	const props = withDefaults(defineProps<{
		favorites?: string
		kids?: string[]
		withSuggest?: boolean
		withSearch?: boolean
	}>(), {
		withSuggest: true,
		withSearch: true
	});

	setResultsCount(0);
	if (sort.value === 'karacount' || (route.name !== 'suggest' && ['likes', 'language'].includes(sort.value))) {
		setSort('recent');
	}

	watch(sort, () => resetList());
	watch(search, () => resetList(true));
	watch(menuTags, () => resetList(true), { deep: true });
	watch(enabledCollections, () => resetList(true), { deep: true });
	watch(karaokes, (karaokes) => setResultsCount(karaokes.infos.count), { deep: true });

	onMounted(() => {
		window.addEventListener('scroll', scrollEvent, { passive: true });
	});

	onUnmounted(() => {
		window.removeEventListener('scroll', scrollEvent);
	});

	fetch();

	async function fetch() {
		const tagExtends: TagExtend[] = [];
		if (typeof route.query.q === 'string') {
			const criterias = route.query.q.split('!');
			for (const c of criterias) {
				// Splitting only after the first ":" and removing potentially harmful stuff
				const type = c.split(/:(.+)/)[0];
				let values = c.replace(/'/, '\'');
				values = values.split(/:(.+)/)[1];
				// Validating values
				// Technically searching tags called null or undefined is possible. You never know. Repositories or years however, shouldn't be.
				if (type === 't') {
					const tags = values.split(',');
					if (tags.some((v: string) => !tagRegex.test(v))) {
						throw createError({ message: `Incorrect tag ${tags.toString()}` });
					}
					for (const tag of tags) {
						const parsedTag = tagRegex.exec(tag);
						if (!parsedTag) {
							throw new Error('Mais merde à la fin !');
						}
						const data = await useCustomFetch<DBTag>(`/api/karas/tags/${parsedTag[1]}`);
						const payload = {
							type: tagTypesMap[parseInt(parsedTag[2])].name as string,
							tag: data
						};
						tagExtends.push(payload);
					}
				} else if (type === 'y') {
					if (isNaN(values as unknown as number)) { throw createError({ message: 'Invalid year' }); }
					tagExtends.push({
						type: 'years',
						tag: fakeYearTag(values)
					});
				}
			}
			setTags(tagExtends);
		}
		if (typeof route.query.collections === 'string') {
			setEnabledCollections(route.query.collections.split(':'));
		}
		// Load the first page
		await loadNextPage(true);
	}

	async function loadNextPage(force = false) {
		if (!force && (karaokes.value.infos.to === karaokes.value.infos.count || loading.value)) {
			return;
		}
		from.value++;
		loading.value = true;
		const data = await useCustomFetch<KaraListType>('/api/karas/search', {
			query: reqParams()
		});
		for (const karaoke of data.content) {
			sortTypesKara(karaoke);
		}
		karaokes.value.content.push(...data.content);
		karaokes.value.i18n = data.i18n;
		karaokes.value.infos.count = data.infos.count;
		karaokes.value.infos.to = data.infos.to;
		loading.value = false;
	}

	function scrollEvent() {
		const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight > document.documentElement.offsetHeight - 400;

		if (bottomOfWindow) {
			loadNextPage();
		}
	}

	function resetList(navigation = false) {
		karaokes.value = { infos: { count: 0, to: 0, from: 0 }, i18n: {}, content: [] };
		from.value = -1;
		loadNextPage(true);
		if (navigation && !props.favorites &&
			(route.params.query !== (search.value || undefined) ||
				route.query.collections !== enabledCollections.value.join(':') ||
				route.query.q !== reqParams().q)) {
			useRouter().replace(generateNavigation());
		}
	}

	function reqParams(): KaraRequest {
		const queries: string[] = [];
		const tags: string[] = [];
		if (menuTags.value.length > 0) {
			for (const tag of menuTags.value) {
				if (tag.type === 'years') {
					queries.push(`y:${tag.tag.name}`);
				} else {
					tags.push(`${tag.tag.tid}~${tagTypes[tag.type].type}`);
				}
			}
			if (tags.length > 0) {
				queries.push(`t:${tags.join(',')}`);
			}
		}
		if (props.kids) {
			queries.push(`k:${props.kids.join(',')}`);
		}
		return {
			q: queries.join('!') || undefined,
			filter: search.value || undefined,
			from: (from.value * 12),
			size: 12,
			order: sort.value || undefined,
			favorites: props.favorites || undefined,
			collections: enabledCollections.value.join(',')
		};
	}
</script>

<style lang="scss">
	.field.is-expanded {
		flex-grow: 1;
		flex-shrink: 0;

		.dropdown-trigger > button {
			width: 100%;
		}
	}
</style>
