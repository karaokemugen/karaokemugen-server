<template>
	<div class="box">
		<h1 class="title is-1">
			{{ karaoke.title }}
		</h1>
		<i18n path="kara.phrase" tag="h4" class="subtitle is-4">
			<template v-slot:songtype>
				<nuxt-link :to="`/tags/${songtypeSlug}/${karaoke.songtypes[0].tid}~3`">
					{{ songtype }}
				</nuxt-link>
				{{ karaoke.songorder }}
			</template>
			<template v-slot:series>
				<nuxt-link :to="`/tags/${serieSinger.slug}/${serieSinger.tid}`">
					{{ serieSinger.name }}
				</nuxt-link>
			</template>
		</i18n>
		<h6 class="subtitle is-6 no-top-margin">
			<nuxt-link :to="`/years/${karaoke.year}`">
				{{ karaoke.year }}
			</nuxt-link>
		</h6>
		<table class="tagList">
			<tbody>
				<tr v-for="type in Object.keys(tagTypesSorted)" :key="type">
					<td>
						<span class="name"><font-awesome-icon :icon="['fas', tagTypes[type].icon]" :fixed-width="true" /> {{ $tc(`kara.tagtypes.${type}`, karaoke[type].length) }}</span>
					</td>
					<td>
						<div class="tags are-medium">
							<tag v-for="tag in karaoke[type]" :key="tag.tid" :type="type" :tag="tag" />
						</div>
					</td>
				</tr>
			</tbody>
		</table>
		<div class="buttons">
			<a :href="kmAppUrl" class="button is-success">
				<font-awesome-icon :icon="['fas', 'cloud-download-alt']" :fixed-width="true" />
				{{ $t('kara.add') }}
			</a>
			<button v-if="favorite" class="button is-warning" :class="{'is-loading': loading}" @click="toggleFavorite">
				<font-awesome-icon :icon="['fas', 'star']" :fixed-width="true" />
				{{ $t('kara.favorites.remove') }}
			</button>
			<button v-else class="button is-warning" :class="{'is-loading': loading}" @click="toggleFavorite">
				<font-awesome-icon :icon="['fas', 'star']" :fixed-width="true" />
				{{ $t('kara.favorites.add') }}
			</button>
			<a :href="bundleUrl" class="button" :download="`${serieSinger.name} - ${karaoke.title}.karabundle.json`">
				<font-awesome-icon :icon="['fas', 'file-export']" :fixed-width="true" />
				{{ $t('kara.download') }}
			</a>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import slug from 'slug';

	import { tagTypes } from '~/assets/constants';
	import Tag from '~/components/Tag.vue';
	import { modalStore } from '~/store';
	import { serieSinger } from '~/types/serieSinger';

	interface VState {
		tagTypes: typeof tagTypes,
		favorite: boolean,
		loading: boolean
	}

	export default Vue.extend({
		name: 'KaraFullInfo',

		components: {
			Tag
		},

		props: ['karaoke'],

		data(): VState {
			return {
				tagTypes,
				favorite: false,
				loading: false
			};
		},

		computed: {
			tagTypesSorted(): object {
				const tagTypes = { ...this.tagTypes };
				delete tagTypes.songtypes; // Don't show songtypes on full view, as it's already shown in the title
				// Remove unused tagTypes in context
				for (const tagType in tagTypes) {
					if (this.karaoke[tagType].length === 0) {
						delete tagTypes[tagType];
					}
				}
				return tagTypes;
			},
			serieSinger(): serieSinger {
				if (this.karaoke.series[0]) {
					return {
						name: this.karaoke.series[0].i18n[this.$i18n.locale] || this.karaoke.series[0].i18n.eng || this.karaoke.series[0].name,
						tid: `${this.karaoke.series[0].tid}~${tagTypes.series.type}`,
						slug: slug(this.karaoke.series[0].name)
					};
				} else if (this.karaoke.singers[0]) {
					return {
						name: this.karaoke.singers[0].i18n[this.$i18n.locale] || this.karaoke.singers[0].i18n.eng || this.karaoke.singers[0].name,
						tid: `${this.karaoke.singers[0].tid}~${tagTypes.singers.type}`,
						slug: slug(this.karaoke.singers[0].name)
					};
				} else { // You never know~
					return {
						name: '¯\\_(ツ)_/¯',
						tid: '6339add6-b9a3-46c4-9488-2660caa30487~1',
						slug: 'wtf'
					};
				}
			},
			songtype(): string {
				return this.karaoke.songtypes[0].i18n[this.$i18n.locale] || this.karaoke.songtypes[0].i18n.eng || this.karaoke.songtypes[0].name;
			},
			songtypeSlug(): string {
				return slug(this.karaoke.songtypes[0].name);
			},
			kmAppUrl(): string {
				return `km://download/${process.env.API_HOST}/${this.karaoke.kid}`;
			},
			bundleUrl(): string {
				return `${this.$axios.defaults.baseURL}api/karas/${this.karaoke.kid}/raw`;
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
			}
		},

		head() {
			return {
				meta: [
					{
						hid: 'twitter-title',
						name: 'twitter:title', // @ts-ignore: mais.
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
	.tagList {
		border-collapse: unset;
		border-spacing: 0 1em;
	}

	.tagList span.name {
		margin-right: 3em;
	}

	.subtitle.no-top-margin {
		margin-top: -1.25rem;
	}
</style>
