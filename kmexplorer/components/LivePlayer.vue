<template>
	<div class="box">
		<iframe :src="`${liveURL}?video=${karaoke.kid}&autoplay=1`" :class="{live: transition}" allowfullscreen
				v-if="show" title="VideoPlayer"></iframe>
		<div class="image-container" v-else @click="showPlayer" tabindex="0" @keydown="showPlayer"
			 aria-keyshortcuts="Ctrl+L">
			<img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.25.jpg`" alt="Thumbnail">
			<font-awesome-layers>
				<font-awesome-icon :icon="['fas', 'circle']" size="4x"></font-awesome-icon>
				<font-awesome-icon :icon="['fas', 'play']" color="black" size="2x"></font-awesome-icon>
			</font-awesome-layers>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';

	export default Vue.extend({
		name: "LivePlayer",

		props: ['karaoke'],

		data() {
			return {
				liveURL: process.env.LIVE_URL,
				show: false,
				transition: false
			}
		},

		methods: {
			createTransition() {
				this.transition = true;
			},
			showPlayer() {
				this.show = true;
				this.$emit('open');
			},
			keyEvent(e: KeyboardEvent) { // Fancy shortcut, don't tell anyone! :p
				if (e.code === 'KeyL' && e.ctrlKey) {
					e.preventDefault();
					this.showPlayer();
					window.removeEventListener('keydown', this.keyEvent);
				}
			}
		},

		updated() {
			if (this.show && !this.transition) {
				this.$nextTick(() => {
					setTimeout(this.createTransition, 25);
				});
			}
		},

		mounted() {
			window.addEventListener('keydown', this.keyEvent);
		},

		destroyed() {
			window.removeEventListener('keydown', this.keyEvent);
		}
	});
</script>

<style scoped lang="scss">
	.box > *:first-child, .box img {
		width: 100%;
		height: 18vw;
		transition: height 0.8s;
	}

	@media (min-width: 700px) {
		.box *:first-child.live {
			height: 31vw;
		}
	}

	.box img {
		object-fit: cover;
	}

	.fa-layers {
		position: relative;
		bottom: calc(50% + 2em);
		left: calc(50% - 2.5em);

		svg:first-child > path {
			stroke: black;
			stroke-width: 0.5em;
		}

		.fa-play {
			left: 125%;
		}
	}

	.image-container {
		cursor: pointer;
	}
</style>
