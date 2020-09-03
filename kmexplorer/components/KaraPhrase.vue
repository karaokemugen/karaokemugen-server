<template>
	<i18n path="kara.phrase" :tag="tag">
		<template v-slot:songtype>
			<a
				:href="`/tags/${songtype.slug}/${songtype.tid}~3`"
				@click.prevent="handleLink('songtypes')"
			>
				{{ songtype.name }}<template v-if="karaoke.songorder">&nbsp;{{ karaoke.songorder }}</template>
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
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import languages from '@cospired/i18n-iso-languages';
	import { serieSinger, ShortTag } from '~/types/serieSinger';
	import { generateNavigation, getSerieLanguage } from '~/utils/tools';
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
			songtype(): ShortTag {
				const stag: ShortTag = {
					tid: this.karaoke.songtypes[0].tid,
					slug: slug(this.karaoke.songtypes[0].name),
					name: ''
				};
				if (this.i18n) {
					stag.name = this.i18n[this.karaoke.songtypes[0].tid]
						? this.i18n[this.karaoke.songtypes[0].tid][languages.alpha2ToAlpha3B(this.$i18n.locale)] ||
						this.i18n[this.karaoke.songtypes[0].tid]?.eng ||
							this.karaoke.songtypes[0].name : this.karaoke.songtypes[0].name;
				} else {
					stag.name = this.karaoke.songtypes[0].i18n[languages.alpha2ToAlpha3B(this.$i18n.locale)] || this.karaoke.songtypes[0].i18n.eng || this.karaoke.songtypes[0].name;
				}
				return stag;
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
