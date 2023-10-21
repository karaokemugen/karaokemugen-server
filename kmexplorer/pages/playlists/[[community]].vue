<template>
	<div class="tile is-parent is-vertical">
		<search-bar
			class="buttons is-hidden-desktop"
			:filter="false"
			:results="false"
		/>
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
</template>

<script setup lang="ts">
	import { OrderParam } from 'kmserver-core/src/lib/types/playlist';
	import { DBPL } from 'kmserver-core/src/types/database/playlist';
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
	const { replace } = useRouter();

	const playlists = ref<DBPL[]>([]);
	const selectedPlaylist = ref<DBPL>();
	const loading = ref(true);

	watch(sort, fetch, { deep: true });
	watch(search, fetch);

	if (!loggedIn.value && !route.params.community) {
		replace('/playlists/community');
	}

	setResultsCount(0);
	onMounted(() => {
		setSearch('');
	});

	onUnmounted(() => {
		setSearch('');
	});

	async function fetch() {
		loading.value = true;
		playlists.value = await useCustomFetch<DBPL[]>('/api/playlist', {
			params: route.params?.community === 'community' ? {
				filter: search.value,
				order: (sort.value[route.name] as OrderParam) || undefined,
				reverseOrder: ['karacount', 'recent', 'duration'].includes(sort.value[route.name]) ? true : undefined
			} :
				{
					username: user?.value?.login,
					includeUserAsContributor: true,
					filter: search.value,
					order: (sort.value[route.name] as OrderParam) || undefined,
					reverseOrder: ['karacount', 'recent', 'duration'].includes(sort.value[route.name]) ? true : undefined
				}
		});
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
				await useCustomFetch<DBPL[]>('/api/playlist/import', {
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