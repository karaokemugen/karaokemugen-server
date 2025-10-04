<template>
	<div class="box">
		<div>
			<Teleport
				to="body"
				:disabled="!theaterMode && !fullscreen"
			>
				<div :class="{ 'theater': theaterMode || fullscreen }">
					<video-component
						:title="buildKaraTitle(props.karaoke, undefined, true)"
						:class="{ 'theater-player': theaterMode || fullscreen }"
						:options="videoOptions"
						:fullscreen="fullscreen"
						:theater-mode="theaterMode"
						:playlist-mode="playlistMode"
						:is-iframe="isIframe"
						:theatermodechange="changeTheaterMode"
						:fullscreenchange="changeFullscreen"
						:play="showPlayer"
						:next="next"
						:previous="previous"
						@send-played="sendPlayed"
					/>
				</div>
			</Teleport>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { DBKara } from '%/lib/types/database/kara';
	import type { KaraList as KaraListType } from '%/lib/types/kara';
	import { storeToRefs } from 'pinia';
	import deJson from 'video.js/dist/lang/de.json';
	import enJson from 'video.js/dist/lang/en.json';
	import frJson from 'video.js/dist/lang/fr.json';
	import ptJson from 'video.js/dist/lang/pt-PT.json';
	import esJson from 'video.js/dist/lang/es.json';
	import { useAuthStore } from '~/store/auth';
	import { useLocalStorageStore } from '~/store/localStorage';
	import slug from 'slug';
	import { useConfigStore } from '~/store/config';
	import type { CustomDocument, CustomElement } from '~/types/htmlelement';

	const props = defineProps<{
		karaoke: DBKara
		playlistMode?: boolean
	}>();

	const emit = defineEmits<{ (e?: 'open' | 'close' | 'next' | 'previous'): void }>();

	const route = useRoute();
	const { push } = useRouter();
	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { locale } = useI18n();

	const { config } = storeToRefs(useConfigStore());
	const url = useRequestURL();
	const hardsubUrl = config?.value?.Hardsub?.Url ?? url.origin;

	const mediaHardsubUrl = computed(() => {
		return `${hardsubUrl}/hardsubs/${props.karaoke.hardsubbed_mediafile}`;
	});
	const theaterMode = computed(() => route.params.theater === 'theater');
	const isIframe = ref(false);

	const fullscreen = ref(false);
	let loading = false;
	const videoOptions = computed(() => ({
		language: (loggedIn.value && user?.value?.language) || locale.value,
		languages: {
			pt: ptJson,
			de: deJson,
			en: enJson,
			fr: frJson,
			es: esJson
		},
		autoplay: theaterMode.value || props.playlistMode,
		controls: true,
		fluid: !theaterMode.value && !fullscreen.value,
		fill: true,
		poster: `${hardsubUrl}/previews/${props.karaoke.kid}.${props.karaoke.mediasize}.25.jpg`,
		controlBar: {
			fullscreenToggle: false,
			skipButtons: {
				forward: 5,
				backward: 5
			},
			volumePanel: {
				inline: false
			}
		},
		userActions: {
			doubleClick: false
		},
		responsive: true,
		sources: [
			{
				src: mediaHardsubUrl.value,
				type: 'video/mp4'
			}
		],
		experimentalSvgIcons: true
	}));

	watch(() => theaterMode.value || fullscreen.value, (newTheaterMode) => {
		if (import.meta.client) {
			if (newTheaterMode) {
				document.getElementsByTagName('html')[0].classList.add('theater');
			} else {
				document.getElementsByTagName('html')[0].classList.remove('theater');
			}
		}
	}, { immediate: true });

	onMounted(() => {
		window.addEventListener('fullscreenchange', updateFullscreen);
		updateFullscreen();
		isIframe.value = window.location !== window.parent.location;
	});

	onUnmounted(() => {
		window.removeEventListener('fullscreenchange', updateFullscreen);
	});

	function updateFullscreen() {
		fullscreen.value = document.fullscreenElement !== null;
	}

	function next() {
		props.playlistMode ? emit('next') : openRandomKara();
	}

	function previous() {
		emit('previous');
	}

	async function openRandomKara() {
		if (loading) {
			return;
		}
		loading = true;
		try {
			const res = await useCustomFetch<KaraListType>('/api/karas/search', {
				params: {
					random: 1,
					forPlayer: true,
					safeOnly: true,
					collections: enabledCollections.value.length > 0 ? enabledCollections.value.join(',') : undefined
				}
			});

			const kid = res.content[0].kid;
			const slugTitle = slug(res.content[0].titles[res.content[0].titles_default_language || 'eng']);
			return push(`/kara/${slugTitle}/${kid}${theaterMode.value ? '/theater' : ''}`);
		} finally {
			loading = false;
		}
	}

	async function changeFullscreen() {
		if (!fullscreen.value) {
			const docEl = window.document.documentElement as CustomElement;
			if (docEl.requestFullscreen) {
				await docEl.requestFullscreen();
			} else if (docEl.webkitRequestFullscreen) {
				await docEl.webkitRequestFullscreen();
			} else if (docEl.webkitEnterFullscreen) {
				await docEl.webkitEnterFullscreen();
			}
		} else {
			const docEl = window.document as CustomDocument;
			if (docEl.exitFullscreen) {
				await docEl.exitFullscreen();
			}else if (docEl.webkitCancelFullScreen) {
        		await docEl.webkitCancelFullScreen();
			}
		}
	}

	function changeTheaterMode() {
		if (fullscreen.value || isIframe.value) {
			return;
		}
		if (theaterMode.value) {
			closeTheaterMode();
		} else {
			openTheaterMode();
		}
	}

	function openTheaterMode() {
		if (fullscreen.value) {
			return;
		}
		navigateTo({ params: { theater: 'theater' }, query: route.query }, { replace: true });
	}

	function closeTheaterMode() {
		if ((fullscreen.value || isIframe.value)) {
			return;
		}
		navigateTo({ params: { theater: '' }, query: route.query }, { replace: true });
	}

	function showPlayer() {
		emit('open');
	}

	function sendPlayed() {
		useCustomFetch(`api/stats/kara/${props.karaoke.kid}/played`, {method: 'POST'});
	}
</script>

<style scoped lang="scss">
	.box > *:first-child, .box img {
		width: 100%;
		transition: height 200ms;
	}

	.box img {
		object-fit: cover;
	}

	.fa-layers {
		position: relative;
		bottom: calc(50% + 1em);
		left: calc(50% - 2em);

		svg:first-child > path {
			stroke: black;
			stroke-width: 0.5em;
		}

		.fa-play {
			left: 125%;
		}
	}

	.button.is-info {
		margin-top: 1em;
		display: block;
	}

	.image-container {
		cursor: pointer;
	}

	.theater {
		position: fixed;
		inset: 0px;
		width: 100%;
		height: 100%;
		background: black;
		z-index: 2;
	}

	.theater-player {
		inset: 0px;
		width: 100%;
		height: 100%;
	}
</style>
