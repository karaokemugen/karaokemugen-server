<template>
	<div>
		<video
			ref="videoPlayer"
			class="video-js"
		/>
	</div>
</template>
  
<script setup lang="ts">
	import _ from 'lodash';
	import { storeToRefs } from 'pinia';
	import videojs from 'video.js';
	import type Player from 'video.js/dist/types/player';
	import type TitleBar from 'video.js/dist/types/title-bar';

	import 'video.js/dist/video-js.css';
	import { useLocalStorageStore } from '~/store/localStorage';

	const { playerVolume, autoplay } = storeToRefs(useLocalStorageStore());
	const { setPlayerVolume, setAutoplay } = useLocalStorageStore();
	const route = useRoute();
	const { t } = useI18n();

	const toggleOn = '<svg xmlns="http://www.w3.org/2000/svg" height="2em" viewBox="0 0 576 512"><style>svg{fill:#ffffff}</style><path d="M192 64C86 64 0 150 0 256S86 448 192 448H384c106 0 192-86 192-192s-86-192-192-192H192zm94 71 191 121 -190 126 z"/></svg>';
	const toggleOff = '<svg xmlns="http://www.w3.org/2000/svg" height="2em" viewBox="0 0 576 512"><style>svg{fill:#ffffff}</style><path d="M384 128c70.7 0 128 57.3 128 128s-57.3 128-128 128H192c-70.7 0-128-57.3-128-128s57.3-128 128-128H384zM576 256c0-106-86-192-192-192H192C86 64 0 150 0 256S86 448 192 448H384c106 0 192-86 192-192zm-380 90 0 -180L160 166l-0 180zm70 0 0 -180 -36 -0 0 180z"/></svg>';

	const props = defineProps<{
		title: string,
		options: any,
		fullscreen: boolean,
		theaterMode: boolean,
		playlistMode?: boolean
		isIframe: boolean,
		theatermodechange: () => void,
		fullscreenchange: () => void,
		play: () => void,
		next: () => void,
		previous: () => void,
	}>();

	const emit = defineEmits<{(e: 'send-played'): void}>();

	const videoPlayer = ref();
	const player = ref<Player>();
	const previousButton = ref();
	const nextButton = ref();
	const theaterButton = ref();
	const fullscreenButton = ref();
	const autoplayButton = ref();
	const timeWatched = ref(0);
	const canSendPlayData = ref(true);

	function onended() {
		if (autoplay.value) nextEvent();
	}

	function previousEvent() {
		props.previous();
	}

	function nextEvent() {
		if (player.value) player.value.autoplay(true);
		props.next();
	}

	function theatermodechangeEvent() {
		player.value!.getChild('ControlBar')?.trigger('mouseleave');
		props.theatermodechange();
	}

	onMounted(() => {
		videojs.getAllPlayers().forEach(oldPlayer => oldPlayer.dispose()); // temporary fix until https://github.com/vuejs/core/issues/4737 is fix
		window.addEventListener('keydown', keyEvent);
		player.value = videojs(videoPlayer.value, props.options, () => {
			if (player.value) {
				player.value.currentTime(route.query.time || 0);
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
				player.value.on('timeupdate', () => {
					if (player.value!.currentTime()! < 2 || player.value!.currentTime()! >= player.value!.duration()! - 4) {
						player.value!.userActive(true);
						player.value!.reportUserActivity(null);
					}
				});
				player.value.setInterval(() => {
					// No need to do log timeWatched if you can't send anymmore
					if(!canSendPlayData.value) {
						return;
					}
					// Not sure if this is sufficent to say that video is playing (maybe it's buffering?)
					if(!player.value?.paused()) {
						timeWatched.value += 0.1;
					}
					// Check if user watched 30 secs or 75% of video (same definition of View as Peertube)
					if(timeWatched.value > 30 || timeWatched.value > 0.75 * player.value?.duration()!) {
						emit('send-played');
						canSendPlayData.value = false;
					}
				}, 100);
				setTitle();

				const Button = videojs.getComponent('Button');

				//@ts-ignore
				class Switch extends Button {

					constructor(player: Player, options = {}) {
						super(player, options);

						if (player) player.autoplay(props.theaterMode);
						//@ts-ignore
						this.setIcon('next-item'); // create the skeleton of the icon
						this.overrideIcon();
						//@ts-ignore
						this.controlText(t('kara.player.autoplay'));
					}

					overrideIcon() {
						//@ts-ignore
						this.el().getElementsByClassName('vjs-icon-placeholder')[0].children[0].outerHTML = autoplay.value ? toggleOn : toggleOff;
					}

					handleClick() {
						setAutoplay(!autoplay.value);
						this.overrideIcon();
					}
				}
				//@ts-ignore
				videojs.registerComponent('Switch', Switch);
				const Component = videojs.getComponent('Component');

				//@ts-ignore
				class TouchOverlay extends Component {

					constructor(player: Player, options: {}) {
						super(player, options);
					}

					createEl() {
						return videojs.dom.createEl('div', {
							className: 'vjs-touch-overlay',
							// Touch overlay is not tabbable.
							tabIndex: -1
						});
					}
				}
				//@ts-ignore
				Component.registerComponent('TouchOverlay', TouchOverlay);

				//@ts-ignore
				class TouchControl extends Component {

					constructor(player: Player, options: {}) {
						super(player, options);

						//@ts-ignore
						this.addChild('playToggle', {});
						//@ts-ignore
						nextButton.value = this.addChild('button', {
							className: 'vjs-next-control',
							controlText: t('kara.player.next'),
							clickHandler: nextEvent
						}, 1);
						nextButton.value.setIcon('next-item');
						if (props.playlistMode) {
							//@ts-ignore
							previousButton.value = this.addChild('button', {
								className: 'vjs-previous-control',
								controlText: t('kara.player.previous'),
								clickHandler: previousEvent
							}, 1);
							previousButton.value.setIcon('previous-item');
						}
					}

					createEl() {
						return videojs.dom.createEl('div', {
							className: 'vjs-control-bar vjs-touch-control',
							// Touch overlay is not tabbable.
							tabIndex: -1
						});
					}
				}
				//@ts-ignore
				Component.registerComponent('TouchControl', TouchControl);

				autoplayButton.value = player.value!.getChild('ControlBar')!.addChild('Switch', {
					className: 'vjs-autoplay-control',
				});

				if (videojs.browser.TOUCH_ENABLED) {
					let controlBarIdx = player.value.children_.indexOf(player.value.getChild('ControlBar'));
					const touchOverlay = player.value.addChild('TouchOverlay', {}, controlBarIdx);
					controlBarIdx++;
					player.value.addChild('TouchControl', {}, controlBarIdx);
					let taps: number | null;
					const handleTaps_ = videojs.fn.debounce(() => {
						if (taps != null && taps !== 0) {
							const increment = taps * 5;
							if (increment !== 0) {
								player.value!.currentTime(Math.max(0, Math.min(player.value!.duration()!, player.value!.currentTime()! + increment)));
							}
						} else {
							player.value!.tech(false).trigger('tap');
						}
						taps = null;
						touchOverlay.removeClass('skip');
						touchOverlay.removeClass('reverse');
					}, 300);
					//@ts-ignore
					player.value.tech(false).off('touchstart');
					player.value.tech(false).on('touchstart', (e: any) => {
						if (taps == null) {
							taps = 0;
						} else {
							const rect = player.value!.el_.getBoundingClientRect();
							const x = e.changedTouches[0].clientX - rect.left;

							// Check if double tap is in left or right area
							if (x < rect.width * 0.4) {
								taps--;
							} else if (x > rect.width - (rect.width * 0.4)) {
								taps++;
							}
							if (taps < 0) {
								touchOverlay.addClass('reverse');
								touchOverlay.addClass('skip');
							} else if (taps > 0) {
								touchOverlay.removeClass('reverse');
								touchOverlay.addClass('skip');
							} else {
								touchOverlay.removeClass('skip');
								touchOverlay.removeClass('reverse');
							}
							const increment = Math.abs(taps * 5);
							touchOverlay.setAttribute('data-skip-text', `${increment} ${touchOverlay.localize('seconds')}`);
						}
						handleTaps_();
					});
				} else {
					nextButton.value = player.value!.getChild('ControlBar')!.addChild('button', {
						className: 'vjs-next-control',
						controlText: t('kara.player.next'),
						clickHandler: nextEvent
					}, 1);
					nextButton.value.setIcon('next-item');
					if (props.playlistMode) {
						previousButton.value = player.value!.getChild('ControlBar')!.addChild('button', {
							className: 'vjs-previous-control',
							controlText: t('kara.player.previous'),
							clickHandler: previousEvent
						}, 1);
						previousButton.value.setIcon('previous-item');
					}
				}

				theaterButton.value = player.value!.getChild('ControlBar')!.addChild('button', {
					className: 'vjs-theater-control',
					controlText: t('kara.player.theater_mode'),
					clickHandler: theatermodechangeEvent
				});

				fullscreenButton.value = player.value!.getChild('ControlBar')!.addChild('button', {
					className: 'vjs-fullscreen-control',
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

	onBeforeRouteLeave(() => window.removeEventListener('keydown', keyEvent));
	onUnmounted(() => window.removeEventListener('keydown', keyEvent));

	function keyEvent(e: KeyboardEvent) {
		if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
			return;
		}
		if (e.code === 'Escape') {
			e.preventDefault();
			navigateTo({ params: { theater: '' }, query: route.query }, { replace: true });
		}
		if ((e.target as Element).nodeName !== 'INPUT') {
			if (e.key.toLowerCase() === 'm') {
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
			} if (e.key.toLowerCase() === 't') {
				e.preventDefault();
				theatermodechangeEvent();
			} if (e.key.toLowerCase() === 'b') {
				e.preventDefault();
				props.previous();
			} if (e.key.toLowerCase() === 'n') {
				e.preventDefault();
				props.next();
			} else if (e.key.toLowerCase() === 'f') {
				e.preventDefault();
				props.fullscreenchange();
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
		nextButton.value?.controlText(t('kara.player.next'));
		if (props.playlistMode) previousButton.value?.controlText(t('kara.player.previous'));
		theaterButton.value?.controlText(t('kara.player.theater_mode'));
		fullscreenButton.value?.controlText(t('kara.player.fullscreen'));
		autoplayButton.value?.el().setAttribute('title', t('kara.player.autoplay'));
	});

	watch(() => props.options.sources, (newSources, oldSources) => {
		if (_.isEqual(newSources, oldSources)) { return; }
		canSendPlayData.value = true;
		timeWatched.value = 0;
		if (player.value) {
			player.value.src(newSources);
		}
	});

	watch(() => props.options.poster, (newPoster) => {
		if (player.value) {
			player.value.poster(newPoster);
		}
	});

	watch(() => props.title, () => {
		setTitle();
	});

	watch(() => [props.theaterMode, props.fullscreen], () => {
		updateFullscreen();
		setTitle();
	});

	function updateFullscreen() {
		if (theaterButton.value && fullscreenButton.value) {
			if (props.fullscreen) {
				theaterButton.value.hide();
				fullscreenButton.value.setIcon('fullscreen-exit');
			} else if (props.theaterMode) {
				if (!props.isIframe) {
					theaterButton.value.show();
					theaterButton.value.setIcon('fullscreen-exit');
				} else {
					theaterButton.value.hide();
				}
				fullscreenButton.value.setIcon('fullscreen-enter');
			} else {
				theaterButton.value.show();
				theaterButton.value.setIcon('square');
				fullscreenButton.value.setIcon('fullscreen-enter');
			}
		}
		player.value!.getChild('ControlBar')?.trigger('mouseleave');
	}
</script>
<style lang="scss">
.video-js {
	.vjs-control-bar {
		font-size: 15px;

		.vjs-control {
			width: 3em;
		}

		.vjs-time-control {
			width: 4em;
		}
	}

	.vjs-title-bar {
		font-size: 27px;
		bottom: 45px;
		top: unset;
		padding: 2em 1.333em 0.666em;
		background: linear-gradient(360deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0) 100%);
	}

	&.vjs-layout-medium {
		.vjs-title-bar {
			font-size: 20px;
		}
	}

	&.vjs-layout-tiny,
	&.vjs-layout-x-small,
	&.vjs-layout-small {
		.vjs-title-bar {
			font-size: 15px;
		}
	}

	&.vjs-layout-tiny,
	&.vjs-layout-x-small,
	&.vjs-layout-small,
	&.vjs-layout-medium {

		.vjs-skip-backward-5,
		.vjs-skip-forward-5 {
			display: none;
		}
	}

	&.vjs-touch-enabled {
		.vjs-control-bar:not(.vjs-touch-control) {

			.vjs-skip-backward-5,
			.vjs-skip-forward-5,
			.vjs-play-control,
			.vjs-previous-control,
			.vjs-next-control {
				display: none;
			}
		}

		.vjs-touch-overlay {
			pointer-events: none;
			position: absolute;
			top: 0;
			width: 100%;
			height: 100%;
			font-size: 25px;

			&.skip {
				background-repeat: no-repeat;
				background-position: 80% center;
				background-size: 10%;
				background-image: url('data:image/svg+xml;utf8,<svg fill="%23FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');

				&:after {
					content: attr(data-skip-text);
					position: absolute;
					top: 60%;
					left: 70%;
				}
			}

			&.skip.reverse {
				background-position: 20% center;
				background-image: url('data:image/svg+xml;utf8,<svg fill="%23FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');

				&:after {
					right: 70%;
					left: unset;
				}
			}
		}

		.vjs-touch-control {
			position: static;
			background-color: unset;
			height: 100%;

			.vjs-button {
				font-size: 30px;
				display: block;
				background-color: unset;
				top: 50%;
				transform: translate(-50%, -50%);
				position: absolute;
				height: 20%;

				&.vjs-previous-control {
					left: 25%;
				}

				&.vjs-play-control {
					left: 50%;
				}

				&.vjs-next-control {
					left: 75%;
				}
			}
		}
	}

	.vjs-next-control,
	.vjs-previous-control,
	.vjs-autoplay-control,
	.vjs-theater-control {
		cursor: pointer;
	}
}
</style>
