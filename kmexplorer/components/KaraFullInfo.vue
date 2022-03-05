<template>
	<div class="box">
		<h1 class="title is-1">
			{{ title }}
		</h1>
		<kara-phrase tag="h4" class="subtitle is-4" :karaoke="karaoke" />
		<h6 class="subtitle is-6 no-top-margin">
			<a :href="`/years/${karaoke.year}`" @click.prevent="handleLink">
				{{ karaoke.year }}
			</a>
		</h6>
		<div class="buttons margin">
			<button v-if="favorite" class="button is-yellow" :class="{'is-loading': loading}" @click="toggleFavorite">
				<font-awesome-icon :icon="['fas', 'eraser']" :fixed-width="true" />
				{{ $t('kara.favorites.remove') }}
			</button>
			<button v-else class="button is-yellow" :class="{'is-loading': loading}" @click="toggleFavorite">
				<font-awesome-icon :icon="['fas', 'star']" :fixed-width="true" />
				{{ $t('kara.favorites.add') }}
			</button>
			<button
				v-if="loggedIn"
				class="button is-purple is-long"
				:disabled="bannerBan"
				:title="bannerBan ? $t('kara.set_banner.forbidden_label'):null"
				@click.prevent="modal.banner=true"
			>
				<font-awesome-icon :icon="['fas', 'image']" :fixed-width="true" />
				{{ $t('kara.set_banner.btn') }}
			</button>
		</div>
		<table class="table tagList">
			<tbody>
				<tr class="tr-line">
					<td>
						<font-awesome-icon :icon="['fas', 'clock']" :fixed-width="true" />
						{{ duration }}
					</td>
					<td>
						{{ $t('kara.created_at') }}:&nbsp;{{ new Date(karaoke.created_at).toLocaleString() }}
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
		<div class="buttons">
			<button class="button is-info" @click="toggleLyrics">
				<font-awesome-icon :icon="['fas', 'closed-captioning']" :fixed-width="true" />
				{{ lyrics ? $t('kara.lyrics.hide'):$t('kara.lyrics.show') }}
			</button>
			<a class="button is-success" @click.prevent="modal.download = true">
				<font-awesome-icon :icon="['fas', 'cloud-download-alt']" :fixed-width="true" />
				{{ $t('kara.download') }}
			</a>
		</div>
		<div v-show="lyrics" class="box is-clear">
			<ul>
				<li v-for="(line, i) in karaoke.lyrics" :key="`lyrics-${i}`">
					{{ line.text }}
				</li>
			</ul>
		</div>
		<DownloadModal :karaoke="karaoke" :active="modal.download" @close="modal.download=false" />
		<BannerChangeModal :karaoke="karaoke" :active="modal.banner" @close="modal.banner=false" />
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import { mapState } from 'vuex';
	import { fakeYearTag, generateNavigation, getTagInLocale, getTitleInLocale } from '~/utils/tools';
	import { tagTypes } from '~/assets/constants';
	import Tag from '~/components/Tag.vue';
	import KaraPhrase from '~/components/KaraPhrase.vue';
	import { menuBarStore, modalStore } from '~/store';
	import { DBKara } from '%/lib/types/database/kara';
	import { ShortTag } from '~/types/tags';
	import duration from '~/assets/date';
	import DownloadModal from '~/components/modals/DownloadModal.vue';
	import BannerChangeModal from '~/components/modals/BannerChangeModal.vue';

	interface VState {
		tagTypes: typeof tagTypes,
		favorite: boolean,
		lyrics: boolean,
		loading: boolean,
		modal: {
			download: boolean,
			banner: boolean
		}
	}

	export default Vue.extend({
		name: 'KaraFullInfo',

		components: {
			Tag,
			KaraPhrase,
			DownloadModal,
			BannerChangeModal
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
				loading: false,
				modal: {
					download: false,
					banner: false
				}
			};
		},

		head() {
			return {
				meta: [
					{
						hid: 'twitter:title',
						name: 'twitter:title',
						content: this.$t('kara.meta', { // @ts-ignore: mais²
							songtitle: this.karaoke.titles.eng, serieSinger: this.serieSinger.name
						}) as string
					},
					{
						hid: 'description',
						name: 'description',
						content: this.$t('kara.meta', { // @ts-ignore: mais²
							songtitle: this.karaoke.titles.eng, serieSinger: this.serieSinger.name
						}) as string
					},
					{
						hid: 'og:title',
						property: 'og:title',
						content: this.$t('kara.meta', { // @ts-ignore: mais²
							songtitle: this.karaoke.titles.eng, serieSinger: this.serieSinger.name
						}) as string
					}
				]
			};
		},

		computed: {
			title(): string {
				return getTitleInLocale(this.karaoke.titles, this.$store.state.auth.user);
			},
			tagTypesSorted(): object {
				const tagTypes = { ...this.tagTypes };
				if (this.karaoke.songtypes.length === 1) {
					delete tagTypes.songtypes; // Don't show songtypes on full view, as it's already shown in the title
				}
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
			bannerBan(): boolean {
				let bannerBan = false;
				for (const tagType in tagTypes) {
					if (tagType === 'years') { continue; }
					// @ts-ignore: il est 23h27 <- ceci n'est pas une raison
					for (const tag of this.karaoke[tagType]) {
						if (
							(process.env.BANNER_BAN as unknown as string[]).includes(tag.tid)
						) {
							bannerBan = true;
							break;
						}
					}
				}
				return bannerBan;
			},
			duration(): string {
				const durationArray = duration(this.karaoke.duration);
				const returnString = [];
				if (durationArray[0] !== 0) { returnString.push(`${durationArray[0]} ${this.$t('duration.days')}`); }
				if (durationArray[1] !== 0) { returnString.push(`${durationArray[1]} ${this.$t('duration.hours')}`); }
				if (durationArray[2] !== 0) { returnString.push(`${durationArray[2]} ${this.$t('duration.minutes')}`); }
				if (durationArray[3] !== 0) { returnString.push(`${durationArray[3]} ${this.$t('duration.seconds')}`); }
				return returnString.join(' ');
			},
			...mapState('auth', ['loggedIn'])
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
