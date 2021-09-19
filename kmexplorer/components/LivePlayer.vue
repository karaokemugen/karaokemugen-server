<template>
	<div
		class="box"
		@mouseenter="hover = true"
		@mouseleave="hover = false"
	>
		<iframe
			v-if="show"
			ref="liveEmbed"
			:class="{ live: showTick }"
			:src="`${liveURL}?video=${karaoke.kid}&autoplay=1`"
			:style="{ height: size === -1 ? undefined:`${size.toString()}px` }"
			allowfullscreen
			title="VideoPlayer"
		/>
		<div
			v-else
			class="image-container"
			tabindex="0"
			aria-keyshortcuts="Ctrl+L"
			@click="showPlayer"
			@keydown="showPlayer"
		>
			<img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.25.hd.jpg`" alt="Thumbnail">
			<font-awesome-layers>
				<font-awesome-icon :icon="['fas', 'circle']" size="4x" />
				<font-awesome-icon :icon="['fas', 'play']" color="black" size="2x" />
			</font-awesome-layers>
		</div>
		<a :href="`${liveURL}?video=${karaoke.kid}`" target="_blank" class="button is-info" @click="closeLive">
			<font-awesome-icon v-if="show" :icon="['fas', 'external-link-alt']" :fixed-width="true" />
			<font-awesome-icon v-else :icon="['fas', 'play']" :fixed-width="true" />
			{{ $t('kara.live') }}
		</a>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import { DBKara } from '%/lib/types/database/kara';

	interface VState {
		liveURL?: string,
		show: boolean,
		showTick: boolean,
		size: number,
		hover: boolean,
		scrollY: number,
		interval?: NodeJS.Timeout
	}

	export default Vue.extend({
		name: 'LivePlayer',

		props: {
			karaoke: {
				required: true,
				type: Object
			} as PropOptions<DBKara>,
			transition: {
				required: true,
				type: Boolean
			}
		},

		data(): VState {
			return {
				liveURL: process.env.LIVE_URL,
				show: false,
				showTick: false,
				size: -1,
				hover: false,
				scrollY: 0
			};
		},

		watch: {
			transition(now: boolean) {
				if (now) {
					this.resizeEvent();
					if (this.interval) {
						clearInterval(this.interval);
					}
				} else {
					// Reset component
					this.show = false;
					this.showTick = false;
					this.size = -1;
				}
			},
			hover(now) {
				if (now && this.show && !window.matchMedia('(hover: none)').matches) {
					// Lock the vertical scroll to let user set volume in Live
					this.scrollY = window.scrollY;
					window.addEventListener('scroll', this.blockScroll, { passive: true });
				} else {
					window.removeEventListener('scroll', this.blockScroll);
				}
			}
		},

		mounted() {
			window.addEventListener('keydown', this.keyEvent);
			window.addEventListener('resize', this.resizeEvent);
		},

		destroyed() {
			window.removeEventListener('keydown', this.keyEvent);
			window.removeEventListener('resize', this.resizeEvent);
			window.removeEventListener('scroll', this.blockScroll);
		},

		methods: {
			createTransition() {
				this.showTick = true;
				this.interval = setInterval(this.resizeEvent, 100);
			},
			showPlayer() {
				this.show = true;
				this.$emit('open');
				setTimeout(this.createTransition, 25);
			},
			keyEvent(e: KeyboardEvent) { // Fancy shortcut, don't tell anyone! :p
				if (e.code === 'KeyL' && e.ctrlKey) {
					e.preventDefault();
					this.showPlayer();
					window.removeEventListener('keydown', this.keyEvent);
				}
			},
			resizeEvent() {
				if (this.show) {
					this.size = (this.$refs.liveEmbed as HTMLIFrameElement)?.scrollWidth * 0.5625;
				}
			},
			closeLive() {
				if (this.show) {
					this.$emit('close');
				}
			},
			blockScroll() {
				window.scrollTo(window.scrollX, this.scrollY);
			}
		}
	});
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
