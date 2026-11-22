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
			<autocomplete-songs-in-playlist
				:can-edit-playlist="canEditPlaylist"
				class-props="is-hidden-desktop"
				:select="onKaraSearchChange"
			/>
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
							:repeat="repeat"
							@delete="() => openModal('deletePlaylist')"
							@edit="() => openModal('createEditPlaylist')"
							@shuffle="shufflePlaylist"
							@repeat="repeat = !repeat"
						/>
					</div>
					<autocomplete-songs-in-playlist
						:can-edit-playlist="canEditPlaylist"
						class-props="is-hidden-touch"
						:select="onKaraSearchChange"
					/>
				</div>
				<div class="tile is-vertical table-parent">
					<client-only>
						<section
							v-if="playlist.plaid && karaokes.infos.count > countBannerDisplay && !playlistBannerHidden.includes(playlist.plaid)"
							class="mb-4 hero is-link is-small"
						>
							<div class="hero-body">
								<div class="is-flex is-justify-content-space-between">
									<div>
										<p class="subtitle">
											{{ $t('playlists.app_banner', { instance: url.hostname }) }}
										</p>
									</div>
									<div>
										<nuxt-link
											class="delete"
											aria-label="close"
											@click="() => playlist?.plaid && hidePlaylistBanner(playlist.plaid)"
										/>
									</div>
								</div>
							</div>
						</section>
					</client-only>
					<ui-list-dnd
						:data="karaokes.content"
						:draggable="!search && canEditPlaylist"
						:paginated="karaokes.infos.count > chunkSize"
						:per-page="chunkSize"
						:total="karaokes.infos.count"
						:current-page="currentPage"
						id-attribute="plcid"
						@page="onPageChange"
						@drop="drop"
					>
						<template #default="row: DBPLC">
							<div :class="{ 'playing': karaokes.content[indexPlaying]?.plcid === row?.plcid }">
								<kara-card-playlist
									:karaoke="row"
									:karaokes-i18n="karaokes.i18n"
									:playlist="playlist"
									@update-player="(karaoke) => updatePlayer(karaoke)"
									@delete-karaokes="deleteKaraokes"
								/>
							</div>
						</template>
					</ui-list-dnd>
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
import * as Toast from 'vue-toastification';
import type { DBPLC } from '%/lib/types/database/playlist';
import type { DBPL } from '%/types/database/playlist';
import type { KaraList as KaraListType } from '%/lib/types/kara';
import { useMenubarStore } from '~/store/menubar';
import { useAuthStore } from '~/store/auth';
import { useModalStore } from '~/store/modal';
import { useLocalStorageStore } from '~/store/localStorage';
import type { DragEndEvent } from '@dnd-kit/vue';
import { isSortable } from '@dnd-kit/vue/sortable';

// @ts-expect-error vue-toastification is not typed
const useToast = Toast.useToast ?? Toast.default.useToast;

const countBannerDisplay = 25;
const chunkSize = 300;

const { createEditPlaylist, deletePlaylist } = storeToRefs(useModalStore());
const { closeModal, openModal } = useModalStore();
const { search } = storeToRefs(useMenubarStore());
const { setResultsCount, setSearch } = useMenubarStore();
const { playlistBannerHidden } = storeToRefs(useLocalStorageStore());
const { hidePlaylistBanner } = useLocalStorageStore();
const { loggedIn, user } = storeToRefs(useAuthStore());
const { replace, push } = useRouter();
const { params, query } = useRoute();
const { t } = useI18n();
const route = useRoute();
const toast = useToast();
const url = useRequestURL();

const currentPage = ref(Number(query.page) || 1);
const loading = ref(true);
const karaokes = ref<KaraListType<DBPLC>>({ infos: { count: 0, from: query.page ? (Number(query.page) - 1) * chunkSize : 0, to: 0 }, i18n: {}, content: [], avatars: {} });
const playlist = ref<DBPL>();
const playing = ref<DBPLC>();
const indexPlaying = ref(0);
const repeat = ref(false);

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
		if (karaokes.value.content[index] && isPlayable(karaokes.value.content[index], user?.value?.roles?.admin)) {
			indexPlaying.value = index;
			playing.value = karaokes.value.content[index];
		}
	}
});

