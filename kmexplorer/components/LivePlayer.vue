<template>
	<div class="box">
		<div>
			<Teleport
				to="body"
				:disabled="!theaterMode && !fullscreen"
			>
				<div :class="{ 'theater': theaterMode || fullscreen }">
					<video-component
						:title="buildKaraTitle(props.karaoke, null, true)"
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
	import { DBKara } from '%/lib/types/database/kara';
	import { KaraList as KaraListType } from '%/lib/types/kara';
	import { storeToRefs } from 'pinia';
	import deJson from 'video.js/dist/lang/de.json';
	import enJson from 'video.js/dist/lang/en.json';
	import frJson from 'video.js/dist/lang/fr.json';
	import ptJson from 'video.js/dist/lang/pt-PT.json';
	import { useAuthStore } from '~/store/auth';
	import { useLocalStorageStore } from '~/store/localStorage';
	import { getSlugKidWithoutLiveDownload } from '~/utils/kara';

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

	const conf = useRuntimeConfig();
	const hardsubUrl = conf.public.HARDSUB_URL;

	const mediaHardsubUrl = computed(() => {
		return `${hardsubUrl}hardsubs/${props.karaoke.hardsubbed_mediafile}`;
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
			fr: frJson
		},
		autoplay: theaterMode.value || props.playlistMode,
		controls: true,
		fluid: !theaterMode.value && !fullscreen.value,
		fill: true,
		poster: `${hardsubUrl}previews/${props.karaoke.kid}.${props.karaoke.mediasize}.25.jpg`,
		controlBar: {
			fullscreenToggle: false,
			skipButtons: {
				forward: 5,
				backward: 5
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
		if (process.client) {
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
					safeOnly: true,
					collections: enabledCollections.value.join(',')
				}
			});

			const randomKaraoke = getSlugKidWithoutLiveDownload(res.content[0]);
			if (randomKaraoke) {
				return push(`/kara/${randomKaraoke}${theaterMode.value ? '/theater' : ''}`);
			}
		} finally {
			loading = false;
		}
		await openRandomKara();
	}

	async function changeFullscreen() {
		if (!fullscreen.value) {
			await window.document.documentElement.requestFullscreen();
		} else {
			await window.document.exitFullscreen();
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
