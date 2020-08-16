<template>
	<kara-list :karaokes="karaokes" :loading="loading || $fetchState.pending" />
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import { mapState } from 'vuex';
	import merge from 'lodash.merge';

	import KaraList from '~/components/KaraList.vue';
	import { KaraList as KaraListType } from '%/lib/types/kara';
	import { menuBarStore } from '~/store';
	import { tagTypes } from '~/assets/constants';
	import { TagExtend } from '~/store/menubar';

	interface KaraRequest {
		from: number,
		size: number,
		order?: string,
		filter?: string,
		q?: string
	}

	interface VState {
		loading: boolean,
		karaokes: KaraListType
		from: number
	}

	export default Vue.extend({
		name: 'KaraQuery',

		components: {
			KaraList
		},

		props: {
			year: {
				type: Number,
				required: false,
				default: -1
			},
			// eslint-disable-next-line vue/require-default-prop
			tag: {
				type: Object,
				required: false
			} as PropOptions<TagExtend>
		},

		async fetch() {
			await this.loadNextPage(true);
		},

		data(): VState {
			return {
				loading: false,
				karaokes: { infos: { count: 0, from: 0, to: 0 }, i18n: {}, content: [] },
				from: -1
			};
		},

		computed: {
			reqParams(): KaraRequest {
				const queries: string[] = [];
				const tags: string[] = [];
				if (this.tag) {
					queries.push(`t:${this.tag.tag.tid}~${tagTypes[this.tag.type].type}`);
				} else if (this.tags.length > 0) {
					for (const tag of this.tags) {
						tags.push(`${tag.tag.tid}~${tagTypes[tag.type].type}`);
					}
					queries.push(`t:${tags.join(',')}`);
				}
				if (this.year !== -1) {
					queries.push(`y:${this.year}`);
				}
				return {
					q: queries.join('!'),
					filter: this.search,
					from: (this.from * 20),
					size: 20,
					order: this.sort
				};
			},
			...mapState('menubar', ['sort', 'search', 'tags'])
		},

		watch: {
			sort() { this.resetList(); },
			search() { this.resetList(); },
			tags() { this.resetList(); },
			year() { this.resetList(); },
			karaokes(now) {
				menuBarStore.setResultsCount(now.infos.count);
			},
			loading(now) {
				if (now) { this.$nuxt.$loading.start(); } else { this.$nuxt.$loading.finish(); }
			}
		},

		created() {
			if (menuBarStore.sort === 'karacount') {
				menuBarStore.setSort('az');
			}
		},

		mounted() {
			window.addEventListener('scroll', this.scrollEvent, { passive: true });
		},

		destroyed() {
			window.removeEventListener('scroll', this.scrollEvent);
		},

		methods: {
			async loadNextPage(force: boolean = false) {
				if (!force && (this.karaokes.infos.to === this.karaokes.infos.count || this.loading)) { return; }
				this.from++;
				this.loading = true;
				const { data } = await this.$axios.get<KaraListType>('/api/karas/search', {
					params: this.reqParams
				});
				this.karaokes.content.push(...data.content);
				this.karaokes.i18n = merge(this.karaokes.i18n, data.i18n);
				this.karaokes.infos.count = data.infos.count;
				this.karaokes.infos.to = data.infos.to;
				this.loading = false;
			},
			scrollEvent() {
				const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight > document.documentElement.offsetHeight - 400;

				if (bottomOfWindow) {
					this.loadNextPage();
				}
			},
			resetList() {
				this.karaokes = { infos: { count: 0, to: 0, from: 0 }, i18n: {}, content: [] };
				this.from = -1;
				this.loadNextPage(true);
				const navigation = { path: `/search/${menuBarStore.search}`, query: { tags: '' } };
				// TODO: Fully-featured shareable URL
				for (const tag of menuBarStore.tags) {
					navigation.query.tags += `${tag.tag.tid}~${tagTypes[tag.type].type},`;
				}
				this.$router.replace(navigation);
			}
		}
	});
</script>
