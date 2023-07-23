<template>
	<div class="box">
		<div>
			<Teleport
				to="body"
				:disabled="!theaterMode"
			>
				<div :class="{ 'theater': theaterMode }">
					<video-component
						:title="buildKaraTitle(props.karaoke, null, true)"
						:class="{ 'theater-player': theaterMode }"
						:options="videoOptions"
						:fullscreen="fullscreen"
						:theater-mode="theaterMode"
						:theatermodechange="changeTheaterMode"
						:fullscreenchange="changeFullscreen"
						:play="showPlayer"
						:next="openRandomKara"
						:gain="props.karaoke.gain"
						:context="context"
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
	import slug from 'slug';
	import deJson from 'video.js/dist/lang/de.json';
	import enJson from 'video.js/dist/lang/en.json';
	import frJson from 'video.js/dist/lang/fr.json';
	import ptJson from 'video.js/dist/lang/pt-PT.json';
	import { useAuthStore } from '~/store/auth';
	import { useLocalStorageStore } from '~/store/localStorage';

	const props = defineProps<{
		karaoke: DBKara
		transition: Boolean
	}>();

	const emit = defineEmits<{ (e: 'open' | 'close'): void }>();

	const { params, query } = useRoute();
	const { push, replace } = useRouter();
	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { locale } = useI18n();

	const conf = useRuntimeConfig();
	const apiUrl = conf.public.API_URL;
	let context: AudioContext;

	const mediaHardsubUrl = computed(() => {
		return `${apiUrl}hardsubs/${props.karaoke.hardsubbed_mediafile}`;
	});

	const theaterMode = ref(params.theater === 'theater');
	const play = ref(theaterMode.value);
	const fullscreen = ref(false);
	const videoOptions = computed(() => ({
		language: (loggedIn.value && user?.value?.language) || locale.value,
		languages: {
			pt: ptJson,
			de: deJson,
			en: enJson,
			fr: frJson
		},
		autoplay: theaterMode.value || query.autoplay,
		play: play.value,
		controls: true,
		fluid: !theaterMode.value,
		fill: true,
		poster: `${apiUrl}previews/${props.karaoke.kid}.${props.karaoke.mediasize}.25.jpg`,
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
		sources: [
			{
				src: mediaHardsubUrl.value,
				type: 'video/mp4'
			}
		],
		experimentalSvgIcons: true
	}));

	watch(theaterMode, (newTheaterMode) => {
		if (process.client) {
			if (newTheaterMode) {
				document.getElementsByTagName('html')[0].classList.add('theater');
			} else {
				document.getElementsByTagName('html')[0].classList.remove('theater');
			}
		}
	}, { immediate: true });

	onMounted(() => {
		window.addEventListener('keydown', keyEvent);
		window.addEventListener('fullscreenchange', updateFullscreen);
		updateFullscreen();
		if (query.autoplay) {
			showPlayer();
			const kid = props.karaoke.kid;
			const slugTitle = slug(props.karaoke.titles[props.karaoke.titles_default_language || 'eng']);
			replace(`/kara/${slugTitle}/${kid}`);
		}
	});

	onUnmounted(() => {
		window.removeEventListener('keydown', keyEvent);
		window.removeEventListener('fullscreenchange', updateFullscreen);
	});

	function updateFullscreen() {
		fullscreen.value = document.fullscreenElement !== null;
	}

	async function openRandomKara() {
		const res = await useCustomFetch<KaraListType>('/api/karas/search', {
			params: {
				random: 1,
				collections: enabledCollections.value.join(',')
			}
		});

		const randomKaraoke = getSlugKidWithoutLiveDownload(res.content[0]);
		if (randomKaraoke) {
			context = new AudioContext();
			push(`/kara/${randomKaraoke}${theaterMode.value ? '/theater' : '?autoplay=true'}`);
		} else {
			openRandomKara();
		}
	}

	async function changeFullscreen() {
		if (!fullscreen.value) {
			await window.document.documentElement.requestFullscreen();
			openTheaterMode();
		} else {
			window.document.exitFullscreen();
			closeTheaterMode(true);
		}
	}

	function changeTheaterMode() {
		if (fullscreen.value) {
			window.document.exitFullscreen();
		} else {
			if (theaterMode.value) {
				closeTheaterMode();
			} else {
				openTheaterMode();
			}
		}
	}

	function openTheaterMode() {
		theaterMode.value = true;
		const url = new URL(window.location.href);
		if (url.pathname.includes('/theater/') || url.pathname.endsWith('/theater')) {
			url.pathname = url.pathname.replaceAll('/theater', '');
		}
		url.pathname += (url.pathname.endsWith('/') ? '' : '/') + 'theater';
		history.replaceState({}, '', url.href);
	}

	function closeTheaterMode(force = false) {
		if (fullscreen.value && !force) {
			return;
		}
		theaterMode.value = false;
		const url = new URL(window.location.href);
		if (url.pathname.includes('/theater/') || url.pathname.endsWith('/theater')) {
			url.pathname = url.pathname.replaceAll('/theater', '');
		}
		history.replaceState({}, '', url.href);
	}

	function showPlayer() {
		emit('open');
		play.value = true;
		if (!context) context = new AudioContext();
		if (context?.state !== 'running') context.resume().then(r => r);
	}
	function keyEvent(e: KeyboardEvent) {
		if (e.code === 'Escape') {
			e.preventDefault();
			closeTheaterMode(true);
		} else if ((e.target as Element).nodeName !== 'INPUT') {
			if (e.key === 'n') {
				e.preventDefault();
				openRandomKara();
			} else if (e.key === 'f') {
				e.preventDefault();
				changeFullscreen();
			} if (e.key === 't') {
				e.preventDefault();
				changeTheaterMode();
			}
		}
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
