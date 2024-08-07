<template>
	<div class="tile is-ancestor">
		<div class="tile is-vertical">
			<div
				v-if="withSearch"
				class="tile is-parent is-12 is-hidden-desktop"
			>
				<search-tags class="mb-2" />
				<search-bar />
				<div class="field is-expanded">
					<collections-picker :label="$t('search.types.karaokes')" />
				</div>
			</div>
			<kara-list
				:karaokes="karaokes"
				:playlists="playlists"
				:loading="loading"
				:favorites="favorites"
				:with-suggest="withSuggest"
				@update-playlist="getPlaylists"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { KaraList as KaraListType, KaraParams, OrderParam } from '%/lib/types/kara';
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';
	import _ from 'lodash';
	import { storeToRefs } from 'pinia';
	import type { DBTag } from '~/../kmserver-core/src/lib/types/database/tag';
	import { tagRegex, tagTypes, tagTypesMap } from '~/assets/constants';
	import { useAuthStore } from '~/store/auth';
	import { useLocalStorageStore } from '~/store/localStorage';
	import type { TagExtend } from '~/store/menubar';
	import { useMenubarStore } from '~/store/menubar';

	interface KaraRequest extends KaraParams {
		collections: string
	}

	const { user, loggedIn } = storeToRefs(useAuthStore());
	const { search, sort, tags: menuTags } = storeToRefs(useMenubarStore());
	const { setResultsCount, setTags } = useMenubarStore();
	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const route = useRoute();
	const { replace } = useRouter();

	const loading = ref(true);
	const mounted = ref(false);
	const karaokes = ref<KaraListType>({ infos: { count: 0, from: 0, to: 0 }, i18n: {}, avatars: {}, content: [] });
	const from = ref(-1);
	const playlists = ref<DBPL[]>([]);

	const props = withDefaults(defineProps<{
		favorites?: string
		kids?: string[]
		withSuggest?: boolean
		withSearch?: boolean
		userAnimeList?: string
		ignoreFilter?: boolean
	}>(), {
		withSuggest: true,
		withSearch: true,
		ignoreFilter: false
	});

	setResultsCount(0);

	watch(sort, () => resetList(), { deep: true });
	watch(search, () => resetList(true));
	watch(menuTags, () => resetList(true), { deep: true });
	watch(enabledCollections, () => resetList(true, false), { deep: true });
	watch(karaokes, (karaokes) => setResultsCount(karaokes.infos.count), { deep: true });
	watch(loggedIn, getPlaylists);

	onMounted(() => {
		mounted.value = true;
		window.addEventListener('scroll', scrollEvent, { passive: true });
		fillPage();
	});

	onUnmounted(() => {
		mounted.value = false;
		window.removeEventListener('scroll', scrollEvent);
	});

	watch(() => props, fetch, { deep: true });
	fetch();
	getPlaylists();

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
		// Load the first page
		await resetList(true);
	}

	async function loadNextPage(force = false, acceptQueryCollection = true) {
		if (!force && (karaokes.value.infos.to === karaokes.value.infos.count || loading.value)) {
			return;
		}
		from.value++;
		loading.value = true;
		const data = await useCustomFetch<KaraListType>('/api/karas/search', {
			query: reqParams(acceptQueryCollection)
		});
		for (const karaoke of data.content) {
			karaoke.songtypes = sortAndHideTags(karaoke.songtypes, true);
		}
		for (let i = data.infos.from; i < data.infos.to; i++) {
			karaokes.value.content[i] = data.content[i - data.infos.from];
		}
		for (const [id, i18n] of Object.entries(data.i18n)) {
			if (!_.isEqual(i18n, karaokes.value.i18n[id])) {
				karaokes.value.i18n[id] = i18n;
			}
		}
		karaokes.value.infos.count = data.infos.count;
		karaokes.value.infos.to = data.infos.to;
		loading.value = false;
	}

	function scrollEvent() {
		// trigger next page before the end of the page
		const bottomPosScroll = document.documentElement.scrollTop + window.innerHeight;
		const minPosToTriggerScroll = 400;
		const triggerNextPage = document.documentElement.offsetHeight - bottomPosScroll < Math.max(2 * window.innerHeight, minPosToTriggerScroll);

		if (triggerNextPage) {
			loadNextPage();
		}
	}

	function fillPage() {
		if (!mounted.value) {
			return;
		}
		setTimeout(async () => {
			if (document.documentElement.clientHeight >= document.documentElement.scrollHeight) {
				await loadNextPage();
			}
			fillPage();
		}, 100);
	}

	async function resetList(navigation = false, acceptQueryCollection = true) {
		karaokes.value = { infos: { count: 0, to: 0, from: 0 }, i18n: {}, avatars: {}, content: [] };
		from.value = -1;
		await loadNextPage(true, acceptQueryCollection);
		if (route.name === 'search-query' && navigation && !props.favorites &&
			(route.params.query !== (search.value || undefined) ||
				decodeURIComponent(route.query.collections as string) !== enabledCollections.value.join(':') ||
				route.query.q !== reqParams().q)) {
			replace(generateNavigation());
		}
	}

	function reqParams(acceptQueryCollection = true): KaraRequest {
		const queries: string[] = [];
		const tags: string[] = [];
		if (menuTags.value.length > 0 && !props.ignoreFilter) {
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
			filter: (!props.ignoreFilter && search.value) || undefined,
			from: (from.value * 12),
			size: 12,
			order: (sort.value[route.name] as OrderParam) || undefined,
			favorites: props.favorites || undefined,
			collections:
				typeof route.query.collections === 'string' && acceptQueryCollection
					? decodeURIComponent(route.query.collections).replaceAll(':', ',')
					: enabledCollections.value.join(','),
			userAnimeList: props.userAnimeList || undefined
		};
	}

	async function getPlaylists() {
		playlists.value = loggedIn.value ? await useCustomFetch<DBPL[]>('/api/playlist', {
			params: {
				byUsername: user?.value?.login,
				includeUserAsContributor: true
			}
		}) : [];
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
	.launchDice {
		margin-left: 1em;
	}
</style>
