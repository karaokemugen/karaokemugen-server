<template>
	<div>
		<video
			ref="videoPlayer"
			class="video-js"
		/>
	</div>
</template>
  
<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import videojs from 'video.js';
	import Player from 'video.js/dist/types/player';
	import TitleBar from 'video.js/dist/types/title-bar';

	import 'video.js/dist/video-js.css';
	import { useLocalStorageStore } from '~/store/localStorage';

	const { playerVolume, autoplay } = storeToRefs(useLocalStorageStore());
	const { setPlayerVolume, setAutoplay } = useLocalStorageStore();
	const { query } = useRoute();
	const { t } = useI18n();

	const toggleOn = '<svg xmlns="http://www.w3.org/2000/svg" height="2em" viewBox="0 0 576 512"><style>svg{fill:#ffffff}</style><path d="M192 64C86 64 0 150 0 256S86 448 192 448H384c106 0 192-86 192-192s-86-192-192-192H192zm94 71 191 121 -190 126 z"/></svg>';
	const toggleOff = '<svg xmlns="http://www.w3.org/2000/svg" height="2em" viewBox="0 0 576 512"><style>svg{fill:#ffffff}</style><path d="M384 128c70.7 0 128 57.3 128 128s-57.3 128-128 128H192c-70.7 0-128-57.3-128-128s57.3-128 128-128H384zM576 256c0-106-86-192-192-192H192C86 64 0 150 0 256S86 448 192 448H384c106 0 192-86 192-192zm-380 90 0 -180L160 166l-0 180zm70 0 0 -180 -36 -0 0 180z"/></svg>';

	const props = defineProps<{
		title: string,
		options: any,
		fullscreen: boolean,
		theaterMode: boolean,
		gain: number | undefined,
		context: AudioContext | undefined,
		theatermodechange: () => void,
		fullscreenchange: () => void,
		play: () => void,
		next: () => void,
	}>();

	const videoPlayer = ref();
	const player = ref<Player>();
	const nextButton = ref();
	const theaterButton = ref();
	const fullscreenButton = ref();
	const autoplayButton = ref();
	let source: MediaElementAudioSourceNode;
	let gain_node: GainNode;

	function onended() {
		if (autoplay.value) nextEvent();
	}

	function nextEvent() {
		props.context?.close();
		gain_node?.disconnect();
		source?.disconnect();
		props.next();
	}

	onMounted(() => {
		videojs.getAllPlayers().forEach(oldPlayer => oldPlayer.dispose()); // temporary fix until https://github.com/vuejs/core/issues/4737 is fix
		window.addEventListener('keydown', keyEvent);
		player.value = videojs(videoPlayer.value, props.options, () => {
			if (player.value) {
				if (props.gain && props.context && !source) {
					gain_node = props.context.createGain();
					gain_node.gain.value = props.gain;
					source = props.context.createMediaElementSource(videoPlayer.value);
					source.connect(gain_node).connect(props.context.destination);
				}

				player.value.currentTime(query.time || 0);
				player.value.volume(playerVolume.value);

				player.value.on('volumechange', () => {
					setPlayerVolume(player.value!.volume()!);
				});
				player.value.on('ended', () => onended());
				player.value.on('fullscreenchange', () => {
					if (player.value!.isFullscreen()) {
						player.value!.exitFullscreen();
					}
				});
				player.value.tech(false).on('dblclick', props.fullscreenchange);
				player.value.on('play', props.play);

				setTitle();

				nextButton.value = player.value!.getChild('ControlBar')!.addChild('button', {
					controlText: t('kara.player.next'),
					clickHandler: nextEvent
				}, 1);
				nextButton.value.setIcon('next-item');

				const Button = videojs.getComponent('Button');

				//@ts-ignore
				class Switch extends Button {
					constructor(options = {}) {
						super(player.value, options);
					}
					createEl() {
						const el = videojs.dom.createEl('button');
						el.innerHTML = autoplay.value ? toggleOn : toggleOff;
						el.setAttribute('title', t('kara.player.autoplay'));
						el.classList.add('vjs-control', 'vjs-button');
						return el;
					}
					handleClick() {
						//@ts-ignore
						this.el().innerHTML = autoplay.value ? toggleOff : toggleOn;
						setAutoplay(!autoplay.value);
					}
				}

				//@ts-ignore
				videojs.registerComponent('Switch', Switch);
				autoplayButton.value = player.value!.getChild('ControlBar')!.addChild('Switch');

				theaterButton.value = player.value!.getChild('ControlBar')!.addChild('button', {
					controlText: t('kara.player.theater_mode'),
					clickHandler: props.theatermodechange
				});

				fullscreenButton.value = player.value!.getChild('ControlBar')!.addChild('button', {
					controlText: t('kara.player.fullscreen'),
					clickHandler: props.fullscreenchange
				});

				updateFullscreen();
			}
		});
	});

	function setTitle() {
		const titleBar: TitleBar = (player.value!.getChild('TitleBar') as any as TitleBar);
		titleBar.update({
			title: props.fullscreen || props.theaterMode ? props.title : ''
		});
	}

	onUnmounted(() => {
		window.removeEventListener('keydown', keyEvent);
	});

	function keyEvent(e: KeyboardEvent) {
		if ((e.target as Element).nodeName !== 'INPUT') {
			if (e.key === 'm') {
				e.preventDefault();
				player.value?.muted(!player.value?.muted());
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				let time = player.value?.currentTime();
				time = time ? (time - 5) : undefined;
				player.value?.currentTime(time);
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				let time = player.value?.currentTime();
				time = time ? (time + 5) : 5;
				player.value?.currentTime(time);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				let volume = player.value?.volume();
				volume = volume ? (volume + 0.05) : 0.05;
				player.value?.volume(volume);
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				let volume = player.value?.volume();
				volume = volume ? (volume - 0.05) : undefined;
				player.value?.volume(volume);
			} if (e.key === ' ') {
				e.preventDefault();
				player.value?.paused() ? player.value.play() : player.value?.pause();
			}
		}
	}

	onBeforeUnmount(() => {
		if (player.value) {
			player.value.dispose();
		}
	});

	watch(() => props.options.fluid, (newFluid) => {
		if (player.value) {
			if (newFluid) {
				player.value.fluid(true);
			} else {
				player.value.fill(true);
			}
		}
	});

	watch(() => props.options.language, (newLanguage) => {
		player.value?.language(newLanguage);
		nextButton.value?.controlText(t('kara.player.next')),
		theaterButton.value?.controlText(t('kara.player.theater_mode'));
		fullscreenButton.value?.controlText(t('kara.player.fullscreen'));
		autoplayButton.value?.el().setAttribute('title', t('kara.player.autoplay'));
	});

	watch(() => props.options.play, (newPlay) => {
		if (player.value) {
			if (newPlay) {
				if (document.pictureInPictureElement) {
					(document.pictureInPictureElement as HTMLVideoElement).pause();
					document.exitPictureInPicture();
					videoPlayer.value.requestPictureInPicture();
				}
				if (props.gain) {
					let context = props.context;
					if (!context) context = new AudioContext();
					gain_node = context.createGain();
					gain_node.gain.value = props.gain;
					source = context.createMediaElementSource(videoPlayer.value);
					source.connect(gain_node).connect(context.destination);
				}
				player.value.play();
			} else {
				player.value.pause();
			}
		}
	});

	watch(() => [props.theaterMode, props.fullscreen], ([newTheaterMode, newFullscreen]) => {
		updateFullscreen();
		setTitle();
	});

	function updateFullscreen() {
		if (theaterButton.value && fullscreenButton.value) {
			if (props.fullscreen) {
				theaterButton.value.setIcon('square');
				fullscreenButton.value.setIcon('fullscreen-exit');
			} else if (props.theaterMode) {
				theaterButton.value.setIcon('fullscreen-exit');
				fullscreenButton.value.setIcon('fullscreen-enter');
			} else {
				theaterButton.value.setIcon('square');
				fullscreenButton.value.setIcon('fullscreen-enter');
			}
		}
	}
</script>
<style>
.vjs-control-bar {
	font-size: 15px;

	.vjs-control {
		width: 3em;
	}
}

.vjs-title-bar {
	font-size: 27px;
	bottom: 45px;
	top: unset;
	padding: 2em 1.333em 0.666em;
	background: linear-gradient(360deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0) 100%);
}
</style>