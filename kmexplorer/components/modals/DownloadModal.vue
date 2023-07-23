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
					<nuxt-link
						v-if="karaoke.karafile"
						:href="jsonUrl"
						class="button"
						:download="`${serieSinger.name} - ${karaoke.titles[karaoke?.titles_default_language??0]}.karabundle.json`"
						@click="closeModal"
					>
						<font-awesome-icon
							:icon="['fas', 'file-export']"
							:fixed-width="true"
						/>
						{{ $t('modal.download.karabundle') }}
					</nuxt-link>
					<nuxt-link
						v-if="karaoke.subfile"
						:href="subtitlesUrl"
						class="button"
						download
						@click="closeModal"
					>
						<font-awesome-icon
							:icon="['fas', 'closed-captioning']"
							:fixed-width="true"
						/>
						{{ $t('modal.download.subtitles', {format: subtitlesExtension}) }}
					</nuxt-link>
					<nuxt-link
						v-if="live"
						:href="mediaUrl"
						class="button"
						download
						@click="closeModal"
					>
						<font-awesome-icon
							:icon="['fas', 'file-video']"
							:fixed-width="true"
						/>
						{{ $t('modal.download.media', {format: mediaExtension}) }}
					</nuxt-link>
					<nuxt-link
						v-if="live"
						:href="mediaHardsubUrl"
						class="button"
						:download="hardsubMediaFileName"
						@click="closeModal"
					>
						<font-awesome-icon
							:icon="['fas', 'file-video']"
							:fixed-width="true"
						/>
						{{ $t('modal.download.media_hardsub') }}
					</nuxt-link>
				</div>
			</div>
		</section>
	</modal>
</template>

<script setup lang="ts">
	import slug from 'slug';
	import { DBKara } from '%/lib/types/database/kara';
	import { tagTypes } from '~/assets/constants';

	const conf = useRuntimeConfig();
	const apiUrl = conf.public.API_URL;

	const props = defineProps<{
		active: boolean,
		karaoke: DBKara
	}>();

	const emit = defineEmits<{(e: 'close'): void}>();

	const serieSinger = computed(() => {
		if (props.karaoke.series[0]) {
			return {
				name: getTagInLocale(props.karaoke.series[0]),
				slug: slug(props.karaoke.series[0].name),
				type: 'series',
				tag: props.karaoke.series[0]
			};
		} else if (props.karaoke.singergroups[0]) {
			return {
				name: getTagInLocale(props.karaoke.singergroups[0]),
				slug: slug(props.karaoke.singergroups[0].name),
				type: 'singergroups',
				tag: props.karaoke.singergroups[0]
			};
		} else if (props.karaoke.singers[0]) {
			return {
				name: getTagInLocale(props.karaoke.singers[0]),
				slug: slug(props.karaoke.singers[0].name),
				type: 'singers',
				tag: props.karaoke.singers[0]
			};
		} else { // You never know~
			throw new TypeError('The karaoke does not have any series nor singers, wtf?');
		}
	});
	
	const mediaExtension = computed(() => {
		const mediafile = props.karaoke.mediafile.split('.');
		return mediafile[mediafile.length - 1];
	});
	const subtitlesExtension = computed(() => {
		if (props.karaoke.subfile) {
			const subfile = props.karaoke.subfile.split('.');
			return subfile[subfile.length - 1];
		}
		return '';
	});
	const jsonUrl = computed(() => {
		return `${apiUrl}downloads/karaokes/${encodeURIComponent(props.karaoke.karafile)}`;
	});
	const mediaUrl = computed(() => {
		return `${apiUrl}downloads/medias/${encodeURIComponent(props.karaoke.mediafile)}`;
	});
	const mediaHardsubUrl = computed(() => {
		return `${apiUrl}hardsubs/${props.karaoke.hardsubbed_mediafile}`;
	});
	const hardsubMediaFileName = computed(() => {
		const filename = props.karaoke.mediafile.substring(0, props.karaoke.mediafile.lastIndexOf('.')) || props.karaoke.mediafile;
		return `${filename}.mp4`;
	});
	const subtitlesUrl = computed(() => {
		return `${apiUrl}downloads/lyrics/${encodeURIComponent(props.karaoke.subfile)}`;
	});
	const live = computed(() => {
		// Loop all tags to find a tag with noLiveDownload
		let noLiveDownload = false;
		for (const tagType in tagTypes) {
			if (tagType === 'years') { continue; }
			// @ts-ignore
			for (const tag of props.karaoke[tagType]) {
				if (tag.noLiveDownload) {
					noLiveDownload = true;
				}
			}
		}
		return !noLiveDownload;
	});

	function closeModal(): void {
		emit('close');
	}
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
