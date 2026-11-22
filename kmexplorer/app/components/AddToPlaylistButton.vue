<template>
	<div>
		<DropdownMenuRoot v-if="loggedIn">
			<DropdownMenuTrigger
				class="button has-background-info mr-2"
				:class="{ 'is-loading': loading, 'inline': karaCard }"
				:title="$t(karaCard ? 'kara.playlists.add' : '')"
			>
				<font-awesome-icon fixed-width :icon="['fas', 'list']" />
				{{ $t(karaCard ? '' : 'kara.playlists.add') }}
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent
					class="dropdown-content"
				>
					<DropdownMenuItem
						v-if="playlists.length === 0"
						key="newplaylist"
						value="newplaylist"
						class="dropdown-item"
						@click="() => addToPlaylist()"
					>
						<DropdownMenuLabel class="dropdown-label">
							{{ $t('kara.playlists.create') }}
						</DropdownMenuLabel>
					</DropdownMenuItem>
					<DropdownMenuItem
						v-for="pl in playlists"
						:key="pl.plaid"
						:value="pl.plaid"
						class="dropdown-item"
						@click="() => addToPlaylist(pl)"
					>
						<DropdownMenuLabel class="dropdown-label">
							{{ pl.name }}
						</DropdownMenuLabel>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenuRoot>
		<button
			v-else-if="!loggedIn && !karaCard"
			class="button has-background-info"
			:class="{ 'is-loading': loading }"
			:title="$t('kara.playlists.add')"
			@click="() => openModal('auth')"
		>
			<font-awesome-icon
				fixed-width
				:icon="['fas', 'list']"
			/>
			{{ $t('kara.playlists.add') }}
		</button>
	</div>
	<add-duplicate-in-playlist-modal
		:active="addDuplicateInPlaylist && !!playlistSelected"
		:playlist="playlistSelected"
		@close="callApi"
	/>
</template>

<script setup lang="ts">
import type { DBPL } from '%/types/database/playlist';
import { storeToRefs } from 'pinia';
import {
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRoot,
	DropdownMenuTrigger,
} from 'reka-ui'

import * as Toast from 'vue-toastification';
import { useAuthStore } from '~/store/auth';
import { useModalStore } from '~/store/modal';

// @ts-expect-error vue-toastification is not typed
const useToast = Toast.useToast ?? Toast.default.useToast;

const props = defineProps<{
	kid: string
	loading: boolean
	playlists: DBPL[]
	karaCard?: boolean
}>();

const emit = defineEmits<{ (e: 'update-playlist'): void }>();

const { addDuplicateInPlaylist } = storeToRefs(useModalStore());
const { openModal } = useModalStore();
const { loggedIn, user } = storeToRefs(useAuthStore());
const { t } = useI18n();
const toast = useToast();

const playlistSelected = ref<DBPL>();

async function addToPlaylist(param?: DBPL) {
	let plaid;
	let isAlreadyInPlaylist = false;
	if (!param) {
		const res = await useCustomFetch<DBPL>('/api/playlist', {
			method: 'POST',
			body: {
				name: t('kara.playlists.new_playlist_label', { nickname: user?.value?.nickname }),
				flag_visible: true,
				flag_visible_online: true
			}
		});
		plaid = res.plaid as string;
		emit('update-playlist');
	} else {
		plaid = param.plaid as string;
		const playlists = await useCustomFetch<DBPL[]>('/api/playlist', {
			params: {
				containsKID: props.kid,
				slug: param.slug
			}
		});
		isAlreadyInPlaylist = playlists.length > 0;
	}
	if (isAlreadyInPlaylist) {
		playlistSelected.value = param;
		openModal('addDuplicateInPlaylist');
	} else {
		callApi(plaid);
	}
}

async function callApi(plaid?: string) {
	await useCustomFetch(`/api/playlist/${plaid}`, {
		method: 'POST',
		body: {
			kids: [props.kid]
		}
	});
	toast.success(t('kara.playlists.add_success'));
}
</script>
<style scoped lang="scss">
.button.inline {
	margin: 0.5em 0;
}

.dropdown-content {
	overflow: auto;
	background-color: #282f2f;
	border-radius: .4em;
	box-shadow: 0 .5em 1em -.125em #0a0a0a1a, 0 0 0 1px #0a0a0a05;
	padding-bottom: .5rem;
	padding-top: .5rem;

	.dropdown-item {
		padding: .375rem 0.5rem;
		display: flex;
		font-size: 0.9rem;
			&:hover {
				background-color: #36393F !important;
			}
		.dropdown-label {
			user-select: none;
			
		}
	}

}
</style>