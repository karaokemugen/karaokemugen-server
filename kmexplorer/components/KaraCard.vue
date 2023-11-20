<template>
	<div class="box">
		<div
			class="header"
			@mouseenter="switchImage"
			@mouseleave="switchImage"
		>
			<nuxt-link
				:to="`/kara/${getSlug}/${karaoke.kid}`"
				class="images"
				:class="{blur: karaoke.warnings.length > 0}"
			>
				<img
					:src="images[0]"
					alt=""
				>
				<img
					v-if="images.length > 1"
					:src="images[1]"
					:class="{activate}"
					alt=""
				>
			</nuxt-link>
		</div>
		<div class="title-block">
			<button
				v-if="favorite && favorites"
				class="button inline is-normal is-yellow"
				:class="{'is-loading': loading}"
				:title="$t('kara.favorites.remove')"
				@click="toggleFavorite"
			>
				<font-awesome-icon
					:icon="['fas', 'eraser']"
					:fixed-width="true"
				/>
			</button>
			<button
				v-else-if="favorites"
				class="button inline is-normal is-yellow"
				:class="{'is-loading': loading}"
				:title="$t('kara.favorites.add')"
				@click="toggleFavorite"
			>
				<font-awesome-icon
					:icon="['fas', 'star']"
					:fixed-width="true"
				/>
			</button>
			<add-to-playlist-button
				:kid="karaoke.kid"
				:loading="loading"
				:playlists="playlists"
				:kara-card="true"
				@update-playlist="() => emit('update-playlist')"
			/>
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
			</div>
		</div>
		<div class="lebonflex">
			<div class="tags are-medium">
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
			<i18n-t
				v-if="karaoke.favorited"
				keypath="kara.stats.favorited"
				tag="div"
				class="box stats"
			>
				<template #number>
					<span class="nb">{{ karaoke.favorited }}</span>
				</template>
			</i18n-t>
			<i18n-t
				v-if="karaoke.requested"
				keypath="kara.stats.requested"
				tag="div"
				class="box stats blue"
			>
				<template #number>
					<span class="nb">{{ karaoke.requested }}</span>
				</template>
			</i18n-t>
			<i18n-t
				v-if="karaoke.played"
				keypath="kara.stats.played"
				tag="div"
				class="box stats blue"
			>
				<template #number>
					<span class="nb">{{ karaoke.played }}</span>
				</template>
			</i18n-t>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { DBKara } from '%/lib/types/database/kara';
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';
	import { storeToRefs } from 'pinia';
	import slug from 'slug';
	import { tagTypes } from '~/assets/constants';
	import { useAuthStore } from '~/store/auth';
	import type { TagExtend } from '~/store/menubar';
	import { useModalStore } from '~/store/modal';

	const props = defineProps<{
		karaoke: DBKara
		karaokesI18n?: Record<string, Record<string, string>>
		playlists: DBPL[]
	}>();

	const emit = defineEmits<{ (e: 'update-playlist'): void }>();

	const { openModal } = useModalStore();
	const { loggedIn } = storeToRefs(useAuthStore());

	const conf = useRuntimeConfig();
	const hardsubUrl = conf.public.HARDSUB_URL;

	const activate = ref(false);
	const loading = ref(false);
	// If the tag is present, the user is logged in
	const favorite = ref(typeof props.karaoke.flag_favorites === 'boolean' ? props.karaoke.flag_favorites : false);
	const favorites = ref(typeof props.karaoke.flag_favorites === 'boolean');

	const title = computed((): string => {
		return getTitleInLocale(props.karaoke.titles, props.karaoke.titles_default_language);
	});
	const images = computed((): string[] => {
		return props.karaoke.mediafile.endsWith('.mp3')
			? [`${hardsubUrl}previews/${props.karaoke.kid}.${props.karaoke.mediasize}.25.jpg`]
			: [
				`${hardsubUrl}previews/${props.karaoke.kid}.${props.karaoke.mediasize}.25.jpg`,
				`${hardsubUrl}previews/${props.karaoke.kid}.${props.karaoke.mediasize}.33.jpg`,
			];
	});
	const getSlug = computed((): string => {
		return slug(props.karaoke.titles[props.karaoke.titles_default_language || 'eng']);
	});
	const tagTypesSorted = computed((): object => {
		const tagTypesSorted = { ...tagTypes };
		delete tagTypesSorted.years; // This is a decoy for fake years tag
		delete tagTypesSorted.versions; // Versions are in KaraPhrase
		delete tagTypesSorted.collections; // Collections are not useful information
		// Remove unused tagTypes in context
		for (const tagType in tagTypesSorted) {
			// @ts-ignore
			if (props.karaoke[tagType].length === 0) {
				delete tagTypesSorted[tagType];
			}
		}
		return tagTypesSorted;
	});
	const tags = computed((): TagExtend[] => {
		const tags: TagExtend[] = [];
		for (const tagType in tagTypesSorted.value) {
			let i = 0;
			// @ts-ignore
			for (const tag of props.karaoke[tagType]) {
				// Removing all tags mentioned in the karaphrase
				if (!(
					(props.karaoke.from_display_type === tagType && i === 0) ||
					// Remove the first series
					(tagType === 'series' && i === 0 &&
						!props.karaoke.from_display_type) ||
					// Remove the first songtype
					(tagType === 'songtypes' && i === 0) ||
					// Remove the first singergroups if the karaoke has no series
					(tagType === 'singergroups' && i === 0 &&
						props.karaoke.series.length === 0 &&
						!props.karaoke.from_display_type) ||
					// Remove the first singer if the karaoke has no singergroups and no series
					(tagType === 'singers' &&
						i === 0 &&
						props.karaoke.singergroups.length === 0 &&
						props.karaoke.series.length === 0 &&
						!props.karaoke.from_display_type) ||
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
		tags.push({
			type: 'years',
			tag: fakeYearTag(props.karaoke.year.toString()),
		});
		return tags;
	});

	function switchImage() {
		activate.value = !activate.value;
	}
	async function toggleFavorite() {
		if (loggedIn.value) {
			loading.value = true;
			if (favorite.value) {
				await useCustomFetch(`/api/favorites/${props.karaoke.kid}`, {
					method: 'DELETE',
				});
			} else {
				await useCustomFetch(`/api/favorites/${props.karaoke.kid}`, {
					method: 'POST',
				});
			}
			favorite.value = !favorite.value;
			loading.value = false;
		} else {
			openModal('auth');
		}
	}
</script>

<style scoped lang="scss">
	.box {
		height: 100%;
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
	}

	.lebonflex {
		display: flex;
	}

	.button.inline {
		margin: 0.5em 0;
	}

	.title, .subtitle {
		margin-bottom: unset;
		margin-top: unset;
	}

	.header {
		width: 100%;
		flex-shrink: 0;
	}

	h5.subtitle.is-56 {
		font-size: 18px;
	}

	@media (max-width: 769px), (hover: none) {
		.images {
			width: 100%;

			img {
				width: 100%;
				height: 11em;
				object-fit: cover;
				border-radius: 0.25rem;
			}
		}
	}

	.images {
		display: inline-block;
		position: relative;
		width: 100%;

		img {
			width: 100%;
			height: 11em;
			object-fit: cover;
			border-radius: 0.25rem;
		}

		img:nth-child(2) {
			position: absolute;
			left: 0;
			top: 0;
			opacity: 0;
			transition: opacity 0.25s linear;
		}

		img:nth-child(2).activate {
			opacity: 1;
		}
	}

	.images.blur > img {
		filter: blur(10px) brightness(75%);
	}

	.tags {
		margin-top: 0.5rem;
		display: unset;

		.tag *:first-child {
			margin-right: 0.25rem;
		}
	}

	.box.stats {
		display: unset;
		background-color: #7e6f1875;
		width: 70%;
		height: min-content;
		padding: 1rem;
		text-align: center;
		margin-top: .5rem;
		.nb {
			display: block;
			font-size: 2.5rem;
		}
	}

	.box.stats.blue {
		background-color: #315eb575;
	}

	.button.is-yellow {
		margin-right: 0.5em;

		.svg-inline--fa {
			margin: 0;
		}

	}

	.title-block {
		display: flex;
	}
</style>
