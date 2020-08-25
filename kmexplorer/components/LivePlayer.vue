<template>
	<div class="box">
		<iframe
			v-if="show"
			:src="`${liveURL}?video=${karaoke.kid}&autoplay=1`"
			:class="{live: transition}"
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
			<img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.25.jpg`" alt="Thumbnail">
			<font-awesome-layers>
				<font-awesome-icon :icon="['fas', 'circle']" size="4x" />
				<font-awesome-icon :icon="['fas', 'play']" color="black" size="2x" />
			</font-awesome-layers>
		</div>
		<a v-if="!show" :href="`${liveURL}?video=${karaoke.kid}`" target="_blank" class="button is-info">
			<font-awesome-icon :icon="['fas', 'play']" :fixed-width="true" />
			{{ $t('kara.live') }}
		</a>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';

	export default Vue.extend({
		name: 'LivePlayer',

		props: ['karaoke'],

		data() {
			return {
				liveURL: process.env.LIVE_URL,
				show: false,
				transition: false
			};
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
		}
	});
</script>

<style scoped lang="scss">
	.box > *:first-child, .box img {
		width: 100%;
		height: 16rem;
		transition: height 0.8s;
	}

	@media (min-width: 700px) {
		.box *:first-child.live {
			height: 22rem;
		}
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
