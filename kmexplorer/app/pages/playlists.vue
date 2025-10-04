<template>
	<div class="tile is-ancestor">
		<div class="tile is-parent is-vertical">
			<div class="tile is-hidden-desktop">
				<search-bar />
			</div>
			<div
				v-if="loggedIn"
				class="tabs is-fullwidth is-small"
			>
				<ul>
					<li 
						:onclick="() => playlistType = 'community'"
						:class="{'is-active': playlistType === 'community'}"
					>
						<a>
							<span class="icon"><font-awesome-icon :icon="['fas', 'globe']" /></span>
							<span>{{ $t('playlists.community') }}</span>
						</a>
					</li>
					<li
						:onclick="() => playlistType = 'favorites'"
						:class="{'is-active': playlistType === 'favorites'}"
					>
						<a>
							<span class="icon"><font-awesome-icon :icon="['fas', 'star']" /></span>
							<span>{{ $t('playlists.favorites') }}</span>
						</a>
					</li>
					<li
						:onclick="() => playlistType = 'personal'"
						:class="{'is-active': playlistType === 'personal'}"
					>
						<a>
							<span class="icon"><font-awesome-icon :icon="['fas', 'user']" /></span>
							<span>{{ $t('playlists.my_playlists') }}</span>
						</a>
					</li>
				</ul>
			</div>
			<div
				v-if="!loading"
				class="buttons"
			>
				<button
					class="button"
					@click="() => loggedIn ? openModal('createEditPlaylist') : openModal('auth')"
				>
					<font-awesome-icon :icon="['fas', 'plus']" />
					<span>{{ $t('playlists.create') }}</span>
				</button>
				<button
					class="button"
					@click="() => !loggedIn && openModal('auth')"
				>
					<input
						v-if="loggedIn"
						class="file-input"
						type="file"
						name="importplaylist"
						accept=".kmplaylist"
						:onChange="importPlaylist"
					>
					<font-awesome-icon :icon="['fas', 'file-import']" />
					<span>{{ $t('playlists.import') }}</span>
				</button>
			</div>
			<playlist-list
				v-if="!loading"
				:playlists="playlists"
				:chunk-size="30"
				:with-buttons="true"
				@delete="openDeletePlaylistModal"
				@edit="openEditPlaylistModal"
			/>
			<div v-if="!loading">
				<create-edit-playlist-modal
					:active="createEditPlaylist"
					:slug="selectedPlaylist?.slug"
					@close="afterCreatePlaylist"
				/>
				<delete-playlist-modal
					:active="deletePlaylist"
					:playlist="selectedPlaylist"
					@close="afterDeletePlaylist"
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
	import type { OrderParam, PLParams } from 'kmserver-core/src/lib/types/playlist';
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';
	import { storeToRefs } from 'pinia';
	import { useAuthStore } from '~/store/auth';
	import { useMenubarStore } from '~/store/menubar';
	import { useModalStore } from '~/store/modal';

	const { createEditPlaylist, deletePlaylist } = storeToRefs(useModalStore());
	const { closeModal, openModal } = useModalStore();
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { search, sort } = storeToRefs(useMenubarStore());
	const { setSearch, setResultsCount } = useMenubarStore();
	const route = useRoute();

	const playlists = ref<DBPL[]>([]);
	const selectedPlaylist = ref<DBPL>();
	const loading = ref(true);
	const playlistType = ref<'community' | 'favorites' | 'personal'>('community');

	watch(sort, fetch, { deep: true });
	watch(search, fetch);
	watch(playlistType, fetch);

	setResultsCount(0);

	onBeforeMount(() => setSearch(''));

	onUnmounted(() => setSearch(''));

	async function fetch() {
		loading.value = true;
		let params: PLParams = {
			filter: search.value,
			order: (sort.value[route.name] as OrderParam) || undefined,
			reverseOrder: ['karacount', 'recent', 'duration'].includes(sort.value[route.name]) ? true : undefined
		};
		if (playlistType.value === 'personal') {
			params = {
				...params,
				byUsername: user?.value?.login,
				includeUserAsContributor: true,
			};
		} else if (playlistType.value === 'favorites') {
			params = {
				...params,
				favorites: user?.value?.login,
			};
		}

		playlists.value = await useCustomFetch<DBPL[]>('/api/playlist', { params });
		setResultsCount(playlists.value.length);
		loading.value = false;
	}

	function openDeletePlaylistModal(pl: DBPL) {
		selectedPlaylist.value = pl;
		openModal('deletePlaylist');
	}

	async function afterDeletePlaylist(plaid?: string) {
		closeModal('deletePlaylist');
		selectedPlaylist.value = undefined;
		if (plaid) playlists.value = playlists.value.filter(pl => pl.plaid !== plaid);
	}

	function afterCreatePlaylist() {
		selectedPlaylist.value = undefined;
		closeModal('createEditPlaylist');
		fetch();
	}

	function openEditPlaylistModal(pl: DBPL) {
		selectedPlaylist.value = pl;
		openModal('createEditPlaylist');
	}

	function importPlaylist(e: any) {
		if (!window.FileReader) return alert('FileReader API is not supported by your browser.');
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			const fr = new FileReader();
			fr.onload = async () => {
				await useCustomFetch('/api/playlist/import', {
					method: 'POST',
					body: {
						pl: JSON.parse(fr.result as string)
					}
				});
				fetch();
			};
			fr.readAsText(file);
		}
	}

	fetch();

</script>

<style scoped lang="scss">
	.tabs {
		font-size: 1.5rem;
	}

	@media (max-width: 1024px) {
		.tabs {
			font-size: 1.25rem;
		}
	}
	
	@media (max-width: 768px) {
		.tabs {
			font-size: 0.85em;
		}
	}
</style>