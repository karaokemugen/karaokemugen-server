<template>
	<div class="box">
		<h1 class="title is-1">
			{{ karaoke.title }}
		</h1>
		<kara-phrase tag="h4" class="subtitle is-4" :karaoke="karaoke" />
		<h6 class="subtitle is-6 no-top-margin">
			<a :href="`/years/${karaoke.year}`" @click.prevent="handleLink">
				{{ karaoke.year }}
			</a>
		</h6>
		<button v-if="favorite" class="button margin is-yellow" :class="{'is-loading': loading}" @click="toggleFavorite">
			<font-awesome-icon :icon="['fas', 'eraser']" :fixed-width="true" />
			{{ $t('kara.favorites.remove') }}
		</button>
		<button v-else class="button margin is-yellow" :class="{'is-loading': loading}" @click="toggleFavorite">
			<font-awesome-icon :icon="['fas', 'star']" :fixed-width="true" />
			{{ $t('kara.favorites.add') }}
		</button>
		<table class="table tagList">
			<tbody>
				<tr class="tr-line">
					<td>
						<font-awesome-icon :icon="['fas', 'clock']" :fixed-width="true" />
						{{ duration }}
					</td>
					<td :title="`${$t('kara.created_at')}: ${new Date(karaoke.created_at).toLocaleString()}`">
						{{ $t('kara.modified_at') }}:&nbsp;{{ new Date(karaoke.modified_at).toLocaleString() }}
					</td>
				</tr>
				<tr v-for="type in Object.keys(tagTypesSorted)" :key="type">
					<td>
						<span class="name">
							<font-awesome-icon :icon="['fas', tagTypes[type].icon]" :fixed-width="true" />
							{{ ['singers', 'songwriters', 'creators', 'authors'].includes(type) ?
								$t(`kara.${type}_by`) :
								$tc(`kara.tagtypes.${type}`, karaoke[type].length)
							}}
						</span>
					</td>
					<td>
						<div class="tags are-medium">
							<tag v-for="tag in karaoke[type]" :key="tag.tid" :type="type" :tag="tag" :staticheight="false" />
						</div>
					</td>
				</tr>
			</tbody>
		</table>
		<!-- <div class="content">
			{{ $t('kara.duration') }}:&nbsp;{{ duration }}&nbsp;/&nbsp;{{ $t('kara.created_at') }}:&nbsp;{{ new Date(karaoke.created_at).toLocaleString() }}&nbsp;/&nbsp;{{ $t('kara.modified_at') }}:&nbsp;{{ new Date(karaoke.modified_at).toLocaleString() }}
		</div> -->
		<div class="buttons">
			<button class="button is-info" @click="toggleLyrics">
				<font-awesome-icon :icon="['fas', 'closed-captioning']" :fixed-width="true" />
				{{ lyrics ? $t('kara.lyrics.hide'):$t('kara.lyrics.show') }}
			</button>
			<a :href="kmAppUrl" class="button is-success">
				<font-awesome-icon :icon="['fas', 'cloud-download-alt']" :fixed-width="true" />
				{{ $t('kara.add') }}
			</a>
			<a :href="bundleUrl" class="button" :download="`${serieSinger.name} - ${karaoke.title}.karabundle.json`">
				<font-awesome-icon :icon="['fas', 'file-export']" :fixed-width="true" />
				{{ $t('kara.download.karabundle') }}
			</a>
			<a :href="mediaUrl" class="button" download>
				<font-awesome-icon :icon="['fas', 'file-video']" :fixed-width="true" />
				{{ $t('kara.download.media') }}
			</a>
		</div>
		<div v-show="lyrics" class="box is-clear">
			<ul>
				<li v-for="(line, i) in karaoke.lyrics" :key="`lyrics-${i}`">
					{{ line.text }}
				</li>
			</ul>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import languages from '@cospired/i18n-iso-languages';
	import { fakeYearTag, generateNavigation, getSerieLanguage } from '~/utils/tools';
	import { tagTypes } from '~/assets/constants';
	import Tag from '~/components/Tag.vue';
	import KaraPhrase from '~/components/KaraPhrase.vue';
	import { menuBarStore, modalStore } from '~/store';
	import { DBKara } from '%/lib/types/database/kara';
	import { serieSinger } from '~/types/serieSinger';
	import duration from '~/assets/date';

	interface VState {
		tagTypes: typeof tagTypes,
		favorite: boolean,
		lyrics: boolean,
		loading: boolean
	}

	export default Vue.extend({
		name: 'KaraFullInfo',

		components: {
			Tag,
			KaraPhrase
		},

		props: {
			karaoke: {
				type: Object,
				required: true
			} as PropOptions<DBKara>
		},

		data(): VState {
			return {
				tagTypes,
				favorite: false,
				lyrics: false,
				loading: false
			};
		},

		computed: {
			tagTypesSorted(): object {
				const tagTypes = { ...this.tagTypes };
				delete tagTypes.songtypes; // Don't show songtypes on full view, as it's already shown in the title
				delete tagTypes.years; // This is a decoy for fake years tag
				// Remove unused tagTypes in context
				for (const tagType in tagTypes) {
					// @ts-ignore
					if (this.karaoke[tagType].length === 0) {
						delete tagTypes[tagType];
					}
				}
				return tagTypes;
			},
			serieSinger(): serieSinger {
				if (this.karaoke.series[0]) {
					return {
						name: getSerieLanguage(this.karaoke.series[0], this.karaoke.langs[0].name, this.$store.state.auth.user),
						tid: `${this.karaoke.series[0].tid}~${tagTypes.series.type}`,
						slug: slug(this.karaoke.series[0].name),
						type: 'series'
					};
				} else if (this.karaoke.singers[0]) {
					return {
						name: this.karaoke.singers[0].i18n[languages.alpha2ToAlpha3B(this.$i18n.locale)] || this.karaoke.singers[0].i18n.eng || this.karaoke.singers[0].name,
						tid: `${this.karaoke.singers[0].tid}~${tagTypes.singers.type}`,
						slug: slug(this.karaoke.singers[0].name),
						type: 'singers'
					};
				} else { // You never know~
					return {
						name: '¯\\_(ツ)_/¯',
						tid: '6339add6-b9a3-46c4-9488-2660caa30487~1',
						slug: 'wtf',
						type: 'singers'
					};
				}
			},
			songtype(): string {
				return this.karaoke.songtypes[0].i18n[languages.alpha2ToAlpha3B(this.$i18n.locale)] || this.karaoke.songtypes[0].i18n.eng || this.karaoke.songtypes[0].name;
			},
			songtypeSlug(): string {
				return slug(this.karaoke.songtypes[0].name);
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
			duration(): string {
				const durationArray = duration(this.karaoke.duration);
				const returnString = [];
				if (durationArray[0] !== 0) { returnString.push(`${durationArray[0]} ${this.$t('duration.days')}`); }
				if (durationArray[1] !== 0) { returnString.push(`${durationArray[1]} ${this.$t('duration.hours')}`); }
				if (durationArray[2] !== 0) { returnString.push(`${durationArray[2]} ${this.$t('duration.minutes')}`); }
				if (durationArray[3] !== 0) { returnString.push(`${durationArray[3]} ${this.$t('duration.seconds')}`); }
				return returnString.join(' ');
			}
		},

		created() {
			if (this.karaoke?.flag_favorites) { this.favorite = true; }
		},

		methods: {
			async toggleFavorite() {
				if (this.$auth.loggedIn) {
					this.loading = true;
					if (this.favorite) {
						await this.$axios.delete(`/api/favorites/${this.karaoke.kid}`);
					} else {
						await this.$axios.post(`/api/favorites/${this.karaoke.kid}`);
					}
					this.favorite = !this.favorite;
					this.loading = false;
				} else {
					modalStore.openModal('auth');
				}
			},
			toggleLyrics() {
				this.lyrics = !this.lyrics;
			},
			handleLink() {
				menuBarStore.addTag({
					tag: fakeYearTag(this.karaoke.year.toString()),
					type: 'years'
				});
				this.$router.push(generateNavigation(menuBarStore));
			}
		},

		head() {
			return {
				meta: [
					{
						hid: 'twitter:title',
						name: 'twitter:title',
						content: this.$t('kara.meta', { // @ts-ignore: mais²
							songtitle: this.karaoke.title, serieSinger: this.serieSinger.name
						}) as string
					},
					{
						hid: 'description',
						name: 'description',
						content: this.$t('kara.meta', { // @ts-ignore: mais²
							songtitle: this.karaoke.title, serieSinger: this.serieSinger.name
						}) as string
					},
					{
						hid: 'og:title',
						property: 'og:title',
						content: this.$t('kara.meta', { // @ts-ignore: mais²
							songtitle: this.karaoke.title, serieSinger: this.serieSinger.name
						}) as string
					}
				]
			};
		}
	});
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

	.button.margin {
		margin: 1em 0;
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
