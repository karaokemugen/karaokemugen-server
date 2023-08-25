<template>
	<div>
		<div v-if="playlist">
			<div class="is-hidden-desktop mb-5">
				<search-bar
					class="buttons mb-5"
					:filter="false"
					:results="false"
				/>
				<playlist-card
					:playlist="playlist"
					:with-buttons="true"
					:playlist-page="true"
				/>
			</div>
			<label
				v-if="canEditPlaylist"
				class="is-hidden-desktop"
			>
				{{ $t('playlists.add_karaoke') }}
				<o-autocomplete
					clear-on-select
					:data="karaSearch"
					field="label"
					@typing="debouncedGetAsyncData"
					@select="onKaraSearchChange"
				/>
			</label>
			<div class="tile is-parent">
				<div class="tile is-vertical player">
					<live-player
						v-if="playing"
						:karaoke="playing"
						:playlist-mode="true"
						@next="next"
						@previous="previous"
					/>
					<div class="is-hidden-touch mb-5">
						<playlist-card
							:playlist="playlist"
							:with-buttons="true"
							:playlist-page="true"
							@edit="() => openModal('createEditPlaylist')"
						/>
					</div>
					<label
						v-if="canEditPlaylist"
						class="is-hidden-touch"
					>
						{{ $t('playlists.add_karaoke') }}
						<o-autocomplete
							clear-on-select
							:data="karaSearch"
							field="label"
							@typing="debouncedGetAsyncData"
							@select="onKaraSearchChange"
						/>
					</label>
				</div>
				<div class="tile is-vertical table-parent">
					<o-table
						:data="karaokes.content"
						:draggable="canEditPlaylist"
						:show-header="false"
						:narrowed="true"
						:paginated="karaokes.infos.count > chunkSize"
						:backend-pagination="true"
						pagination-position="both"
						:per-page="chunkSize"
						:total="karaokes.infos.count"
						:current-page="currentPage"
						:row-class="isStylePlaying"
						@page-change="onPageChange"
						@dragstart="dragstart"
						@drop="drop"
						@dragover="dragover"
						@dragleave="dragleave"
					>
						<o-table-column v-slot="props">
							<kara-card-playlist
								v-if="props.row"
								:karaoke="props.row"
								:karaokes-i18n="karaokes.i18n"
								:playlist="playlist"
								@update-player="(karaoke) => updatePlayer(karaoke)"
								@delete-karaokes="deleteKaraokes"
							/>
						</o-table-column>
					</o-table>
				</div>
			</div>
			<div v-if="!loading">
				<create-edit-playlist-modal
					:active="createEditPlaylist"
					:slug="playlist.slug"
					@close="afterEditPlaylist"
				/>
				<delete-playlist-modal
					:active="deletePlaylist"
					:playlist="playlist"
					@close="afterDeletePlaylist"
				/>
			</div>
		</div>
		<loading-nanami
			v-if="loading"
			class="tile is-parent is-12"
		/>
	</div>
</template>

