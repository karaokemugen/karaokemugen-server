<template>
	<div
		v-for="pl in playlists.slice(0, maxIndexPlaylists)"
		:key="pl.plaid"
		class="my-2"
	>
		<nuxt-link :to="`/playlist/${pl.slug}`">
			<article class="tile is-child notification">
				<div class="is-flex is-justify-content-space-between">
					<div class="title">
						{{ pl.name }}
						<div class="subtitle">
							{{ pl.description }}
						</div>
					</div>
					<div class="title is-flex is-flex-direction-column is-align-items-end">
						<div>{{ $t('playlists.by_owner', { username: pl.username }) }}</div>
						<div
							v-if="pl.contributors && pl.contributors?.length > 0"
							class="subtitle"
						>
							{{ pl.contributors.length > 3 ?
								$t('playlists.and_contributors_more', {
									contributors: pl.contributors?.slice(0, 3).join(', '),
									count: pl.contributors.length - 3
								}) :
								$t('playlists.and_contributors', { contributors: pl.contributors?.slice(0, 3).join(', ') })
							}}
						</div>
					</div>
				</div>
				<div class="is-flex is-justify-content-space-between">
					<div class="subtitle">
						<font-awesome-icon :icon="['fas', pl.flag_visible_online ? 'globe' : 'lock']" />
						{{ pl.flag_visible_online ? $t('playlists.public') : $t('playlists.private') }}
						-
						{{ $t('playlists.karacount', { karacount: pl.karacount }) }}
						-
						{{ $t('playlists.duration', { duration: !pl.duration ? '0h' : getDurationString(pl.duration, $t) }) }}
					</div>
					<div
						v-if="withButtons"
						class="buttons"
					>
						<button
							v-if="pl.username === user?.login"
							class="button"
							@click.prevent="() => emit('edit', pl)"
						>
							<font-awesome-icon :icon="['fas', 'pen']" />
							<span>{{ $t('playlists.edit') }}</span>
						</button>
						<button
							class="button"
							@click.prevent="() => exportPlaylist(pl)"
						>
							<font-awesome-icon :icon="['fas', 'download']" />
							<span>{{ $t('playlists.export') }}</span>
						</button>
						<button
							v-if="pl.username === user?.login"
							class="button"
							@click.prevent="() => emit('delete', pl)"
						>
							<font-awesome-icon :icon="['fas', 'trash']" />
							<span>{{ $t('playlists.delete') }}</span>
						</button>
					</div>
				</div>
			</article>
		</nuxt-link>
	</div>
	<div v-if="maxIndexPlaylists < playlists.length">
		<div class="box">
			<h4 class="title is-4 with-img">
				<img
					src="~/assets/nanami-surpris.png"
					alt="Nanamin surprised"
				>
				<nuxt-link :onclick="() => maxIndexPlaylists = maxIndexPlaylists + chunkSize">
					{{ $t('layout.end_playlists', {
						number: (maxIndexPlaylists + chunkSize) > playlists.length ?
							playlists.length - chunkSize : chunkSize
					}) }}
				</nuxt-link>
			</h4>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import dayjs from 'dayjs';
	import { DBPL } from 'kmserver-core/src/lib/types/database/playlist';
	import { useAuthStore } from '~/store/auth';

	const { user } = storeToRefs(useAuthStore());

	const props = defineProps<{
		playlists: DBPL[]
		chunkSize: number
		withButtons?: boolean
	}>();

	const emit = defineEmits<{ (e: 'delete' | 'edit', playlist: DBPL): void }>();

	const maxIndexPlaylists = ref(props.chunkSize);

	async function exportPlaylist(pl: DBPL) {
		const exportFile = await useCustomFetch(`/api/playlist/${pl.plaid}/export`);
		const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportFile, null, 4));
		const dlAnchorElem = document.getElementById('downloadAnchorElem');
		if (dlAnchorElem) {
			dlAnchorElem.setAttribute('href', dataStr);
			dlAnchorElem.setAttribute(
				'download',
				`KaraMugen_${pl.name}_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.kmplaylist`
			);
			dlAnchorElem.click();
		}
	}
</script>
<style scope lang="scss">
	a {
		color: white;
	}

	.title.is-4.with-img {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;

		@media screen and (max-width: 1024px) {
			flex-direction: column;
		}

		img {
			height: 2.5em;
		}

		margin-bottom: 0;
	}
</style>