<template>
	<article
		class="tile is-child"
	>
		<div class="is-flex is-justify-content-space-between">
			<div class="title">
				{{ playlist.name }}
				<div class="subtitle">
					{{ playlist.description }}
				</div>
			</div>
			<div class="title playlist-owner">
				<div>
					<i18n-t
						keypath="playlists.by_owner"
					>
						<template #nickname>
							<nuxt-link :to="`/user/${playlist.username}`">
								{{ playlist.nickname }}
							</nuxt-link>
						</template>
					</i18n-t>
				</div>
				<div
					v-if="playlist.contributors && playlist.contributors?.length > 0"
					class="subtitle"
				>
					<div>
						<i18n-t
							:keypath="playlist.contributors.length > 3 ? 'playlists.and_contributors_more' : 'playlists.and_contributors'"
						>
							<template #contributors>
								<span
									v-for="(contributor, index) in playlist.contributors.slice(0, 3)"
									:key="contributor.username"
								>
									<nuxt-link :to="`/user/${contributor.username}`">
										{{ contributor.nickname }}
									</nuxt-link>{{ index === 2 || index === playlist.contributors.length - 1 ? '' : ', ' }}
								</span>
							</template>
							<template #count>
								<span> {{ playlist.contributors.length - 3 }}</span>
							</template>
						</i18n-t>
					</div>
				</div>
			</div>
		</div>
		<div
			class="is-flex is-justify-content-space-between"
			:class="{ 'is-flex-direction-column': playlistPage }"
		>
			<div class="subtitle">
				<font-awesome-icon :icon="['fas', playlist.flag_visible_online ? 'globe' : 'lock']" />
				{{ playlist.flag_visible_online ? $t('playlists.public') : $t('playlists.private') }}
				-
				{{ $t('playlists.karacount', { karacount: playlist.karacount }) }}
				-
				{{ $t('playlists.duration', {
					duration: !playlist.duration ? `0 ${t('duration.hours')}` : getDurationString(playlist.duration, $t, false)
				}) }}
			</div>
			<div
				v-if="withButtons"
				class="buttons"
			>
				<button
					v-if="playlist.username === user?.login"
					class="button"
					@click.prevent="() => emit('edit', playlist)"
				>
					<font-awesome-icon :icon="['fas', 'pen']" />
					<span>{{ $t('playlists.edit') }}</span>
				</button>
				<button
					v-if="playlistPage"
					class="button"
					@click.prevent="exportPlaylist"
				>
					<font-awesome-icon :icon="['fas', 'download']" />
					<span>{{ $t('playlists.export') }}</span>
				</button>
				<button
					v-if="playlistPage"
					class="button"
					@click.prevent="shareLink"
				>
					<font-awesome-icon :icon="['fas', 'share']" />
					<span>{{ $t('playlists.share') }}</span>
				</button>
				<button
					v-if="playlist.username === user?.login"
					class="button"
					@click.prevent="() => emit('delete', playlist)"
				>
					<font-awesome-icon :icon="['fas', 'trash']" />
					<span>{{ $t('playlists.delete') }}</span>
				</button>
			</div>
		</div>
	</article>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import dayjs from 'dayjs';
	import * as Toast from 'vue-toastification';
	import { DBPL } from 'kmserver-core/src/lib/types/database/playlist';
	import { useAuthStore } from '~/store/auth';

	// @ts-ignore
	const useToast = Toast.useToast ?? Toast.default.useToast;

	const { user } = storeToRefs(useAuthStore());
	const { href } = useRequestURL();
	const { t } = useI18n();
	const toast = useToast();

	const props = defineProps<{
		playlist: DBPL
		withButtons?: boolean
		playlistPage?: boolean
	}>();

	const emit = defineEmits<{ (e: 'delete' | 'edit', playlist: DBPL): void }>();

	async function exportPlaylist() {
		const exportFile = await useCustomFetch(`/api/playlist/${props.playlist.plaid}/export`);
		const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportFile, null, 4));
		const dlAnchorElem = document.getElementById('downloadAnchorElem');
		if (dlAnchorElem) {
			dlAnchorElem.setAttribute('href', dataStr);
			dlAnchorElem.setAttribute(
				'download',
				`KaraMugen_${props.playlist.name}_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.kmplaylist`
			);
			dlAnchorElem.click();
		}
	}

	function shareLink() {
		if (window.navigator.share) {
			try {
				window.navigator.share({ url: href });
			} catch (e) {
				toast.error(t('toast.PL_SHARE_ERROR'));
			}
		} else if (window.navigator.clipboard) {
			try {
				window.navigator.clipboard.writeText(href);
				toast.success(t('toast.PL_SHARE_CLIPBOARD_SUCCESS'));
			} catch (e) {
				toast.error(t('toast.PL_SHARE_CLIPBOARD_FAIL'));
			}
		}
	}

</script>
<style scoped lang="scss">
.playlist-owner {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	min-width: 6em;
}

@media screen and (max-width: 768px) {
	.is-flex {
		flex-direction: column;
	}

	.playlist-owner {
		align-items: start;
		margin-bottom: 0.5em;
	}
}
</style>
