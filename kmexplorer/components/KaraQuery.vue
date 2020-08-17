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
	import { tagRegex, tagTypes, tagTypesMap } from '~/assets/constants';
	import { TagExtend } from '~/store/menubar';
	import { DBTag } from '%/lib/types/database/tag';

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
			if (process.server) {
				if (typeof this.$route.query.q === 'string') {
					const criterias = this.$route.query.q.split('!');
					for (const c of criterias) {
						// Splitting only after the first ":" and removing potentially harmful stuff
						const type = c.split(/:(.+)/)[0];
						let values = c.replace(/'/, '\'');
						values = values.split(/:(.+)/)[1];
						// Validating values
						// Technically searching tags called null or undefined is possible. You never know. Repositories or years however, shouldn't be.
						if (type === 't') {
							const tags = values.split(',');
							if (tags.some((v: string) => !tagRegex.test(v))) { throw new Error(`Incorrect tag ${tags.toString()}`); }
							const tagExtends: TagExtend[] = [];
							for (const tag of tags) {
								const parsedTag = tagRegex.exec(tag);
								if (!parsedTag) { throw new Error('Mais merde à la fin !'); }
								const res = await this.$axios.get<DBTag>(`/api/tags/${parsedTag[1]}`);
								const payload = {
									type: tagTypesMap[parseInt(parsedTag[2])].name as string,
									tag: res.data
								};
								tagExtends.push(payload);
							}
							menuBarStore.setTags(tagExtends);
						} // else if (type === 'y');
					}
				}
				await this.loadNextPage(true);
			} else {
				await this.loadNextPage(true);
			}
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
			search() { this.resetList(true); },
			tags() { this.resetList(true); },
			year() { this.resetList(); },
			loading(now) {
				if (now) { this.$nuxt.$loading.start(); } else { this.$nuxt.$loading.finish(); }
			}
		},

		created() {
			if (menuBarStore.sort === 'karacount') {
				menuBarStore.setSort('recent');
			}
		},

		mounted() {
			window.addEventListener('scroll', this.scrollEvent, { passive: true });
			if (this.tag) {
				menuBarStore.addTag(this.tag);
			}
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
				menuBarStore.setResultsCount(data.infos.count);
				this.karaokes.infos.to = data.infos.to;
				this.loading = false;
			},
			scrollEvent() {
				const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight > document.documentElement.offsetHeight - 400;

				if (bottomOfWindow) {
					this.loadNextPage();
				}
			},
			resetList(navigation = false) {
				this.karaokes = { infos: { count: 0, to: 0, from: 0 }, i18n: {}, content: [] };
				menuBarStore.setResultsCount(0);
				this.from = -1;
				this.loadNextPage(true);
				if (navigation && this.$route.name === 'search-query') {
					const navigation = { path: `/search/${menuBarStore.search}`, query: { q: this.reqParams.q } };
					// TODO: Fully-featured shareable URL
					this.$router.replace(navigation);
				}
			}
		}
	});
</script>
