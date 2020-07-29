<template>
	<div class="tile is-ancestor">
		<div class="tile is-parent is-12">
			<div class="tile is-child" :class="{'is-8': !liveOpened, 'is-4': liveOpened}">
				<kara-full-info :karaoke="karaoke" />
			</div>
			<div class="tile is-4-desktop-only is-parent is-vertical">
				<div v-if="liveURL && live" class="tile is-child">
					<live-player :karaoke="karaoke" @open="placeForLive" />
				</div>
				<div v-else class="tile is-child">
					<div class="box">
						<img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.25.jpg`" alt="">
					</div>
				</div>
				<div v-show="!liveOpened" v-if="!mp3" class="tile is-child">
					<div class="box">
						<div class="imgGroup">
							<img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.33.jpg`" alt="">
							<img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.50.jpg`" alt="">
						</div>
					</div>
				</div>
				<div class="tile is-child">
					<kara-report :karaoke="karaoke" />
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import LivePlayer from '~/components/LivePlayer.vue';
	import KaraFullInfo from '~/components/KaraFullInfo.vue';
	import KaraReport from '~/components/KaraReport.vue';
	import { DBKara } from '%/lib/types/database/kara';

	interface VState {
		karaoke: DBKara,
		liveURL?: string,
		liveOpened: boolean
	}

	export default Vue.extend({
		name: 'ShowKara',

		components: {
			LivePlayer,
			KaraFullInfo,
			KaraReport
		},

		async asyncData({ params, $axios, error, app }) {
			const res = await $axios.get(`/api/karas/${params.id}`).catch(
				_err => error({ statusCode: 404, message: app.i18n.t('kara.notfound') as string }));
			if (res) {
				return { karaoke: res.data };
			} else {
				error({ statusCode: 500, message: 'Huh?' });
			}
		},

		data(): VState {
			return {
				karaoke: {} as unknown as DBKara, // A little
				liveURL: process.env.LIVE_URL,
				liveOpened: false
			};
		},

		computed: {
			mp3(): boolean {
				return this.karaoke.mediafile.endsWith('.mp3');
			},
			live(): boolean {
				return this.karaoke.mediafile.endsWith('.mp3') || this.karaoke.mediafile.endsWith('.mp4');
			}
		},

		activated() {
			this.liveOpened = false;
		},

		methods: {
			placeForLive() {
				this.liveOpened = true;
			}
		},

		head() {
			return {
				// @ts-ignore: no?
				title: this.karaoke.title,
				meta: [
					{ hid: 'twitter-card', name: 'twitter:card', content: 'player' },
					// @ts-ignore: No. :c
					{ hid: 'twitter-player', name: 'twitter:player', content: `${process.env.LIVE_URL}/?video=${this.karaoke.kid}` },
					{ hid: 'twitter-player-height', name: 'twitter:player:height', content: '720' },
					{ hid: 'twitter-player-width', name: 'twitter:player:width', content: '1280' },
					// @ts-ignore: rah :O
					{ hid: 'twitter-image', name: 'twitter:image', content: `/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.25.jpg` },
					// { hid: 'twitter-description', name: 'twitter:description', content: 'smth' }
					// The rest of meta tags is handled by KaraFullInfo.vue
				]
			};
		}
	});
</script>

<style scoped lang="scss">
	.tile .is-child {
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

	.tile.is-vertical {
		padding: 0 1em;
	}
</style>
