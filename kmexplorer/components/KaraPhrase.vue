<template>
	<i18n path="kara.phrase" :tag="tag">
		<template #songtype>
			<a
				:href="`/tags/${songtype.slug}/${songtype.tid}~3`"
				@click.prevent="handleLink('songtypes')"
			>
				{{ songtype.name }}<template v-if="karaoke.songorder">&nbsp;{{ karaoke.songorder }}</template>
			</a>
			<span v-if="versions.length > 0">
				(<a
					v-for="(version, index) in versions"
					:key="version.tid"
					:href="`/tags/${version.slug}/${songtype.tid}~14`"
				>{{ version.name }}<span v-if="index+1 < versions.length">, </span></a>)
			</span>
		</template>
		<template #series>
			<a
				:href="`/tags/${serieSinger.slug}/${serieSinger.tid}`"
				@click.prevent="handleLink('serieSinger')"
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
	import { serieSinger, ShortTag } from '~/types/serieSinger';
	import { generateNavigation, getSerieLanguage, getTagInLanguage } from '~/utils/tools';
	import { tagTypes } from '~/assets/constants';
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
						name: getTagInLanguage(this.karaoke.singers[0], languages.alpha2ToAlpha3B(this.$i18n.locale), 'eng', this.i18n),
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
			songtype(): ShortTag {
				return {
					tid: this.karaoke.songtypes[0].tid,
					slug: slug(this.karaoke.songtypes[0].name),
					name: getTagInLanguage(this.karaoke.songtypes[0], languages.alpha2ToAlpha3B(this.$i18n.locale), 'eng', this.i18n)
				};
			},
			versions(): ShortTag[] {
				const tab = [];
				for (const version of this.karaoke.versions) {
					tab.push({
						tid: version.tid,
						slug: slug(version.name),
						name: getTagInLanguage(version, languages.alpha2ToAlpha3B(this.$i18n.locale), 'eng', this.i18n)
					});
				}
				return tab;
			}
		},

		methods: {
			handleLink(type: 'serieSinger' | 'songtypes') {
				let tag;
				switch (type) {
				case 'serieSinger':
					tag = { ...this.karaoke[this.serieSinger.type][0] };
					if (this.i18n) { tag.i18n = this.i18n[tag.tid]; }
					menuBarStore.addTag({
						type: this.serieSinger.type,
						tag
					});
					break;
				case 'songtypes':
					tag = { ...this.karaoke.songtypes[0] };
					if (this.i18n) { tag.i18n = this.i18n[tag.tid]; }
					menuBarStore.addTag({
						type,
						tag
					});
					break;
				}
				this.$router.push(generateNavigation(menuBarStore));
			}
		}
	});
</script>
