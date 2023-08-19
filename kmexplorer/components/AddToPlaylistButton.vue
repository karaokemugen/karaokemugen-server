<template>
	<o-dropdown
		v-if="loggedIn"
		aria-role="list"
		class="mr-2"
		scrollable
	>
		<template #trigger>
			<button
				class="button has-background-info"
				:class="{ 'is-loading': loading, 'inline': karaCard }"
				:title="$t(karaCard ? 'kara.playlists.add' : '')"
			>
				<font-awesome-icon
					fixed-width
					:icon="['fas', 'list']"
				/>
				{{ $t(karaCard ? '' : 'kara.playlists.add') }}
			</button>
		</template>
		<o-dropdown-item
			v-if="playlists.length === 0"
			key="newplaylist"
			value="newplaylist"
			aria-role="listitem"
			item-active-class="active-class"
			@click="() => addToPlaylist('newplaylist')"
		>
			{{ $t('kara.playlists.create') }}
		</o-dropdown-item>
		<o-dropdown-item
			v-for="pl in playlists"
			:key="pl.plaid"
			:value="pl.plaid"
			aria-role="listitem"
			item-active-class="active-class"
			@click="() => addToPlaylist(pl.plaid)"
		>
			{{ pl.name }}
		</o-dropdown-item>
	</o-dropdown>
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
</template>

<script setup lang="ts">
	import { DBPL } from 'kmserver-core/src/lib/types/database/playlist';
	import { storeToRefs } from 'pinia';
	import { useToast } from 'vue-toastification';
	import { useAuthStore } from '~/store/auth';
	import { useModalStore } from '~/store/modal';

	const props = defineProps<{
		kid: string
		loading: boolean
		playlists: DBPL[]
		karaCard?: boolean
	}>();

	const { openModal } = useModalStore();
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { t } = useI18n();
	const toast = useToast();

	async function addToPlaylist(param?: string) {
		let plaid;
		if (param === 'newplaylist') {
			const res = await useCustomFetch<DBPL>('/api/playlist', {
				method: 'POST',
				body: {
					name: t('kara.playlists.new_playlist_label', { nickname: user?.value?.nickname }),
					flag_visible: true,
					flag_visible_online: true
				}
			});
			plaid = res.plaid;
		} else {
			plaid = param;
		}

		if (plaid) {
			await useCustomFetch(`/api/playlist/${plaid}`, {
				method: 'POST',
				body: {
					kids: [props.kid]
				}
			});
			toast.success(t('kara.playlists.add_success'));
		}
	}
</script>
<style scoped lang="scss">
	.button.inline {
		margin: 0.5em 0;
	}

	.active-class {
		color: white !important;
		background-color: #282f2f !important;

		&:hover {
			background-color: #36393F !important;
		}
	}
</style>