<template>
	<div class="box">
		<h1 class="title is-1">
			{{ title }}
		</h1>
		<kara-phrase
			tag="h4"
			class="subtitle is-4"
			:karaoke="karaoke"
		/>
		<h6 class="subtitle is-6 no-top-margin">
			<nuxt-link
				:href="`/types/years/${karaoke.year}`"
				@click.prevent="handleLink"
			>
				{{ karaoke.year }}
			</nuxt-link>
		</h6>
		<div class="buttons margin">
			<button
				v-if="favorite"
				class="button is-yellow"
				:class="{ 'is-loading': loading }"
				@click="toggleFavorite"
			>
				<font-awesome-icon
					:icon="['fas', 'eraser']"
					:fixed-width="true"
				/>
				{{ $t('kara.favorites.remove') }}
			</button>
			<button
				v-else
				class="button is-yellow"
				:class="{ 'is-loading': loading }"
				@click="toggleFavorite"
			>
				<font-awesome-icon
					:icon="['fas', 'star']"
					:fixed-width="true"
				/>
				{{ $t('kara.favorites.add') }}
			</button>
			<add-to-playlist-button
				:kid="karaoke.kid"
				:loading="loading"
				:playlists="playlists"
			/>
			<button
				v-if="loggedIn"
				class="button is-purple is-long"
				:disabled="bannerBan"
				:title="bannerBan ? $t('kara.set_banner.forbidden_label') : undefined"
				@click.prevent="() => openModal('banner')"
			>
				<font-awesome-icon
					:icon="['fas', 'image']"
					:fixed-width="true"
				/>
				{{ $t('kara.set_banner.btn') }}
			</button>
		</div>
		<table class="table tagList">
			<tbody>
				<tr class="tr-line">
					<td>
						<font-awesome-icon
							:icon="['fas', 'clock']"
							:fixed-width="true"
						/>
						{{ durationString }}
					</td>
					<td>
						{{ $t('kara.created_at') }}:&nbsp;{{ new Date(karaoke.created_at).toLocaleString() }}
					</td>
				</tr>
				<tr
					v-for="type in Object.keys(tagTypesSorted)"
					:key="type"
				>
					<td>
						<span class="name">
							<font-awesome-icon
								:icon="['fas', tagTypes[type].icon]"
								:fixed-width="true"
							/>
							{{ ['singers', 'songwriters', 'creators', 'authors'].includes(type) ?
								$t(`kara.${type}_by`) :
								$t(`kara.tagtypes.${type}`, (karaoke as any)[type].length)
							}}
						</span>
					</td>
					<td>
						<div class="tags are-medium">
							<tag
								v-for="tag in (karaoke as any)[type]"
								:key="tag.tid"
								:type="type"
								:tag="tag"
								:staticheight="false"
							/>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
		<div class="buttons">
			<button
				v-if="rubyfiedLyrics"
				class="button is-info"
				@click="toggleLyrics"
			>
				<font-awesome-icon
					:icon="['fas', 'closed-captioning']"
					:fixed-width="true"
				/>
				{{ lyrics ? $t('kara.lyrics.hide') : $t('kara.lyrics.show') }}
			</button>
			<nuxt-link
				class="button is-success"
				@click.prevent="openModal('download')"
			>
				<font-awesome-icon
					:icon="['fas', 'cloud-download-alt']"
					:fixed-width="true"
				/>
				{{ $t('kara.download') }}
			</nuxt-link>
		</div>
		<div
			v-show="lyrics"
			class="box is-clear"
		>
			<ul>
				<li
					v-for="(line, i) in rubyfiedLyrics"
					:key="`lyrics-${i}`"
				>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<span v-html="line" />
				</li>
			</ul>
		</div>
		<DownloadModal
			:karaoke="karaoke"
			:active="download"
			@close="() => closeModal('download')"
		/>
		<BannerChangeModal
			:karaoke="karaoke"
			:active="banner"
			@close="() => closeModal('banner')"
		/>
	</div>
</template>

