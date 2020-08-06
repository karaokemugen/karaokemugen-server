<template>
	<kara-list :karaokes="karaokes" :loading="loading" />
</template>

<script lang="ts">
	import Vue from 'vue';
	import merge from 'lodash.merge';

	import KaraList from '~/components/KaraList.vue';
	import { menuBarStore } from '~/store';
	import { KaraList as KaraListType } from '%/lib/types/kara';

	interface VState {
		karaokes: KaraListType,
		from: number,
		loading: boolean
		sort: string
		VuexUnsubscribe?: Function
	}

	export default Vue.extend({
		name: 'KaraSearch',

		components: {
			KaraList
		},

		async asyncData({ params, $axios, error, app }) {
			const res = await $axios.get('/api/karas/search', {
				params: {
					filter: `${typeof params.query === 'string' ? params.query : ''}`,
					from: 0,
					size: 20
				}
			}).catch(
				_err => error({ statusCode: 404, message: app.i18n.t('error.generic') as string }));
			if (res) {
				return { karaokes: res.data };
			} else {
				error({ statusCode: 500, message: app.i18n.t('error.generic') as string });
			}
		},

		data(): VState {
			return {
				karaokes: { infos: { count: 0, from: 0, to: 0 }, i18n: {}, content: [] },
				from: 0,
				loading: false,
				sort: menuBarStore.sort || 'az'
			};
		},

		watch: {
			loading(now, _old) {
				if (now) { this.$nuxt.$loading.start(); } else { this.$nuxt.$loading.finish(); }
			}
		},

		activated() {
			window.addEventListener('scroll', this.scrollEvent, { passive: true });
			menuBarStore.setSearch(this.$route.params.query);
			if (menuBarStore.sort === 'karacount') {
				this.sort = 'az';
				menuBarStore.setSort('az');
			}
			this.VuexUnsubscribe = this.$store.subscribe((mutation, _payload) => {
				if (mutation.type === 'menubar/setSort') {
					this.sort = mutation.payload;
					this.karaokes = { infos: { count: -1, from: 0, to: 0 }, i18n: {}, content: [] };
					this.from = -1;
					this.$nextTick(() => { this.loadNextPage(); });
				} else if (mutation.type === 'menubar/setSearch') {
					if (mutation.payload !== this.$route.params.query) {
						this.$router.push(`/search/${mutation.payload}`);
					}
				}
			});
		},

		deactivated() {
			// menuBarStore.setSearch(undefined);
			window.removeEventListener('scroll', this.scrollEvent);
			if (this.VuexUnsubscribe) { this.VuexUnsubscribe(); }
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
