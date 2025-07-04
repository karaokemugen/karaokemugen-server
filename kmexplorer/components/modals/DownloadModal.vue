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
						v-if="karaoke.lyrics_infos[0]"
						:href="subtitlesUrl"
						class="button"
						:download="`${karaoke.songname}.${subtitlesExtension}`"
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
						:download="`${karaoke.songname}.${mediaExtension}`"
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
						:download="`${karaoke.songname}_hardsub.mp4`"
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
	import type { DBKara } from '%/lib/types/database/kara';
	import { useAuthStore } from '~/store/auth';
	import { useConfigStore } from '~/store/config';

	const { config } = storeToRefs(useConfigStore());
	const url = useRequestURL();
	const hardsubUrl = config?.value?.Hardsub?.Url ?? url.origin;

	const props = defineProps<{
		active: boolean,
		karaoke: DBKara
	}>();

	const emit = defineEmits<{(e: 'close'): void}>();
	const { user } = storeToRefs(useAuthStore());

	const serieSinger = computed(() => getSerieOrSingerGroupsOrSingers(props.karaoke));
	
	const mediaExtension = computed(() => {
		const mediafile = props.karaoke.mediafile.split('.');
		return mediafile[mediafile.length - 1];
	});
	const subtitlesExtension = computed(() => {
		if (props.karaoke.lyrics_infos[0]) {
			const subfile = props.karaoke.lyrics_infos[0].filename.split('.');
			return subfile[subfile.length - 1];
		}
		return '';
	});
	const jsonUrl = computed(() => {
		return `${url.origin}/downloads/karaokes/${encodeURIComponent(props.karaoke.karafile)}`;
	});
	const mediaUrl = computed(() => {
		return `${url.origin}/downloads/medias/${encodeURIComponent(props.karaoke.mediafile)}`;
	});
	const mediaHardsubUrl = computed(() => {
		return `${hardsubUrl}/hardsubs/${props.karaoke.hardsubbed_mediafile}`;
	});
	const subtitlesUrl = computed(() => {
		return `${url.origin}/downloads/lyrics/${encodeURIComponent(props.karaoke.lyrics_infos[0].filename)}`;
	});
	const live = computed(() => isPlayable(props.karaoke, user?.value?.roles?.admin));

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