<script setup lang='ts'>
	import slug from 'slug';
	import { storeToRefs } from 'pinia';
	import { tagTypes } from '~/assets/constants';
	import { DBKara } from '%/lib/types/database/kara';
	import { ShortTag } from '~/types/tags';
	import { useMenubarStore } from '~/store/menubar';
	import { useModalStore } from '~/store/modal';
	import { useAuthStore } from '~/store/auth';
	import DOMPurify from 'isomorphic-dompurify';
	import { DBPL } from 'kmserver-core/src/lib/types/database/playlist';

	const props = defineProps<{
		karaoke: DBKara
	}>();

	const favorite = ref(false);
	const lyrics = ref(false);
	const loading = ref(false);
	const playlists = ref<DBPL[]>([]);

	const { t } = useI18n();
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { download, banner } = storeToRefs(useModalStore());
	const { openModal, closeModal } = useModalStore();
	const { search } = storeToRefs(useMenubarStore());
	const { addTag } = useMenubarStore();
	const { push } = useRouter();

	const conf = useRuntimeConfig();
	const bannerBanValue = conf.public.BANNER_BAN;

	const title = computed(() => getTitleInLocale(props.karaoke.titles, props.karaoke.titles_default_language));
	const tagTypesSorted = computed(() => {
		const tagTypesUpdated = { ...tagTypes };
		if (props.karaoke.songtypes.length === 1) {
			delete tagTypesUpdated.songtypes; // Don't show songtypes on full view, as it's already shown in the title
		}
		delete tagTypesUpdated.years; // This is a decoy for fake years tag
		// Remove unused tagTypes in context
		for (const tagType in tagTypesUpdated) {
			// @ts-ignore
			if (props.karaoke[tagType].length === 0) {
				delete tagTypesUpdated[tagType];
			}
		}
		return tagTypesUpdated;
	});
	const serieSinger = computed<ShortTag>(() => {
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
	const rubyfiedLyrics = computed(() =>
		props.karaoke.lyrics?.map(line => {
			const parsedSyllables = line.fullText?.map(event => event.text
				.replace('｜', '|')
				.replace('|!', '|')
				.replace('|<', '|')) ?? [];
			const rubifiedArray: Record<'text' | 'ruby', string>[] = [];
			parsedSyllables.forEach(syl => {
				if (syl.match(/#\|.*/g)) {
					const lastElement = rubifiedArray.pop();
					if (lastElement) {
						lastElement.ruby += syl.substring(2);
						rubifiedArray.push(lastElement);
					}
				} else if (syl.match(/.*\|.*/g)) {
					rubifiedArray.push({
						text: syl.split('|')[0],
						ruby: syl.split('|')[1]
					});
				} else {
					rubifiedArray.push({
						text: syl,
						ruby: ''
					});
				}
			});
			const lyricsWithRuby = rubifiedArray.map(seq => {
				if (!seq.ruby) {
					return seq.text;
				}
				return `<ruby>${seq.text}<rp>(</rp><rt>${seq.ruby}</rt><rp>)</rp></ruby>`;
			}).join('');

			return DOMPurify.sanitize(lyricsWithRuby, { ALLOWED_TAGS: ['ruby', 'rp', 'rt'] });
		})
	);
	const bannerBan = computed(() => {
		let bannerBan = false;
		for (const tagType in tagTypes) {
			if (tagType === 'years') { continue; }
			// @ts-ignore: il est 23h27 <- ceci n'est pas une raison
			for (const tag of props.karaoke[tagType]) {
				if (
					bannerBanValue.includes(tag.tid)
				) {
					bannerBan = true;
					break;
				}
			}
		}
		return bannerBan;
	});
	const durationString = computed(() =>  getDurationString(props.karaoke.duration, t));

	onMounted(() => {
		if (props.karaoke?.flag_favorites) { favorite.value = true; }
	});

	watch(search, () => push('/search'));

	getPlaylists();

	useHead({
		meta: [
			{
				hid: 'twitter:title',
				name: 'twitter:title',
				content: formatWarnings() + t('kara.meta', {
					songtitle: props.karaoke.titles_default_language && props.karaoke.titles[props.karaoke.titles_default_language], serieSinger: serieSinger.value.name
				})
			},
			{
				hid: 'description',
				name: 'description',
				content: formatWarnings() + t('kara.meta', {
					songtitle: props.karaoke.titles_default_language && props.karaoke.titles[props.karaoke.titles_default_language], serieSinger: serieSinger.value.name
				})
			},
			{
				hid: 'og:title',
				property: 'og:title',
				content: formatWarnings() + t('kara.meta', {
					songtitle: props.karaoke.titles_default_language && props.karaoke.titles[props.karaoke.titles_default_language], serieSinger: serieSinger.value.name
				})
			}
		]
	});

	async function getPlaylists() {
		playlists.value = await useCustomFetch<DBPL[]>('/api/playlist', {
			params: {
				username: user?.value?.login,
				includeUserAsContributor: true
			}
		});
	}

	async function toggleFavorite() {
		if (loggedIn.value) {
			loading.value = true;
			if (favorite.value) {
				await useCustomFetch(`/api/favorites/${props.karaoke.kid}`, {
					method: 'DELETE'
				});
			} else {
				await useCustomFetch(`/api/favorites/${props.karaoke.kid}`, {
					method: 'POST'
				});
			}
			favorite.value = !favorite.value;
			loading.value = false;
		} else {
			openModal('auth');
		}
	}
	function toggleLyrics() {
		lyrics.value = !lyrics.value;
	}
	function handleLink() {
		addTag({
			tag: fakeYearTag(props.karaoke.year.toString()),
			type: 'years'
		});
		push(generateNavigation());
	}
	function formatWarnings() {
		if (!props.karaoke?.warnings?.length) {
			return '';
		}
		return '[' + props.karaoke?.warnings?.map(warning => warning.name).join(', ') + '] ';
	}
</script>

<style scoped lang="scss">
	.table.tagList {
		width: calc(2.5rem + 100%);
		left: -1.25rem;
		position: relative;
		background-color: unset;

		tr:first-child > td, tr:last-child > td {
			border-width: 1px 0 1px;
		}

		td:first-child {
			padding-left: 1.25rem;
			vertical-align: middle;
		}
	}

	.buttons.margin {
		margin: 1em 0;

		.button.is-long {
			white-space: normal;
		}
	}

	.subtitle.no-top-margin {
		margin-top: -1.25rem;
		margin-bottom: 0;
	}

	.box.is-clear {
		background-color: lighten(#373f40, 5);
		width: fit-content;
		overflow-wrap: anywhere;
	}

	.tr-line > td {
		height: 2em;
		line-height: 2em;
	}
</style>
