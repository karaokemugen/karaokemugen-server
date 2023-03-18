<template>
	<div class="tile is-ancestor is-vertical">
		<div
			v-if="karaoke"
			class="tile is-parent is-12"
		>
			<div
				ref="leftTile"
				class="tile is-child"
				:class="{'is-8': !liveOpened, 'is-5': liveOpened}"
			>
				<kara-full-info
					:karaoke="karaoke"
				/>
			</div>
			<div class="tile is-4-desktop-only is-parent is-vertical">
				<div
					v-if="liveURL && live"
					class="tile is-child"
				>
					<live-player
						:karaoke="karaoke"
						:transition="liveTransition"
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
							:src="`${apiUrl}previews/${karaoke?.kid}.${karaoke?.mediasize}.25.jpg`"
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
								:src="`${apiUrl}previews/${karaoke?.kid}.${karaoke?.mediasize}.33.jpg`"
								alt=""
							>
							<img
								:src="`${apiUrl}previews/${karaoke?.kid}.${karaoke?.mediasize}.50.jpg`"
								alt=""
							>
						</div>
					</div>
				</div>
				<div class="tile is-child">
					<kara-report
						:karaoke="karaoke"
					/>
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
				/>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { DBKara } from '%/lib/types/database/kara';
	import { tagTypes } from '~/assets/constants';

	const karaoke = ref<DBKara>();
	const liveOpened = ref(false);
	const liveTransition = ref(false);
	const leftTile = ref<HTMLElement>();

	const conf = useRuntimeConfig();
	const liveURL = conf.public.LIVE_URL;
	const apiUrl = conf.public.API_URL;

	const { params } = useRoute();
	const { t } = useI18n();

	fetch();

	async function fetch() {
		let kid = params.id;
		if (!kid) {
			// Resolve a slug-less url scheme (/base/kara/<kid>)
			kid = params.slug;
		}
		try {
			const res = await useCustomFetch<DBKara>(`/api/karas/${kid}`);
			karaoke.value = sortTypesKara(res);
		} catch (e) {
			throw createError({ statusCode: 404, message: t('kara.notfound') as string });
		}
	}

	useHead({
		// @ts-ignore: no?
		title: computed(() => karaoke.value?.titles[karaoke.value.titles_default_language]),
		meta: computed(() => [
			{ hid: 'twitter:card', name: 'twitter:card', content: 'player' },
			{ hid: 'og:type', property: 'og:type', content: 'article' },
			{ hid: 'og:description', property: 'og:description', content: t('layout.slogan') as string },
			// @ts-ignore: No. :c
			{ hid: 'twitter:player', name: 'twitter:player', content: `${liveURL}/?video=${karaoke.value?.kid}` },
			{ hid: 'twitter:player:height', name: 'twitter:player:height', content: '720' },
			{ hid: 'twitter:player:width', name: 'twitter:player:width', content: '1280' },
			// @ts-ignore: No. :c
			{ hid: 'og:image', property: 'og:image', content: `${apiUrl}previews/${karaoke.value?.kid}.${karaoke.value?.mediasize}.25.jpg` },
			// @ts-ignore: rah :O
			{ hid: 'twitter:image', name: 'twitter:image', content: `${apiUrl}previews/${karaoke.value?.kid}.${karaoke.value?.mediasize}.25.jpg` },
			// hardsub compatibility for apps that use youtube-dl for direct streaming (without breaking the card view as with og:type video) 
			// see https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/generic.py#L3620
			// @ts-ignore: No. :c
			{ name: 'video_url', content: karaoke.value?.hardsubbed_mediafile ? `source=${apiUrl}hardsubs/${karaoke.value?.hardsubbed_mediafile}` : '' }, 

			// The rest of meta tags is handled by KaraFullInfo.vue
		])
	});

	const mp3 = computed(() => karaoke.value?.mediafile.endsWith('.mp3'));
	const live = computed(() => {
		// Loop all tags to find a tag with noLiveDownload
		let noLiveDownload = false;
		if (karaoke.value) {
			for (const tagType in tagTypes) {
				if (tagType === 'years') { continue; }
				// @ts-ignore: il est 23h27 <- ceci n'est pas une raison
				for (const tag of karaoke.value[tagType]) {
					if (tag.noLiveDownload) {
						noLiveDownload = true;
					}
				}
			}
		}
		return !noLiveDownload && (karaoke.value?.mediafile.endsWith('.mp3') || karaoke.value?.mediafile.endsWith('.mp4'));
	});

	function placeForLive() {
		liveOpened.value = true;
		leftTile.value?.addEventListener('transitionend', transitionLive, { once: true });
	}
	function transitionLive() {
		liveTransition.value = true;
	}
	function closeLive() {
		liveTransition.value = false;
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
