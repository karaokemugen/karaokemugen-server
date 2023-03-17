<template>
	<div
		class="box"
	>
		<iframe
			v-if="show"
			ref="liveEmbed"
			:class="{ live: showTick }"
			:src="`${liveURL}?video=${karaoke.kid}&autoplay=1`"
			:style="{ height: size === -1 ? undefined:`${size.toString()}px` }"
			allowfullscreen
			title="VideoPlayer"
			@mouseenter="hover = true"
			@mouseleave="hover = false"
		/>
		<div
			v-else
			class="image-container"
			tabindex="0"
			aria-keyshortcuts="Ctrl+L"
			@click="showPlayer"
			@keydown="showPlayer"
		>
			<img
				:src="`${apiUrl}previews/${karaoke.kid}.${karaoke.mediasize}.25.jpg`"
				alt="Thumbnail"
			>
			<font-awesome-layers>
				<font-awesome-icon
					:icon="['fas', 'circle']"
					size="4x"
				/>
				<font-awesome-icon
					:icon="['fas', 'play']"
					color="black"
					size="2x"
				/>
			</font-awesome-layers>
		</div>
		<nuxt-link
			:href="`${liveURL}?video=${karaoke.kid}`"
			target="_blank"
			class="button is-info"
			@click="closeLive"
		>
			<font-awesome-icon
				v-if="show"
				:icon="['fas', 'external-link-alt']"
				:fixed-width="true"
			/>
			<font-awesome-icon
				v-else
				:icon="['fas', 'play']"
				:fixed-width="true"
			/>
			{{ $t('kara.live') }}
		</nuxt-link>
	</div>
</template>

<script setup lang="ts">
	import { DBKara } from '%/lib/types/database/kara';

	const props = defineProps<{
		karaoke: DBKara
		transition: Boolean
	}>();

	const emit = defineEmits<{(e: 'open'|'close'): void}>();

	const show = ref(false);
	const showTick = ref(false);
	const size = ref(-1);
	const hover = ref(false);
	const scrollY = ref(0);
	const interval = ref<NodeJS.Timeout>();
	const liveEmbed = ref<HTMLIFrameElement>();

	const conf = useRuntimeConfig();
	const liveURL = conf.public.LIVE_URL;
	const apiUrl = conf.public.API_URL;

	watch(() => props.transition, (now) => {
		if (now) {
			resizeEvent();
			if (interval.value) {
				clearInterval(interval.value);
			}
		} else {
			// Reset component
			show.value = false;
			showTick.value = false;
			size.value = -1;
		}
	});

	watch(hover, (now) => {
		if (now && show.value && !window.matchMedia('(hover: none)').matches) {
			// Lock the vertical scroll to let user set volume in Live
			scrollY.value = window.scrollY;
			window.addEventListener('scroll', blockScroll, { passive: true });
		} else {
			window.removeEventListener('scroll', blockScroll);
		}
	});

	onMounted(() => {
		window.addEventListener('keydown', keyEvent);
		window.addEventListener('resize', resizeEvent);
	});

	onUnmounted(() => {
		window.removeEventListener('keydown', keyEvent);
		window.removeEventListener('resize', resizeEvent);
		window.removeEventListener('scroll', blockScroll);
	});

	function createTransition() {
		showTick.value = true;
		interval.value = setInterval(resizeEvent, 100);
	}
	function showPlayer() {
		show.value = true;
		emit('open');
		setTimeout(createTransition, 25);
	}
	function keyEvent(e: KeyboardEvent) { // Fancy shortcut, don't tell anyone! :p
		if (e.code === 'KeyL' && e.ctrlKey) {
			e.preventDefault();
			showPlayer();
			window.removeEventListener('keydown', keyEvent);
		}
	}
	function resizeEvent() {
		if (show.value && liveEmbed.value?.scrollWidth) {
			size.value = liveEmbed.value?.scrollWidth * 0.5625;
		}
	}
	function closeLive() {
		if (show.value) {
			emit('close');
		}
	}
	function blockScroll() {
		window.scrollTo(window.scrollX, scrollY.value);
	}
</script>

<style scoped lang="scss">
	.box > *:first-child, .box img {
		width: 100%;
		height: 16rem;
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
</style>
