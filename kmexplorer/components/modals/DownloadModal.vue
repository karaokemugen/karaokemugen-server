<template>
	<modal
		:active="active"
		:modal-title="$t('modal.download.label')"
		:cancel-label="$t('modal.download.cancel')"
		@close="closeModal"
	>
		<section class="modal-card-body">
			<div class="columns">
				<div class="column">
					<a :href="bundleUrl" class="button" :download="`${serieSinger.name} - ${karaoke.titles[karaoke.titles_default_language]}.karabundle.json`" @click="closeModal">
						<font-awesome-icon :icon="['fas', 'file-export']" :fixed-width="true" />
						{{ $t('modal.download.karabundle') }}
					</a>
					<a v-if="karaoke.subfile" :href="subtitlesUrl" class="button" download @click="closeModal">
						<font-awesome-icon :icon="['fas', 'closed-captioning']" :fixed-width="true" />
						{{ $t('modal.download.subtitles', {format: subtitlesExtension}) }}
					</a>
					<a v-if="liveURL && live" :href="mediaUrl" class="button" download @click="closeModal">
						<font-awesome-icon :icon="['fas', 'file-video']" :fixed-width="true" />
						{{ $t('modal.download.media', {format: mediaExtension}) }}
					</a>
					<a v-if="liveURL && live" :href="mediaHardsubUrl" class="button" :download="hardsubMediaFileName" @click="closeModal">
						<font-awesome-icon :icon="['fas', 'file-video']" :fixed-width="true" />
						{{ $t('modal.download.media_hardsub') }}
					</a>
				</div>
			</div>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import Modal from './Modal.vue';
	import { getTagInLocale } from '~/utils/tools';
	import { DBKara } from '%/lib/types/database/kara';
	import { ShortTag } from '~/types/tags';
	import { tagTypes } from '~/assets/constants';

	interface VState {
		explorerHost?: string,
		liveURL?: string
	}

	export default Vue.extend({
		name: 'DownloadModal',

		components: {
			Modal
		},

		props: {
			active: Boolean,
			karaoke: {
				type: Object,
				required: true
			} as PropOptions<DBKara>
		},

		data(): VState {
			return {
				explorerHost: process.env.EXPLORER_HOST,
				liveURL: process.env.LIVE_URL
			};
		},
		computed: {
			serieSinger(): ShortTag {
				if (this.karaoke.series[0]) {
					return {
						name: getTagInLocale(this.karaoke.series[0], this.$store.state.auth.user),
						slug: slug(this.karaoke.series[0].name),
						type: 'series',
						tag: this.karaoke.series[0]
					};
				} else if (this.karaoke.singers[0]) {
					return {
						name: getTagInLocale(this.karaoke.singers[0], this.$store.state.auth.user),
						slug: slug(this.karaoke.singers[0].name),
						type: 'singers',
						tag: this.karaoke.singers[0]
					};
				} else { // You never know~
					throw new TypeError('The karaoke does not have any series nor singers, wtf?');
				}
			},
			mediaExtension(): string {
				const mediafile = this.karaoke.mediafile.split('.');
				return mediafile[mediafile.length - 1];
			},
			subtitlesExtension(): string {
				if (this.karaoke.subfile) {
					const subfile = this.karaoke.subfile.split('.');
					return subfile[subfile.length - 1];
				}
				return '';
			},
			kmAppUrl(): string {
				return `km://download/${process.env.API_HOST}/${this.karaoke.kid}`;
			},
			bundleUrl(): string {
				return `${this.$axios.defaults.baseURL}api/karas/${this.karaoke.kid}/raw`;
			},
			mediaUrl(): string {
				return `${this.$axios.defaults.baseURL}downloads/medias/${encodeURIComponent(this.karaoke.mediafile)}`;
			},
			mediaHardsubUrl(): string {
				return `${this.$axios.defaults.baseURL}hardsubs/${this.karaoke.kid}.${this.karaoke.subchecksum}.mp4`;
			},
			hardsubMediaFileName(): string {
				const filename = this.karaoke.mediafile.substring(0, this.karaoke.mediafile.lastIndexOf('.')) || this.karaoke.mediafile;
				return `${filename}.mp4`;
			},
			subtitlesUrl(): string {
				return `${this.$axios.defaults.baseURL}downloads/lyrics/${encodeURIComponent(this.karaoke.subfile)}`;
			},
			live(): boolean {
				// Loop all tags to find a tag with noLiveDownload
				let noLiveDownload = false;
				for (const tagType in tagTypes) {
					if (tagType === 'years') { continue; }
					// @ts-ignore: il est 23h27 <- ceci n'est pas une raison
					for (const tag of this.karaoke[tagType]) {
						if (tag.noLiveDownload) {
							noLiveDownload = true;
						}
					}
				}
				return !noLiveDownload;
			}
		},

		methods: {
			closeModal(): void {
				this.$emit('close');
			}
		}
	});
</script>

<style lang="scss" scoped>

	.label {
		font-weight: normal;
	}

	.boldLabel {
		font-weight: bold;
	}

	.column {
		flex-direction: column;
		display: flex;
		a {
			margin: 0.25em;
		}
	}

</style>
