<template>
	<div class="tile is-ancestor is-vertical">
		<div
			v-if="karaoke"
			class="tile is-parent is-12"
		>
			<div
				class="tile is-child"
				:class="{ 'is-8': !videoOpened, 'is-5': videoOpened }"
			>
				<kara-full-info :karaoke="karaoke" />
			</div>
			<div class="tile is-4-desktop-only is-parent is-vertical">
				<div
					v-if="live"
					class="tile is-child"
				>
					<live-player
						:karaoke="karaoke"
						@open="placeForVideo"
						@close="closeVideo"
					/>
				</div>
				<div
					v-else
					class="tile is-child"
				>
					<div class="box">
						<img
							:src="`${hardsubUrl}/previews/${karaoke?.kid}.${karaoke?.mediasize}.25.jpg`"
							alt=""
						>
						<div class="message is-info">
							<div class="message-body">
								{{ t('kara.live_unavailable') }}
							</div>
						</div>
					</div>
				</div>
				<div
					v-show="!videoOpened"
					v-if="!mp3"
					class="tile is-child"
				>
					<div class="box">
						<div class="imgGroup">
							<img
								:src="`${hardsubUrl}/previews/${karaoke?.kid}.${karaoke?.mediasize}.33.jpg`"
								alt=""
							>
							<img
								:src="`${hardsubUrl}/previews/${karaoke?.kid}.${karaoke?.mediasize}.50.jpg`"
								alt=""
							>
						</div>
					</div>
				</div>
				<div class="tile is-child">
					<kara-report :karaoke="karaoke" />
				</div>
			</div>
		</div>
		<div class="tile is-parent is-vertical relatives">
			<template v-if="karaoke?.parents && karaoke.parents.length > 0">
				<kara-query
					:kids="karaoke?.parents"
					:with-suggest="false"
					:with-search="false"
					:ignore-filter="true"
					:title="t('kara.parents')"
				/>
			</template>
			<template v-if="karaoke?.children && karaoke.children.length > 0">
				<kara-query
					:kids="karaoke?.children"
					:with-suggest="false"
					:with-search="false"
					:ignore-filter="true"
					:title="t('kara.childrens')"
				/>
			</template>
			<template v-if="karaoke?.siblings && karaoke.siblings.length > 0">
				<kara-query
					:kids="karaoke?.siblings"
					:with-suggest="false"
					:with-search="false"
					:ignore-filter="true"
					:title="t('kara.siblings')"
				/>
			</template>
			<div v-if="playlists.length > 0">
				<div class="title-box">
					<h1 class="title with-button">
						<font-awesome-icon
							:icon="['fas', 'list']"
							fixed-width
						/>
						{{ $t('profile.playlists_count', playlists.length) }}
					</h1>
				</div>
				<playlist-list
					:playlists="playlists"
					:chunk-size="10"
				/>
			</div>
			<div v-if="otherLikedKIDs.length > 0" class="mt-3">
				<kara-query
					:kids="otherLikedKIDs"
					:with-suggest="false"
					:with-search="false"
					:ignore-filter="true"
					:title="t('kara.other_liked')"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { DBKara } from '%/lib/types/database/kara';
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';
	import slug from 'slug';
	import { useAuthStore } from '~/store/auth';
	import { useConfigStore } from '~/store/config';

	const karaoke = ref<DBKara>();
	const videoOpened = ref(false);
	const playlists = ref<DBPL[]>([]);
	const otherLikedKIDs = ref<string[]>([]);

	const { config, supportedFiles } = storeToRefs(useConfigStore());
	const url = useRequestURL();
	const hardsubUrl = config?.value?.Hardsub?.Url ?? url.origin;

	const route = useRoute();
	const { t } = useI18n();

	const { user } = storeToRefs(useAuthStore());

	definePageMeta({
		key: 'static'
	});

	async function fetch() {
		const oldKaraSlug = route.params.slug;
		let kid = route.params.id;
		let theater = route.params.theater;
		if (kid === 'theater') {
			// Resolve a slug-less url scheme with theater mode (/base/kara/<kid>/theater)
			theater = kid;
			kid = undefined;
		}
		if (!kid) {
			// Resolve a slug-less url scheme (/base/kara/<kid>)
			kid = oldKaraSlug;
		}
		try {
			const res = await useCustomFetch<DBKara>(`/api/karas/${kid}`);
			const karaSlug = slug(res.titles[res.titles_default_language || 'eng'] || '');
			if (import.meta.client && karaSlug !== oldKaraSlug) {
				navigateTo({ params: { id: kid, slug: karaSlug, theater: theater }, query: route.query }, { replace: true });
			}
			res.songtypes = sortAndHideTags(res.songtypes, true);
			karaoke.value = res;

			if (res.repository === 'Staging') throw createError({ statusCode: 404, message: t('kara.notfound') });
		} catch (_) {
			throw createError({ statusCode: 404, message: t('kara.notfound') });
		}
	}

	useHead({
		title: computed(() => karaoke.value?.titles[karaoke.value.titles_default_language || '']),
		meta: computed(() => [
			{ key: 'twitter:card', name: 'twitter:card', content: 'player' },
			{ key: 'og:type', property: 'og:type', content: 'article' },
			{ key: 'og:description', property: 'og:description', content: t('layout.slogan') as string },
			{ key: 'twitter:player', name: 'twitter:player', content: `${url.origin}${url.pathname}${url.pathname.endsWith('/theater') ? '' : '/theater'}` },
			{ key: 'twitter:player:height', name: 'twitter:player:height', content: '720' },
			{ key: 'twitter:player:width', name: 'twitter:player:width', content: '1280' },
			{ key: 'og:image', property: 'og:image', content: karaoke.value?.warnings?.length ? `${url.origin}/banners/cropped.jpg` : `${hardsubUrl}/previews/${karaoke.value?.kid}.${karaoke.value?.mediasize}.25.jpg` },
			{ key: 'twitter:image', name: 'twitter:image', content: karaoke.value?.warnings?.length ? `${url.origin}/banners/cropped.jpg` : `${hardsubUrl}/previews/${karaoke.value?.kid}.${karaoke.value?.mediasize}.25.jpg` },
			// hardsub compatibility for apps that use youtube-dl for direct streaming (without breaking the card view as with og:type video) 
			// twitter:player:stream assumes a raw stream and is checked before twitter:player https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/generic.py#L3662
			{ key: 'twitter:player:stream', name: 'twitter:player:stream', content: karaoke.value?.hardsubbed_mediafile && live.value ? `${hardsubUrl}/hardsubs/${karaoke.value?.hardsubbed_mediafile}` : '' },
		// The rest of meta tags is handled by KaraFullInfo.vue
		])
	});

	const mp3 = computed(() => supportedFiles?.value?.audio.some(extension => karaoke.value?.mediafile.endsWith(extension)));
	const live = computed(() => karaoke.value && isPlayable(karaoke.value, user?.value?.roles?.admin));

	watch(() => [route.query, route.params], refresh);
	
	await refresh();

	async function refresh() {
		await fetch();
		getPlaylists();
		getOtherLikedKIDs();
	}

	async function getPlaylists() {
		playlists.value = await useCustomFetch<DBPL[]>('/api/playlist', {
			params: {
				containsKID: karaoke.value?.kid
			}
		});
	}

	async function getOtherLikedKIDs() {
		otherLikedKIDs.value = (await useCustomFetch<{kid: string, favcount: number}[]>(`/api/karas/${karaoke.value?.kid}/otherlikedsongs`)).map(r => r.kid);
	}

	function placeForVideo() {
		videoOpened.value = true;
	}
	function closeVideo() {
		videoOpened.value = false;
	}
</script>

<style scoped lang="scss">
	.tile.is-child {
		transition: width 0.8s;
	}

	.imgGroup {
		display: flex;
		flex-wrap: nowrap;

		img {
			// Stupid workaround for Chrom*-based browsers
			// https://discordapp.com/channels/84245347336982528/324208228680466434/718601114618036254
			width: 100%;
			height: 100%;
			min-width: 0;
		}

		img:last-child {
			margin-left: 0.25em;
		}
	}

	.tile.is-4-desktop-only.is-parent.is-vertical > .tile.is-child {
		flex-grow: 0;
	}

	.tile.is-vertical {
		padding: 0 1em;
	}

	@media (max-width: 769px) {
		.tile.is-vertical {
			padding: 1em 0;
		}
	}

	.message.is-info {
		background-color: #3771dc;
		.message-body {
			border-color: #375a7f;
			color: #fff;
		}
	}

	.title-box {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		@media screen and (max-width: 769px) {
			flex-direction: column;
			align-items: flex-start;
		}
		margin-bottom: .5rem;
	}

	.relatives {
		margin-top: 1.5rem;
	}
</style>
