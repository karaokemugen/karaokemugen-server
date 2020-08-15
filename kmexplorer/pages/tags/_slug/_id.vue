<template>
	<kara-list :karaokes="karaokes" :loading="loading || $fetchState.pending" />
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import merge from 'lodash.merge';

	import KaraList from '~/components/KaraList.vue';
	import { menuBarStore } from '~/store';
	import { tagRegex, tagTypesMap } from '~/assets/constants';
	import { KaraList as KaraListType } from '%/lib/types/kara';
	import { Tag } from '%/lib/types/tag';

	interface VState {
		karaokes: KaraListType,
		from: number,
		loading: boolean,
		tag: Tag
	}

	export default Vue.extend({
		name: 'KaraListTag',

		components: {
			KaraList
		},

		async fetch() {
			const tagInfo = tagRegex.exec(this.$route.params.id);
			if (!tagInfo) { throw new Error('Stealth check failed: Tag regex not matched'); }
			const res = this.$axios.get<Tag>(`/api/tags/${tagInfo[1]}`).catch(
				_err => this.$nuxt.error({ statusCode: 404, message: this.$t('tag.notfound') as string }));

			const res2 = this.$axios.get<KaraListType>('/api/karas/search', {
				params: {
					q: `t:${this.$route.params.id}`,
					from: 0,
					size: 20,
					filter: this.search || undefined
				}
			}).catch(
				_err => this.$nuxt.error({ statusCode: 404, message: this.$t('error.generic') as string }));
			const all = await Promise.all([res, res2]);
			if (all[0] && all[1]) {
				this.karaokes = all[1].data;
				this.tag = all[0].data;
			} else {
				this.$nuxt.error({ statusCode: 500, message: 'Huh?' });
			}
		},

		data(): VState {
			return {
				karaokes: { infos: { count: 0, from: 0, to: 0 }, i18n: {}, content: [] },
				from: 0,
				loading: false,
				tag: {
					name: '',
					tid: '',
					types: []
				}
			};
		},

		computed: {
			...mapState('menubar', ['search', 'sort'])
		},

		validate({ params }) {
			return tagRegex.test(params?.id);
		},

		watch: {
			loading (now, _old) {
				if (now) { this.$nuxt.$loading.start(); } else { this.$nuxt.$loading.finish(); }
			},
			sort(_now, _old) {
				this.karaokes = { infos: { count: -1, from: 0, to: 0 }, i18n: {}, content: [] };
				this.from = -1;
				this.$nextTick(() => { this.loadNextPage(); });
			},
			search(_now, _old) {
				this.karaokes = { infos: { count: -1, from: 0, to: 0 }, i18n: {}, content: [] };
				this.from = -1;
				this.$nextTick(() => { this.loadNextPage(); });
			},
			tag(now) {
				const tagInfo = tagRegex.exec(this.$route.params.id);
				if (!tagInfo) { throw new Error('Stealth check failed: Tag regex not matched'); }
				menuBarStore.setTag({
					type: tagTypesMap[tagInfo[2] as unknown as number].name,
					tag: now
				});
			}
		},

		mounted() {
			if (this.sort === 'karacount') {
				menuBarStore.setSort('az');
			}
			window.addEventListener('scroll', this.scrollEvent, { passive: true });
		},

		destroyed() {
			menuBarStore.setTag(null);
			window.removeEventListener('scroll', this.scrollEvent);
		},

		methods: {
			async loadNextPage() {
				if (this.karaokes.infos.to === this.karaokes.infos.count || this.loading) { return; }
				this.from++;
				this.loading = true;
				const { data } = await this.$axios.get('/api/karas/search', {
					params: {
						q: `t:${this.$route.params.id}`,
						from: (this.from * 20),
						size: 20,
						filter: this.search || undefined
					}
				});
				this.karaokes.content.push(...data.content);
				this.karaokes.i18n = merge(this.karaokes.i18n, data.i18n);
				this.karaokes.infos.to = data.infos.to;
				this.loading = false;
			},
			scrollEvent() {
				const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight > document.documentElement.offsetHeight - 400;

				if (bottomOfWindow) {
					this.loadNextPage();
				}
			}
		},

		transition: 'fade'
	});
</script>
