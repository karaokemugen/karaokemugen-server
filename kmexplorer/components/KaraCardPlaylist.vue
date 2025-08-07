<template>
	<div class="box">
		<div
			class="images"
			:class="{ blur: karaoke.warnings.length > 0 }"
			@click="() => playable && $emit('updatePlayer', karaoke)"
		>
			<button
				:disabled="!playable"
				class="button playButton"
			>
				<font-awesome-icon :icon="['fas', 'play']" />
			</button>
			<img
				:src="images[0]"
				alt=""
			>
		</div>
		<div>
			<nuxt-link
				:to="`/kara/${getSlug}/${karaoke.kid}`"
				class="title is-3 is-spaced"
			>
				{{ title }}
			</nuxt-link>
			<kara-phrase
				:karaoke="karaoke"
				:karaokes-i18n="karaokesI18n"
				tag="h5"
				class="subtitle is-56"
			/>
			<tag
				v-for="tag in tags"
				:key="`${karaoke.kid}-${tag.tag.tid}~${tagTypes[tag.type].type}`"
				:type="tag.type"
				:tag="tag.tag"
				:i18n="karaokesI18n && karaokesI18n[tag.tag.tid]"
				:staticheight="false"
				icon
			/>
		</div>
		<button
			v-if="canEditPlaylist"
			class="button delete-button"
			@click="() => $emit('deleteKaraokes', [karaoke.plcid])"
		>
			<font-awesome-icon :icon="['fas', 'trash']" />
		</button>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';
	import type { DBPLC } from 'kmserver-core/src/lib/types/database/playlist';
	import slug from 'slug';
	import { tagTypes } from '~/assets/constants';
	import { useAuthStore } from '~/store/auth';
	import type { TagExtend } from '~/store/menubar';
	import { useConfigStore } from '~/store/config';

	const props = defineProps<{
		karaoke: DBPLC
		karaokesI18n?: Record<string, Record<string, string>>
		playlist: DBPL
	}>();

	defineEmits<{
		(e: 'updatePlayer', value: DBPLC): void
		(e: 'deleteKaraokes', plcids: number[]): void
	}>();

	const { loggedIn, user } = storeToRefs(useAuthStore());

	const { config, supportedFiles } = storeToRefs(useConfigStore());
	const url = useRequestURL();
	const hardsubUrl = config?.value?.Hardsub?.Url ?? `http${config?.value?.Frontend?.Secure ? 's' : ''}://${url.hostname}`;


	const canEditPlaylist = computed(() =>
		loggedIn?.value &&
		user?.value &&
		(user.value.login === props.playlist.username || props.playlist.contributors?.find(c => user.value?.login === c.username))
	);

	const title = computed((): string => {
		return getTitleInLocale(props.karaoke.titles, props.karaoke.titles_default_language);
	});
	const images = computed((): string[] => {
		return supportedFiles?.value?.audio.some(extension => props.karaoke.mediafile.endsWith(extension))
			? [`${hardsubUrl}/previews/${props.karaoke.kid}.${props.karaoke.mediasize}.25.jpg`]
			: [
				`${hardsubUrl}/previews/${props.karaoke.kid}.${props.karaoke.mediasize}.25.jpg`,
				`${hardsubUrl}/previews/${props.karaoke.kid}.${props.karaoke.mediasize}.33.jpg`,
			];
	});
	const getSlug = computed((): string => {
		return slug(props.karaoke.titles[props.karaoke.titles_default_language || 'eng']);
	});

	const tags = computed((): TagExtend[] => {
		const tags: TagExtend[] = [];
		for (const tagType of ['langs', 'series', 'singers', 'singergroups', 'warnings']) {
			let i = 0;
			// @ts-expect-error
			if (props.karaoke[tagType] && props.karaoke[tagType].length !== 0) {
				// @ts-expect-error
				for (const tag of props.karaoke[tagType]) {
					// Removing all tags mentioned in the karaphrase
					if (!(
						// Remove the first series
						(tagType === 'series' && i === 0) ||
						// Remove the first songtype
						(tagType === 'songtypes' && i === 0) ||
						// Remove the first singergroups if the karaoke has no series
						(tagType === 'singergroups' && i === 0 && props.karaoke.series.length === 0) ||
						// Remove the first singer if the karaoke has no singergroups and no series
						(tagType === 'singers' &&
							i === 0 &&
							props.karaoke.singergroups.length === 0 &&
							props.karaoke.series.length === 0) ||
						// Remove the next tags to avoid overflow
						i > 1
					)) {
						tags.push({
							type: tagType,
							tag
						});
					}
					i++;
				}
			}
		}
		return tags;
	});

	const playable = computed(() => isPlayable(props.karaoke, user?.value?.roles?.admin));
</script>

<style scoped lang="scss">
	.box {
		height: 100%;
		display: flex;
		align-content: flex-start;
		padding: 0;

		.playing & {
			background-color: transparent;
		}
	}

	.tag {
		margin-right: 0.25em;
		margin-bottom: 0.25em;
	}

	.button {
		margin: 1.5em;
		margin-left: auto;
		@media screen and (max-width: 768px) {
			margin-right: 0.5em;
		}
	}

	.title,
	.subtitle {
		margin-bottom: unset;
		margin-top: unset;
	}

	h5.subtitle.is-56 {
		font-size: 18px;
	}

	.images {
		flex: 0 0 9em;
		margin-right: 1em;
		margin-top: 0.5em;

		img {
			width: 100%;
			height: 5em;
			object-fit: cover;
			border-radius: 0.25rem;
		}

		.playButton {
			margin-left: 3em;
			margin-top: 1.3em;
			position: absolute;
			display: none;
			z-index: 1;
		}

		&:hover {
			cursor: pointer;

			.playButton {
				display: flex;
			}
		}
	}

	.images.blur>img {
		filter: blur(10px) brightness(75%);
	}
</style>
