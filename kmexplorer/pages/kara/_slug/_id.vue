<template>
	<div class="tile is-ancestor">
		<div class="tile is-parent is-12">
			<div ref="leftTile" class="tile is-child" :class="{'is-8': !liveOpened, 'is-5': liveOpened}">
				<kara-full-info :karaoke="karaoke" />
			</div>
			<div class="tile is-4-desktop-only is-parent is-vertical">
				<div v-if="liveURL && live" class="tile is-child">
					<live-player :karaoke="karaoke" :transition="liveTransition" @open="placeForLive" @close="closeLive" />
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
	import { tagTypes } from '~/assets/constants';
	import { sortTypesKara } from '~/utils/tools';

	interface VState {
		karaoke: DBKara,
		liveURL?: string,
		liveOpened: boolean,
		liveTransition: boolean
	}

	export default Vue.extend({
		name: 'ShowKara',

		components: {
			LivePlayer,
			KaraFullInfo,
			KaraReport
		},

		async asyncData({ params, $axios, error, app }) {
			let kid = params.id;
			if (!kid) {
				// Resolve a slug-less url scheme (/base/kara/<kid>)
				kid = params.slug;
			}
			try {
				const res = await $axios.get<DBKara>(`/api/karas/${kid}`);
				const karaoke = sortTypesKara(res.data);
				return { karaoke };
			} catch (e) {
				error({ statusCode: 404, message: app.i18n.t('kara.notfound') as string });
			}
		},

		data(): VState {
			return {
				karaoke: {} as unknown as DBKara, // A little cheat, this is filled by asyncData in all cases
				liveURL: process.env.LIVE_URL,
				liveOpened: false,
				liveTransition: false
			};
		},

		computed: {
			mp3(): boolean {
				return this.karaoke.mediafile.endsWith('.mp3');
			},
			live(): boolean {
				// Loop all tags to find a tag with noLiveDownload
				let noLiveDownload = false;
				for (const tagType in tagTypes) {
					if (tagType === 'years') { continue; }
					// @ts-ignore: il est 23h27 <- ceci n'est pas une raison
					for (const tag of this.karaoke[tagType]) {
						if (tag.nolivedownload) {
							noLiveDownload = true;
						}
					}
				}
				return !noLiveDownload && (this.karaoke.mediafile.endsWith('.mp3') || this.karaoke.mediafile.endsWith('.mp4'));
			}
		},

		methods: {
			placeForLive() {
				this.liveOpened = true;
				(this.$refs.leftTile as HTMLElement).addEventListener('transitionend', this.transitionLive, { once: true });
			},
			transitionLive() {
				this.liveTransition = true;
			},
			closeLive() {
				this.liveTransition = false;
				this.liveOpened = false;
			}
		},

		head() {
			return {
				// @ts-ignore: no?
				title: this.karaoke.title,
				meta: [
					{ hid: 'twitter:card', name: 'twitter:card', content: 'player' },
					{ hid: 'og:type', property: 'og:type', content: 'article' },
					{ hid: 'og:description', property: 'og:description', content: this.$t('layout.slogan') as string },
					// @ts-ignore: No. :c
					{ hid: 'twitter:player', name: 'twitter:player', content: `${process.env.LIVE_URL}/?video=${this.karaoke.kid}` },
					{ hid: 'twitter:player:height', name: 'twitter:player:height', content: '720' },
					{ hid: 'twitter:player:width', name: 'twitter:player:width', content: '1280' },
					// @ts-ignore: No. :c
					{ hid: 'og:image', property: 'og:image', content: `https://${process.env.EXPLORER_HOST}/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.25.jpg` },
					// @ts-ignore: rah :O
					{ hid: 'twitter:image', name: 'twitter:image', content: `/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.25.jpg` }
					// The rest of meta tags is handled by KaraFullInfo.vue
				]
			};
		}
	});
</script>

<style scoped lang="scss">
	.tile.is-child {
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

	.tile.is-4-desktop-only.is-parent.is-vertical > .tile.is-child {
		flex-grow: 0;
	}

	.tile.is-vertical {
		padding: 0 1em;
	}

	@media (max-width: 769px) {
		.tile.is-vertical {
			padding: 1em 0;
		}
	}
</style>
