<template>
	<div class="tile is-ancestor is-vertical">
		<div
			v-if="karaoke"
			class="tile is-parent is-12"
		>
			<div
				ref="leftTile"
				class="tile is-child"
				:class="{ 'is-8': !liveOpened, 'is-5': liveOpened }"
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
						@open="placeForLive"
						@close="closeLive"
					/>
				</div>
				<div
					v-else
					class="tile is-child"
				>
					<div class="box">
						<img
							:src="`${hardsubUrl}previews/${karaoke?.kid}.${karaoke?.mediasize}.25.jpg`"
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
					v-show="!liveOpened"
					v-if="!mp3"
					class="tile is-child"
				>
					<div class="box">
						<div class="imgGroup">
							<img
								:src="`${hardsubUrl}previews/${karaoke?.kid}.${karaoke?.mediasize}.33.jpg`"
								alt=""
							>
							<img
								:src="`${hardsubUrl}previews/${karaoke?.kid}.${karaoke?.mediasize}.50.jpg`"
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
				<div class="title-box">
					<h1 class="title">
						{{ t('kara.parents') }}
					</h1>
				</div>
				<kara-query
					:kids="karaoke?.parents"
					:with-suggest="false"
					:with-search="false"
					:ignore-filter="true"
				/>
			</template>
			<template v-if="karaoke?.children && karaoke.children.length > 0">
				<div class="title-box">
					<h1 class="title">
						{{ t('kara.childrens') }}
					</h1>
				</div>
				<kara-query
					:kids="karaoke?.children"
					:with-suggest="false"
					:with-search="false"
					:ignore-filter="true"
				/>
			</template>
			<template v-if="karaoke?.siblings && karaoke.siblings.length > 0">
				<div class="title-box">
					<h1 class="title">
						{{ t('kara.siblings') }}
					</h1>
				</div>
				<kara-query
					:kids="karaoke?.siblings"
					:with-suggest="false"
					:with-search="false"
					:ignore-filter="true"
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
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { DBKara } from '%/lib/types/database/kara';
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';
	import slug from 'slug';
	import { useAuthStore } from '~/store/auth';

	const karaoke = ref<DBKara>();
	const liveOpened = ref(false);
	const leftTile = ref<HTMLElement>();
	const playlists = ref<DBPL[]>([]);

	const conf = useRuntimeConfig();
	const apiUrl = conf.public.API_URL;
	const hardsubUrl = conf.public.HARDSUB_URL;

	const route = useRoute();
	const requestURL = useRequestURL();
	requestURL.protocol = 'https:';
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
			kid = null;
		}
		if (!kid) {
			// Resolve a slug-less url scheme (/base/kara/<kid>)
			kid = oldKaraSlug;
		}
		try {
			const res = await useCustomFetch<DBKara>(`/api/karas/${kid}`);
			const karaSlug = slug(res.titles[res.titles_default_language || 'eng']);
			if (karaSlug !== oldKaraSlug) {
				navigateTo({ params: { id: kid, slug: karaSlug, theater: theater }, query: route.query }, { replace: true });
			}
			res.songtypes = sortAndHideTags(res.songtypes, true);
			karaoke.value = res;
		} catch (e) {
			throw createError({ statusCode: 404, message: t('kara.notfound') });
		}
	}

	useHead({
		// @ts-expect-error: no?
		title: computed(() => karaoke.value?.titles[karaoke.value.titles_default_language]),
		meta: computed(() => [
			{ hid: 'twitter:card', name: 'twitter:card', content: 'player' },
			{ hid: 'og:type', property: 'og:type', content: 'article' },
			{ hid: 'og:description', property: 'og:description', content: t('layout.slogan') as string },
			// @ts-expect-error: No. :c
			{ hid: 'twitter:player', name: 'twitter:player', content: `${requestURL.origin}${requestURL.pathname}${requestURL.pathname.endsWith('/theater') ? '' : '/theater'}` },
			{ hid: 'twitter:player:height', name: 'twitter:player:height', content: '720' },
			{ hid: 'twitter:player:width', name: 'twitter:player:width', content: '1280' },
			// @ts-expect-error: No. :c
			{ hid: 'og:image', property: 'og:image', content: karaoke.value?.warnings?.length ? `${apiUrl}banners/cropped.jpg` : `${hardsubUrl}previews/${karaoke.value?.kid}.${karaoke.value?.mediasize}.25.jpg` },
			// @ts-expect-error: rah :O
			{ hid: 'twitter:image', name: 'twitter:image', content: karaoke.value?.warnings?.length ? `${apiUrl}banners/cropped.jpg` : `${hardsubUrl}previews/${karaoke.value?.kid}.${karaoke.value?.mediasize}.25.jpg` },
			// hardsub compatibility for apps that use youtube-dl for direct streaming (without breaking the card view as with og:type video) 
			// twitter:player:stream assumes a raw stream and is checked before twitter:player https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/generic.py#L3662
			// @ts-expect-error: No. :c
			{ hid: 'twitter:player:stream', name: 'twitter:player:stream', content: karaoke.value?.hardsubbed_mediafile && live.value ? `${hardsubUrl}hardsubs/${karaoke.value?.hardsubbed_mediafile}` : '' },

		// The rest of meta tags is handled by KaraFullInfo.vue
		])
	});

	const mp3 = computed(() => conf.public.SUPPORTED_AUDIO.some(extension => karaoke.value?.mediafile.endsWith(extension)));
	const live = computed(() => karaoke.value && isPlayable(karaoke.value, user?.value?.roles?.admin));

	watch(() => [route.query, route.params], refresh);
	
	await refresh();

	async function refresh() {
		await fetch();
		getPlaylists();
	}

	async function getPlaylists() {
		playlists.value = await useCustomFetch<DBPL[]>('/api/playlist', {
			params: {
				containsKID: karaoke.value?.kid
			}
		});
	}

	function placeForLive() {
		liveOpened.value = true;
	}
	function closeLive() {
		liveOpened.value = false;
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
