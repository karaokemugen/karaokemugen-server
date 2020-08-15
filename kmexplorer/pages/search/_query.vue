<template>
	<kara-list :karaokes="karaokes" :loading="loading || $fetchState.pending" />
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import merge from 'lodash.merge';

	import KaraList from '~/components/KaraList.vue';
	import { menuBarStore } from '~/store';
	import { KaraList as KaraListType } from '%/lib/types/kara';

	interface VState {
		karaokes: KaraListType,
		from: number,
		loading: boolean
	}

	export default Vue.extend({
		name: 'KaraSearch',

		components: {
			KaraList
		},

		async fetch() {
			const res = await this.$axios.get<KaraListType>('/api/karas/search', {
				params: {
					filter: `${typeof this.$route.params.query === 'string' ? this.$route.params.query : ''}`,
					from: 0,
					size: 20,
					order: this.sort
				}
			}).catch(
				_err => this.$nuxt.error({ statusCode: 404, message: this.$t('error.generic') as string }));
			if (res) {
				this.karaokes = res.data;
			} else {
				this.$nuxt.error({ statusCode: 500, message: this.$t('error.generic') as string });
			}
		},

		data(): VState {
			return {
				karaokes: { infos: { count: 0, from: 0, to: 0 }, i18n: {}, content: [] },
				from: 0,
				loading: false
			};
		},

		computed: {
			...mapState('menubar', ['sort', 'search'])
		},

		watch: {
			loading(now) {
				if (now) { this.$nuxt.$loading.start(); } else { this.$nuxt.$loading.finish(); }
			},
			sort() {
				this.from = 0;
				this.$fetch();
			},
			search(now) {
				if (typeof now === 'string' && now.length > 0) {
					this.$router.push(`/search/${now}`);
				} else {
					this.$router.push('/search/');
				}
			}
		},

		activated() {
			window.addEventListener('scroll', this.scrollEvent, { passive: true });
			menuBarStore.setSearch(this.$route.params.query);
			if (menuBarStore.sort === 'karacount') {
				menuBarStore.setSort('az');
			}
		},

		deactivated() {
			window.removeEventListener('scroll', this.scrollEvent);
		},

		methods: {
			async loadNextPage() {
				if (this.karaokes.infos.to === this.karaokes.infos.count || this.loading) { return; }
				this.from++;
				this.loading = true;
				const { data } = await this.$axios.get('/api/karas/search', {
					params: {
						filter: `${typeof this.$route.params.query === 'string' ? this.$route.params.query : ''}`,
						from: (this.from * 20),
						size: 20,
						order: this.sort
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
