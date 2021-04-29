<template>
	<div class="box">
		<div class="header" @mouseenter="switchImage" @mouseleave="switchImage">
			<nuxt-link :to="`/kara/${slug}/${karaoke.kid}`" class="images" :class="{blur: problematic}">
				<v-lazy-image :src="images[0]" alt="" />
				<v-lazy-image v-if="images.length > 1" :src="images[1]" :class="{activate}" alt="" />
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
				<font-awesome-icon :icon="['fas', 'eraser']" :fixed-width="true" />
			</button>
			<button
				v-else-if="favorites"
				class="button inline is-normal is-yellow"
				:class="{'is-loading': loading}"
				:title="$t('kara.favorites.add')"
				@click="toggleFavorite"
			>
				<font-awesome-icon :icon="['fas', 'star']" :fixed-width="true" />
			</button>
			<div>
				<nuxt-link :to="`/kara/${slug}/${karaoke.kid}`" class="title is-3 is-spaced">
					{{ karaoke.title }}
				</nuxt-link>
				<kara-phrase :karaoke="karaoke" :i18n="i18n" tag="h5" class="subtitle is-56" />
			</div>
		</div>
		<div class="lebonflex">
			<div class="tags are-medium">
				<tag
					v-for="tag in tags"
					:key="`${karaoke.kid}-${tag.tag.tid}~${tagTypes[tag.type].type}`"
					:type="tag.type"
					:tag="tag.tag"
					:i18n="i18n"
					:staticheight="false"
					icon
				/>
			</div>
			<i18n v-if="karaoke.favorited" path="kara.stats.favorited" tag="div" class="box stats">
				<template #number>
					<span class="nb">{{ karaoke.favorited }}</span>
				</template>
			</i18n>
			<i18n v-if="karaoke.requested" path="kara.stats.requested" tag="div" class="box stats blue">
				<template #number>
					<span class="nb">{{ karaoke.requested }}</span>
				</template>
			</i18n>
			<i18n v-if="karaoke.played" path="kara.stats.played" tag="div" class="box stats blue">
				<template #number>
					<span class="nb">{{ karaoke.played }}</span>
				</template>
			</i18n>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import VLazyImage from 'v-lazy-image';
	import { fakeYearTag } from '~/utils/tools';
	import { tagTypes } from '~/assets/constants';
	import Tag from '~/components/Tag.vue';
	import KaraPhrase from '~/components/KaraPhrase.vue';
	import { DBKara } from '%/lib/types/database/kara';
	import { modalStore } from '~/store';
	import { TagExtend } from '~/store/menubar';

	interface VState {
		tagTypes: typeof tagTypes,
		activate: boolean,
		loading: boolean,
		favorite: boolean,
		favorites: boolean
	}

	export default Vue.extend({
		name: 'KaraCard',

		components: {
			Tag,
			VLazyImage,
			KaraPhrase
		},

		props: {
			karaoke: {
				type: Object,
				required: true
			} as PropOptions<DBKara>,
			i18n: {
				type: Object,
				required: true
			}
		},

		data(): VState {
			return {
				tagTypes,
				activate: false,
				loading: false,
				favorite: false,
				favorites: false
			};
		},

		computed: {
			images(): string[] {
				return this.karaoke.mediafile.endsWith('.mp3')
					? [`/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.25.jpg`]
					: [
						`/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.25.jpg`,
						`/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.33.jpg`
					];
			},
			slug(): string {
				return slug(this.karaoke.title);
			},
			tagTypesSorted(): object {
				const tagTypes = { ...this.tagTypes };
				delete tagTypes.years; // This is a decoy for fake years tag
				delete tagTypes.versions; // Versions are in KaraPhrase
				// Remove unused tagTypes in context
				for (const tagType in tagTypes) {
					// @ts-ignore
					if (this.karaoke[tagType].length === 0) {
						delete tagTypes[tagType];
					}
				}
				return tagTypes;
			},
			problematic(): boolean {
				// Loop all tags to find a tag with problematic
				let problematic = false;
				for (const tagType in tagTypes) {
					if (tagType === 'years') { continue; }
					// @ts-ignore: il est 23h27 <- ceci n'est pas une raison
					for (const tag of this.karaoke[tagType]) {
						if (tag?.problematic) {
							problematic = true;
						}
					}
				}
				return problematic;
			},
			tags(): TagExtend[] {
				const tags: TagExtend[] = [];
				for (const tagType in this.tagTypesSorted) {
					let i = 0;
					// @ts-ignore
					for (const tag of this.karaoke[tagType]) {
						// Removing all tags mentioned in the karaphrase
						if (!(
							// Remove the first series
							(tagType === 'series' && i === 0) ||
							// Remove the first songtype
							(tagType === 'songtypes' && i === 0) ||
							// Remove the first singer if the karaoke has no series
							(tagType === 'singers' && i === 0 && this.karaoke.series.length === 0) ||
							// Remove the next tags to avoid overflow
							(i > 1)
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
					tag: fakeYearTag(this.karaoke.year.toString())
				});
				return tags;
			}
		},

		created() {
			if (typeof this.karaoke.flag_favorites === 'boolean') { // If the tag is present, the user is logged in
				this.favorite = this.karaoke.flag_favorites;
				this.favorites = true;
			} else {
				this.favorites = false;
			}
		},

		methods: {
			switchImage() {
				this.activate = !this.activate;
			},
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
		}
	});
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

			img:last-child {
				display: none;
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

		img:last-child {
			position: absolute;
			left: 0;
			top: 0;
			opacity: 0;
			transition: opacity 0.25s linear;
		}

		img:last-child.activate {
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
