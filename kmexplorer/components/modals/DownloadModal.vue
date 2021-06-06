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
					<a :href="kmAppUrl" class="button is-success">
						<font-awesome-icon :icon="['fas', 'cloud-download-alt']" :fixed-width="true" />
						{{ $t('modal.download.add') }}
					</a>
					<label class="label">
						{{ $t('modal.download.add_desc') }}
					</label>
				</div>
				<div class="column">
					<a :href="bundleUrl" class="button" :download="`${serieSinger.name} - ${karaoke.title}.karabundle.json`" @click="closeModal">
						<font-awesome-icon :icon="['fas', 'file-export']" :fixed-width="true" />
						{{ $t('modal.download.karabundle') }}
					</a>
					<a v-if="karaoke.subfile" :href="subtitlesUrl" class="button" download @click="closeModal">
						<font-awesome-icon :icon="['fas', 'closed-captioning']" :fixed-width="true" />
						{{ $t('modal.download.subtitles', {format: subtitlesExtension}) }}
					</a>
					<a v-if="liveURL" :href="mediaUrl" class="button" download @click="closeModal">
						<font-awesome-icon :icon="['fas', 'file-video']" :fixed-width="true" />
						{{ $t('modal.download.media', {format: mediaExtension}) }}
					</a>
				</div>
			</div>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import languages from '@cospired/i18n-iso-languages';
	import Modal from './Modal.vue';
	import { getSerieLanguage, getTagInLanguage } from '~/utils/tools';
	import { DBKara } from '%/lib/types/database/kara';
	import { ShortTag } from '~/types/tags';

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
						name: getSerieLanguage(this.karaoke.series[0], this.karaoke.langs[0].name, this.$store.state.auth.user),
						slug: slug(this.karaoke.series[0].name),
						type: 'series',
						tag: this.karaoke.series[0]
					};
				} else if (this.karaoke.singers[0]) {
					return {
						name: getTagInLanguage(this.karaoke.singers[0], languages.alpha2ToAlpha3B(this.$i18n.locale) as string, 'eng'),
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
				return `${this.$axios.defaults.baseURL}downloads/medias/${this.karaoke.mediafile}`;
			},
			subtitlesUrl(): string {
				return `${this.$axios.defaults.baseURL}downloads/lyrics/${this.karaoke.subfile}`;
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

	.column a {
		margin: 0.25em;
	}

</style>