<script setup lang="ts">
	import _ from 'lodash';
	import { storeToRefs } from 'pinia';
	import { DBPL, DBPLC } from 'kmserver-core/src/lib/types/database/playlist';
	import { KaraList, KaraList as KaraListType } from '%/lib/types/kara';
	import { useMenubarStore } from '~/store/menubar';
	import { useAuthStore } from '~/store/auth';
	import { useModalStore } from '~/store/modal';

	const chunkSize = 300;

	const { createEditPlaylist, deletePlaylist } = storeToRefs(useModalStore());
	const { closeModal, openModal } = useModalStore();
	const { search } = storeToRefs(useMenubarStore());
	const { setResultsCount } = useMenubarStore();
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { replace, push } = useRouter();
	const { params, query } = useRoute();
	const { t } = useI18n();
	const route = useRoute();

	const currentPage = ref(Number(query.page) || 1);
	const loading = ref(true);
	const karaokes = ref<KaraListType<DBPLC>>({ infos: { count: 0, from: query.page ? (query.page - 1) * chunkSize : 0, to: 0 }, i18n: {}, content: [] });
	const playlist = ref<DBPL>();
	const playing = ref<DBPLC>();
	const indexPlaying = ref(0);
	const draggingRow = ref<DBPLC>();
	const draggingRowIndex = ref<number>(0);
	const karaSearch = ref<{ label: string; value: string }[]>([]);

	const debouncedGetAsyncData = ref();
	const debouncedPageChange = ref();

	setResultsCount(0);

	watch(search, resetList);
	watch(karaokes, (karaokes) => setResultsCount(karaokes.infos.count), { deep: true });
	watch(() => route.query.page, async (now) => {
		const page = Number(now) || 1;
		if (page !== currentPage.value) {
			currentPage.value = page;
			await onPageChange(page);
		}
	});

	watch(() => route.query.index, async (now) => {
		const index = Number(now) || 0;
		if (index !== indexPlaying.value) {
			if (karaokes.value.content[index] && isPlayable(karaokes.value.content[index])) {
				indexPlaying.value = index;
				playing.value = karaokes.value.content[index];
			}
		}
	});

	const canEditPlaylist = computed(() =>
		loggedIn?.value &&
		user?.value &&
		playlist?.value &&
		(user.value.login === playlist.value.username || playlist.value.contributors?.map(c => user.value?.login === c.username))
	);

	onMounted(() => {
		debouncedGetAsyncData.value = _.debounce(getAsyncData, 500, { leading: true, trailing: true, maxWait: 750 });
		debouncedPageChange.value = _.debounce(getAsyncAfterPageChange, 500);
	});

	if (process.client) {
		await fetch();
	}

	async function fetch() {
		await getPlaylist();
		await loadNextPage();
	}

	async function getPlaylist() {
		const playlists = await useCustomFetch<DBPL[]>('/api/playlist', {
			params: {
				slug: params.slug
			}
		});
		if (playlists.length > 0) {
			playlist.value = playlists[0];
		} else if (process.client) {
			showError(createError({ statusCode: 404, message: t('error.not_found_playlist') }));
		}
	}

	async function getAsyncData(val: string) {
		const res = await useCustomFetch<KaraList>('/api/karas/search',
			{
				params: {
					filter: val,
					size: 50,
					ignoreCollections: true
				}
			});
		if (res.content) {
			karaSearch.value = res.content
				.map(k => {
					return {
						label: buildKaraTitle(k, res.i18n),
						value: k.kid,
					};
				});
		}
	}

	async function onKaraSearchChange(event: { label: string; value: string }) {
		if (event?.value) {
			await useCustomFetch(`/api/playlist/${playlist.value?.plaid}`, {
				method: 'POST',
				body: {
					kids: [event.value]
				}
			});
			await loadNextPage();
		}
	}

	async function resetList() {
		karaokes.value = { infos: { count: 0, to: 0, from: 0 }, i18n: {}, content: [] };
		currentPage.value = 1;
		updateQueryParams();
		await loadNextPage();
		indexPlaying.value = 0;
		playing.value = karaokes.value.content[0];
	}

	async function onPageChange(p: number) {
		if (!loading.value) {
			karaokes.value.infos.from = (p - 1) * chunkSize;
			updateQueryParams();
			debouncedPageChange.value();
		}
	}

	async function getAsyncAfterPageChange() {
		await loadNextPage();
		indexPlaying.value = 0;
		playing.value = karaokes.value.content[0];
	}

	async function loadNextPage() {
		loading.value = true;
		const data = await useCustomFetch<KaraListType<DBPLC>>(`/api/playlist/${playlist.value?.plaid}`, {
			query: {
				filter: search.value || undefined,
				from: karaokes.value.infos.from,
				size: chunkSize,
			}
		});
		for (const karaoke of data.content) {
			sortTypesKara(karaoke);
		}
		karaokes.value = data;
		loading.value = false;
		if (karaokes.value.content.length > 0) {
			if (query.index && query.index < karaokes.value.content.length) {
				indexPlaying.value = query.index;
				playing.value = karaokes.value.content[query.index];
			} else {
				playing.value = karaokes.value.content[0];
			}
		}
	}

	async function next() {
		if (indexPlaying.value === 299 && karaokes.value.infos.count > karaokes.value.infos.from + chunkSize) {
			karaokes.value.infos.from = karaokes.value.infos.from + chunkSize;
			currentPage.value = currentPage.value + 1;
			await loadNextPage();
			indexPlaying.value = -1;
		}
		if (indexPlaying.value < karaokes.value.content.length - 1) {
			indexPlaying.value = indexPlaying.value + 1;
			if (karaokes.value.content[indexPlaying.value] && isPlayable(karaokes.value.content[indexPlaying.value])) {
				playing.value = karaokes.value.content[indexPlaying.value];
				updateQueryParams();
			} else {
				next();
			}
		}
	}

	async function previous() {
		if (indexPlaying.value === 0 && karaokes.value.infos.from > 0) {
			karaokes.value.infos.from = karaokes.value.infos.from - chunkSize;
			currentPage.value = currentPage.value - 1;
			await loadNextPage();
			indexPlaying.value = 300;
		}
		if (indexPlaying.value > 0) {
			indexPlaying.value = indexPlaying.value - 1;
			if (karaokes.value.content[indexPlaying.value] && isPlayable(karaokes.value.content[indexPlaying.value])) {
				playing.value = karaokes.value.content[indexPlaying.value];
				updateQueryParams();
			} else {
				previous();
			}
		}
	}

	function updatePlayer(karaoke: DBPLC) {
		indexPlaying.value = karaokes.value.content.findIndex(n => karaoke.plcid === n.plcid);
		playing.value = karaoke;
		updateQueryParams();
	}

	function updateQueryParams() {
		let page = '';
		if (karaokes.value.infos.from > 0) page = `&page=${(karaokes.value.infos.from + chunkSize) / chunkSize}`;
		push(`/playlist/${playlist.value?.slug}?index=${indexPlaying.value}${page}`);
	}

	function dragstart(payload: any) {
		draggingRow.value = payload.row;
		draggingRowIndex.value = payload.index;
		payload.event.dataTransfer.effectAllowed = 'move';
	}

	function dragover(payload: any) {
		payload.event.dataTransfer.dropEffect = 'move';
		payload.event.target.closest('tr').classList.add('is-selected');
		payload.event.preventDefault();
	}

	function dragleave(payload: any) {
		payload.event.target.closest('tr').classList.remove('is-selected');
		payload.event.preventDefault();
	}

	async function drop(payload: any) {
		const result = Array.from(karaokes.value.content);
		const [removed] = result.splice(draggingRowIndex.value, 1);
		result.splice(payload.index, 0, removed);
		karaokes.value.content = result;

		payload.event.target.closest('tr').classList.remove('is-selected');
		await useCustomFetch('/api/playlist/content/edit', {
			method: 'PUT',
			body: {
				plcids: [draggingRow.value?.plcid],
				plcParams: {
					pos: payload.index + 1
				}
			}
		});
		draggingRowIndex.value = 0;
		draggingRow.value = undefined;
	}

	async function deleteKaraokes(plcids: number[]) {
		await useCustomFetch('/api/playlist/content/delete', {
			method: 'POST',
			body: {
				plcids: plcids,
			}
		});
		const deleteKaraokeIsPlaying = karaokes.value.content.findIndex(plc => plcids.includes(plc.plcid)) === indexPlaying.value;
		karaokes.value.content = karaokes.value.content.filter(plc => !plcids.includes(plc.plcid));
		if (deleteKaraokeIsPlaying) {
			if (indexPlaying.value === karaokes.value.content.length) {
				playing.value = karaokes.value.content[0];
				indexPlaying.value = 0;
			} else if (karaokes.value.content[indexPlaying.value] && isPlayable(karaokes.value.content[indexPlaying.value])) {
				playing.value = karaokes.value.content[indexPlaying.value];
			} else {
				next();
			}
		}
	}

	function afterEditPlaylist(pl?: DBPL) {
		closeModal('createEditPlaylist');
		if (pl) {
			playlist.value = pl;
			replace(`/playlist/${pl.slug}`);
		}
	}

	async function afterDeletePlaylist() {
		closeModal('deletePlaylist');
		push('/playlists');
	}

	function isStylePlaying(row: DBPLC) {
		if (karaokes.value.content[indexPlaying.value]?.plcid === row.plcid) {
			if (indexPlaying.value === 0) {
				return 'playing first';
			} else {
				return 'playing';
			}
		}
	}

</script>
<style lang="scss">
	.playing {
		background-color: #4b5253;

		&.first td:first-child {
			border-top-left-radius: 0.4em;
		}
	}

	.level {
		padding-right: 1em;
	}
</style>
<style scoped lang="scss">
	@media screen and (max-width: 1024px) {
		.tile.is-parent {
			flex-direction: column;
		}
	}

	@media screen and (min-width: 769px) {
		.player {
			margin-right: 0.75rem;
		}
	}

	@media screen and (min-width: 1024px) {
		.table-parent {
			height: 80vh;
			overflow: auto;
		}
	}

	td {
		text-align: left !important;
		display: block !important;
	}

	td:before {
		padding-right: 0 !important;
	}
</style>
