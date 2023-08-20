<template>
	<div>
		<div v-if="playlist">
			<div class="title is-hidden-desktop">
				{{ playlist.name }}
				<div class="subtitle">
					{{ playlist.description }}
				</div>
			</div>
			<div class="buttons is-hidden-desktop">
				<button
					v-if="playlist.username === user?.login"
					class="button"
					@click="() => openModal('createEditPlaylist')"
				>
					<font-awesome-icon :icon="['fas', 'pen']" />
					<span>{{ $t('playlists.edit') }}</span>
				</button>
				<button
					class="button"
					@click="exportPlaylist"
				>
					<font-awesome-icon :icon="['fas', 'download']" />
					<span>{{ $t('playlists.export') }}</span>
				</button>
				<button
					class="button"
					@click="shareLink"
				>
					<font-awesome-icon :icon="['fas', 'share']" />
					<span>{{ $t('playlists.share') }}</span>
				</button>
				<button
					v-if="playlist.username === user?.login"
					class="button"
					@click="() => openModal('deletePlaylist')"
				>
					<font-awesome-icon :icon="['fas', 'trash']" />
					<span>{{ $t('playlists.delete') }}</span>
				</button>
			</div>
			<label
				v-if="loggedIn && user && (user.login === playlist.username || playlist.contributors?.includes(user.login))"
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
					<div class="title is-hidden-touch">
						{{ playlist?.name }}
						<div class="subtitle">
							{{ playlist.description }}
						</div>
					</div>
					<div class="buttons is-hidden-touch">
						<button
							v-if="playlist.username === user?.login"
							class="button"
							@click="() => openModal('createEditPlaylist')"
						>
							<font-awesome-icon :icon="['fas', 'pen']" />
							<span>{{ $t('playlists.edit') }}</span>
						</button>
						<button
							class="button"
							@click="exportPlaylist"
						>
							<font-awesome-icon :icon="['fas', 'download']" />
							<span>{{ $t('playlists.export') }}</span>
						</button>
						<button
							class="button"
							@click="shareLink"
						>
							<font-awesome-icon :icon="['fas', 'share']" />
							<span>{{ $t('playlists.share') }}</span>
						</button>
						<button
							v-if="playlist.username === user?.login"
							class="button"
							@click="() => openModal('deletePlaylist')"
						>
							<font-awesome-icon :icon="['fas', 'trash']" />
							<span>{{ $t('playlists.delete') }}</span>
						</button>
					</div>
					<label
						v-if="loggedIn && user && (user.login === playlist.username || playlist.contributors?.includes(user.login))"
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
						:draggable="loggedIn && user && (user.login === playlist.username || playlist.contributors?.includes(user.login))"
						:show-header="false"
						:narrowed="true"
						:row-class="isStylePlaying"
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
	import dayjs from 'dayjs';
	import * as Toast from 'vue-toastification';
	import { DBPL, DBPLC } from 'kmserver-core/src/lib/types/database/playlist';
	import { KaraList, KaraList as KaraListType } from '%/lib/types/kara';
	import { useMenubarStore } from '~/store/menubar';
	import { useAuthStore } from '~/store/auth';
	import { useModalStore } from '~/store/modal';

	// @ts-ignore
	const useToast = Toast.useToast ?? Toast.default.useToast;

	const { createEditPlaylist, deletePlaylist } = storeToRefs(useModalStore());
	const { closeModal, openModal } = useModalStore();
	const { search } = storeToRefs(useMenubarStore());
	const { setResultsCount } = useMenubarStore();
	const { replace, push } = useRouter();
	const { t } = useI18n();
	const toast = useToast();

	const loading = ref(true);
	const karaokes = ref<KaraListType<DBPLC>>({ infos: { count: 0, from: 0, to: 0 }, i18n: {}, content: [] });
	const playlist = ref<DBPL>();
	const { params } = useRoute();
	const { href } = useRequestURL();
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const playing = ref<DBPLC>();
	const indexPlaying = ref(0);
	const draggingRow = ref<DBPLC>();
	const draggingRowIndex = ref<number>(0);
	const karaSearch = ref<{ label: string; value: string }[]>([]);

	const debouncedGetAsyncData = ref();

	setResultsCount(0);

	watch(search, loadNextPage);
	watch(karaokes, (karaokes) => setResultsCount(karaokes.infos.count), { deep: true });

	onMounted(() => {
		debouncedGetAsyncData.value = _.debounce(getAsyncData, 500, { leading: true, trailing: true, maxWait: 750 });
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

	function shareLink() {
		if (window.navigator.share) {
			window.navigator.share({ url: href });
		} else if (window.navigator.clipboard) {
			navigator.clipboard.writeText(href);
			toast.success(t('playlists.share_clipboard'));
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

	async function loadNextPage() {
		loading.value = true;
		const data = await useCustomFetch<KaraListType<DBPLC>>(`/api/playlist/${playlist.value?.plaid}`, {
			query: {
				filter: search.value || undefined
			}
		});
		for (const karaoke of data.content) {
			sortTypesKara(karaoke);
		}
		karaokes.value = data;
		loading.value = false;
		if (karaokes.value.content.length > 0) playing.value = karaokes.value.content[0];
	}

	function next() {
		if (indexPlaying.value < karaokes.value.content.length-1) {
			indexPlaying.value = indexPlaying.value + 1;
			if (karaokes.value.content[indexPlaying.value] && isPlayable(karaokes.value.content[indexPlaying.value])) {
				playing.value = karaokes.value.content[indexPlaying.value];
			} else {
				next();
			}
		}
	}

	function previous() {
		if (indexPlaying.value > 0) {
			indexPlaying.value = indexPlaying.value - 1;
			if (karaokes.value.content[indexPlaying.value] && isPlayable(karaokes.value.content[indexPlaying.value])) {
				playing.value = karaokes.value.content[indexPlaying.value];
			} else {
				previous();
			}
		}
	}

	function updatePlayer(karaoke: DBPLC) {
		indexPlaying.value = karaokes.value.content.findIndex(n => karaoke.plcid === n.plcid);
		playing.value = karaoke;
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

	async function exportPlaylist() {
		const exportFile = await useCustomFetch(`/api/playlist/${playlist.value?.plaid}/export`);
		const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportFile, null, 4));
		const dlAnchorElem = document.getElementById('downloadAnchorElem');
		if (dlAnchorElem) {
			dlAnchorElem.setAttribute('href', dataStr);
			dlAnchorElem.setAttribute(
				'download',
				`KaraMugen_${playlist.value?.name}_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.kmplaylist`
			);
			dlAnchorElem.click();
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
	@media screen and (max-width: 1024px) {
		.tile.is-parent {
			flex-direction: column;
		}
	}

	@media screen and (min-width: 769px) {
		.player {
			margin-right: 0.75rem
		}
	}

	.playing {
		background-color: #4b5253;

		&.first td:first-child {
			border-top-left-radius: 0.4em;
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
