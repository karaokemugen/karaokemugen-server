<template>
	<div class="box">
		<div class="header">
			<nuxt-link :to="`/kara/${slug}/${karaoke.kid}`" class="images" @mouseenter="switchImage" @mouseleave="switchImage">
				<v-lazy-image :src="images[0]" alt="" />
				<v-lazy-image :src="images[1]" :class="{activate}" alt="" />
			</nuxt-link>
		</div>
		<div class="title-block">
			<nuxt-link :to="`/kara/${slug}/${karaoke.kid}`" class="title is-3 is-spaced">
				{{ karaoke.title }}
			</nuxt-link>
			<i18n path="kara.phrase" tag="h5" class="subtitle is-56">
				<template v-slot:songtype>
					<a
						:href="`/tags/${songtypeSlug}/${karaoke.songtypes[0].tid}~3`"
						@click.prevent="handleLink('songtypes')"
					>
						{{ songtype }}<template v-if="karaoke.songorder"> {{ karaoke.songorder }}</template>
					</a>
				</template>
				<template v-slot:series>
					<a
						:href="`/tags/${serieSinger.slug}/${serieSinger.tid}`"
						@click.prevent="handleLink('serieSinger')"
					>
						{{ serieSinger.name }}
					</a>
				</template>
			</i18n>
		</div>
		<button
			v-if="favorite && favorites"
			class="button is-normal is-warning is-fullwidth"
			:class="{'is-loading': loading}"
			@click="toggleFavorite"
		>
			<font-awesome-icon :icon="['fas', 'eraser']" :fixed-width="true" />
			{{ $t('kara.favorites.remove') }}
		</button>
		<button
			v-else-if="favorites"
			class="button is-normal is-warning is-fullwidth"
			:class="{'is-loading': loading}"
			@click="toggleFavorite"
		>
			<font-awesome-icon :icon="['fas', 'star']" :fixed-width="true" />
			{{ $t('kara.favorites.add') }}
		</button>
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
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import VLazyImage from 'v-lazy-image';
	import languages from '@cospired/i18n-iso-languages';
	import { fakeYearTag, getSerieLanguage } from '~/utils/tools';
	import { tagTypes } from '~/assets/constants';
	import Tag from '~/components/Tag.vue';
	import { DBKara, DBKaraTag } from '%/lib/types/database/kara';
	import { serieSinger } from '~/types/serieSinger';
	import { menuBarStore, modalStore } from '~/store';
	import { TagExtend } from '~/store/menubar';

	interface VState {
		tagTypes: typeof tagTypes,
		activate: boolean,
		loading: boolean,
		favorite: boolean
	}

	export default Vue.extend({
		name: 'KaraCard',

		components: {
			Tag,
			VLazyImage
		},

		props: {
			karaoke: {
				type: Object,
				required: true
			} as PropOptions<DBKara>,
			i18n: {
				type: Object,
				required: true
			},
			favorites: {
				type: Boolean,
				default: false
			}
		},

		data(): VState {
			return {
				tagTypes,
				activate: false,
				loading: false,
				favorite: true
			};
		},

		computed: {
			images(): string[] {
				return [
					`/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.25.jpg`,
					`/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.33.jpg`,
					`/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.50.jpg`
				];
			},
			serieSinger(): serieSinger {
				if (this.karaoke.series[0]) {
					return {
						name: getSerieLanguage(this.karaoke.series[0], this.karaoke.langs[0].name, this.$store.state.auth.user, this.i18n),
						tid: `${this.karaoke.series[0].tid}~${tagTypes.series.type}`,
						slug: slug(this.karaoke.series[0].name),
						type: 'series'
					};
				} else if (this.karaoke.singers[0]) {
					return {
						name: this.i18n[this.karaoke.singers[0].tid]
							? this.i18n[this.karaoke.singers[0].tid][languages.alpha2ToAlpha3B(this.$i18n.locale)] ||
							this.i18n[this.karaoke.singers[0].tid]?.eng ||
								this.karaoke.singers[0].name : this.karaoke.singers[0].name,
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
				return this.i18n[this.karaoke.songtypes[0].tid]
					? this.i18n[this.karaoke.songtypes[0].tid][languages.alpha2ToAlpha3B(this.$i18n.locale)] ||
					this.i18n[this.karaoke.songtypes[0].tid]?.eng ||
						this.karaoke.songtypes[0].name : this.karaoke.songtypes[0].name;
			},
			songtypeSlug(): string {
				return slug(this.karaoke.songtypes[0].name);
			},
			slug(): string {
				return slug(this.karaoke.title);
			},
			tagTypesSorted(): object {
				const tagTypes = { ...this.tagTypes };
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

		watch: {
			favorites(now) {
				this.favorite = now;
			}
		},

		created() {
			if (this.favorites) {
				this.favorite = true;
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
			},
			handleLink(type: 'serieSinger' | 'songtypes') {
				let tag: DBKaraTag;
				switch (type) {
				case 'serieSinger':
					tag = { ...this.karaoke[this.serieSinger.type][0] };
					tag.i18n = this.i18n[tag.tid];
					menuBarStore.addTag({
						type: this.serieSinger.type,
						tag
					});
					break;
				case 'songtypes':
					tag = { ...this.karaoke.songtypes[0] };
					tag.i18n = this.i18n[tag.tid];
					menuBarStore.addTag({
						type: 'songtypes',
						tag
					});
					break;
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
			opacity: 0;
			transition: opacity 0.25s linear;
		}

		img:last-child.activate {
			opacity: 1;
		}
	}

	.tags {
		margin-top: 0.5rem;
		display: unset;

		.tag *:first-child {
			margin-right: 0.25rem;
		}
	}
</style>