const canEditPlaylist = computed(() =>
	loggedIn?.value &&
	user?.value &&
	playlist?.value &&
	(user.value.login === playlist.value.username || Boolean(playlist.value.contributors?.find(c => user.value?.login === c.username)))
);

onBeforeMount(() => setSearch(''));

onMounted(() => {
	debouncedPageChange.value = _.debounce(getAsyncAfterPageChange, 500);
});

onUnmounted(() => setSearch(''));

if (import.meta.client) {
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
	} else if (import.meta.client) {
		showError(createError({ statusCode: 404, message: t('error.not_found_playlist') }));
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
		toast.success(t('kara.playlists.add_success'));
		await loadNextPage();
	}
}

async function resetList() {
	karaokes.value = { infos: { count: 0, to: 0, from: 0 }, i18n: {}, content: [], avatars: {} };
	currentPage.value = 1;
	updateQueryParams();
	await loadNextPage();
	indexPlaying.value = 0;
	if (karaokes.value.content[0] && isPlayable(karaokes.value.content[0], user?.value?.roles?.admin)) {
		playing.value = karaokes.value.content[0];
	}
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
	if (karaokes.value.content[0] && isPlayable(karaokes.value.content[0], user?.value?.roles?.admin)) {
		playing.value = karaokes.value.content[0];
	}
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
		karaoke.songtypes = sortAndHideTags(karaoke.songtypes, true);
	}
	karaokes.value = data;
	loading.value = false;
	if (karaokes.value.content.length > 0) {
		if (query.index && Number(query.index) < karaokes.value.content.length && isPlayable(karaokes.value.content[Number(query.index)], user?.value?.roles?.admin)) {
			indexPlaying.value = Number(query.index);
			playing.value = karaokes.value.content[Number(query.index)];
		} else if (isPlayable(karaokes.value.content[0], user?.value?.roles?.admin)) {
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
		if (karaokes.value.content[indexPlaying.value] && isPlayable(karaokes.value.content[indexPlaying.value], user?.value?.roles?.admin)) {
			playing.value = karaokes.value.content[indexPlaying.value];
			updateQueryParams();
		} else {
			next();
		}
	} else if (repeat.value) {
		indexPlaying.value = 0;
		playing.value = karaokes.value.content[0];
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
		if (karaokes.value.content[indexPlaying.value] && isPlayable(karaokes.value.content[indexPlaying.value], user?.value?.roles?.admin)) {
			playing.value = karaokes.value.content[indexPlaying.value];
			updateQueryParams();
		} else {
			previous();
		}
	}
}

function updatePlayer(karaoke: DBPLC) {
	indexPlaying.value = karaokes.value.content.findIndex(n => karaoke.plcid === n.plcid);
	if (karaoke && isPlayable(karaoke, user?.value?.roles?.admin)) {
		playing.value = karaoke;
	}
	updateQueryParams();
}

function updateQueryParams() {
	let page = '';
	if (karaokes.value.infos.from > 0) page = `&page=${(karaokes.value.infos.from + chunkSize) / chunkSize}`;
	push(`/playlist/${playlist.value?.slug}?index=${indexPlaying.value}${page}`);
}

async function drop(event: DragEndEvent) {
	if (event.canceled) return;

  	const {source} = event.operation;
	if (isSortable(source)) {
		const {initialIndex, index, id} = source;

		if (initialIndex !== index && event.operation.target?.id && event.operation.source?.id) {
			// Reorder your data: move the item from initialIndex to index
			const result = Array.from(karaokes.value.content);
			const [removed] = result.splice(initialIndex as number, 1);
			result.splice(index as number, 0, removed);

			await useCustomFetch('/api/playlist/content/edit', {
				method: 'PUT',
				body: {
					plcids: [id],
					plcParams: {
						pos: index as number + 1
					}
				}
			});
		}
	}
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
		} else if (karaokes.value.content[indexPlaying.value] && isPlayable(karaokes.value.content[indexPlaying.value], user?.value?.roles?.admin)) {
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

async function shufflePlaylist() {
	await useCustomFetch(`/api/playlist/${playlist.value?.plaid}/shuffle`);
	fetch();
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
