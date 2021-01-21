<template>
	<i18n path="kara.phrase" :tag="tag">
		<template #songtype>
			<a
				:href="`./tags/${songtype.slug}/${songtype.tag.tid}~3`"
				@click.prevent="handleLink(songtype)"
			>
				{{ songtype.name }}<template v-if="karaoke.songorder">&nbsp;{{ karaoke.songorder }}</template>
			</a>
			<span v-if="versions.length > 0">
				(<template v-for="(version, index) in versions"><a
					:key="version.tag.tid"
					:href="`./tags/${version.slug}/${version.tag.tid}~14`"
					@click.prevent="handleLink(version)"
				>{{ version.name }}</a><template v-if="index+1 < versions.length">, </template></template>)
			</span>
		</template>
		<template #series>
			<a
				:href="`./tags/${serieSinger.slug}/${serieSinger.tag.tid}~${serieSinger.type === 'series' ? '1':'2'}`"
				@click.prevent="handleLink(serieSinger)"
			>
				{{ serieSinger.name }}
			</a>
		</template>
	</i18n>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import languages from '@cospired/i18n-iso-languages';
	import { ShortTag } from '~/types/tags';
	import { generateNavigation, getSerieLanguage, getTagInLanguage } from '~/utils/tools';
	import { DBKara } from '%/lib/types/database/kara';
	import { menuBarStore } from '~/store';

	export default Vue.extend({
		name: 'KaraPhrase',

		props: {
			tag: {
				type: String,
				required: true
			},
			karaoke: {
				type: Object,
				required: true
			} as PropOptions<DBKara>,
			i18n: {
				type: Object,
				default: undefined
			}
		},

		computed: {
			serieSinger(): ShortTag {
				if (this.karaoke.series[0]) {
					return {
						name: getSerieLanguage(this.karaoke.series[0], this.karaoke.langs[0].name, this.$store.state.auth.user, this.i18n),
						slug: slug(this.karaoke.series[0].name),
						type: 'series',
						tag: this.karaoke.series[0]
					};
				} else if (this.karaoke.singers[0]) {
					return {
						name: getTagInLanguage(this.karaoke.singers[0], languages.alpha2ToAlpha3B(this.$i18n.locale), 'eng', this.i18n),
						slug: slug(this.karaoke.singers[0].name),
						type: 'singers',
						tag: this.karaoke.singers[0]
					};
				} else { // You never know~
					throw new TypeError('The karaoke does not have any series nor singers, wtf?');
				}
			},
			songtype(): ShortTag {
				return {
					slug: slug(this.karaoke.songtypes[0].name),
					name: getTagInLanguage(this.karaoke.songtypes[0], languages.alpha2ToAlpha3B(this.$i18n.locale), 'eng', this.i18n),
					type: 'songtypes',
					tag: this.karaoke.songtypes[0]
				};
			},
			versions(): ShortTag[] {
				const tab = [];
				for (const version of this.karaoke.versions) {
					tab.push({
						name: getTagInLanguage(version, languages.alpha2ToAlpha3B(this.$i18n.locale), 'eng', this.i18n),
						slug: slug(version.name),
						type: 'versions',
						tag: version
					});
				}
				return tab;
			}
		},

		methods: {
			handleLink(tag: ShortTag) {
				menuBarStore.addTag({
					type: tag.type,
					tag: tag.tag
				});
				this.$router.push(generateNavigation(menuBarStore));
			}
		}
	});
</script>
