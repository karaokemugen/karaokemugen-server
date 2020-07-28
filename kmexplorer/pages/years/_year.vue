<template>
	<kara-list :karaokes="karaokes" :loading="loading" />
</template>

<script lang="ts">
	import Vue from 'vue';
	import merge from 'lodash.merge';
	import KaraList from '~/components/KaraList.vue';
	import { KaraList as KaraListType } from '%/lib/types/kara';

	interface VState {
		karaokes: KaraListType,
		from: number,
		loading: boolean
	}

	export default Vue.extend({
		name: 'YearVue',

		components: {
			KaraList
		},

		async asyncData({ params, $axios, error, app }) {
			const res = await $axios.get('/api/karas/search', {
				params: {
					q: `y:${params.year}`,
					from: 0,
					size: 20
				}
			}).catch(
				_err => error({ statusCode: 404, message: app.i18n.t('error.generic') as string }));
			if (res) { return { karaokes: res.data }; } else { error({ statusCode: 500, message: 'Huh?' }); }
		},

		data(): VState {
			return {
				karaokes: { infos: { count: 0, from: 0, to: 0 }, i18n: {}, content: [] },
				from: 0,
				loading: false
			};
		},

		validate({ params }) {
			return !isNaN(parseInt(params.year));
		},

		watch: {
			loading(now, _old) {
				if (now) { this.$nuxt.$loading.start(); } else { this.$nuxt.$loading.finish(); }
			}
		},

		mounted() {
			window.addEventListener('scroll', this.scrollEvent, { passive: true });
		},

		destroyed() {
			window.removeEventListener('scroll', this.scrollEvent);
		},

		methods: {
			async loadNextPage() {
				if (this.karaokes.infos.to === this.karaokes.infos.count || this.loading) { return; }
				this.from++;
				this.loading = true;
				const { data } = await this.$axios.get('/api/karas/search', {
					params: {
						q: `y:${this.$route.params.year}`,
						from: (this.from * 20),
						size: ((this.from + 1) * 20)
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

<style scoped>

</style>
