<template>
	<kara-list :karaokes="karaokes" :loading="loading"></kara-list>
</template>

<script lang="ts">
	import Vue from 'vue';
	import merge from "lodash.merge";
	import KaraList from "~/components/KaraList.vue";

    export default Vue.extend({
        name: "YearVue",

		components: {
			KaraList
		},

		data() {
			return {
				karaokes: {infos: {count:0, from: 0, to: 0}, i18n: {}, content: []},
				from: 0,
				loading: false
			}
		},

		validate({ params }) {
			return parseInt(params.year);
		},

		methods: {
			async loadNextPage() {
				if (this.karaokes.infos.to === this.karaokes.infos.count || this.loading) return;
				this.from++;
				this.loading = true;
				const {data} = await this.$axios.get(`/api/karas/search`, {
					params: {
						q: `y:${this.$route.params.year}`,
						from: (this.from * 20),
						size: ((this.from+1) * 20)
					}
				});
				this.karaokes.content.push(...data.content);
				this.karaokes.i18n = merge(this.karaokes.i18n, data.i18n);
				this.karaokes.infos.to = data.infos.to;
				this.loading = false;
			},
			scrollEvent() {
				let bottomOfWindow = document.documentElement.scrollTop + window.innerHeight > document.documentElement.offsetHeight - 400;

				if (bottomOfWindow) {
					this.loadNextPage();
				}
			}
		},

		async asyncData({ params, $axios, error, app }) {

			const { data } = await $axios.get(`/api/karas/search`, {
				params: {
					q: `y:${params.year}`,
					from: 0,
					size: 20
				}
			}).catch(
				_err => error({ statusCode: 404, message: app.i18n.t('error.generic') }));
			return { karaokes: data };
		},

		transition: 'fade',

		mounted() {
			window.addEventListener('scroll', this.scrollEvent);
		},

		destroyed() {
			window.removeEventListener('scroll', this.scrollEvent);
		},

		watch: {
			loading(now, _old) {
				if (now) this.$nuxt.$loading.start();
				else this.$nuxt.$loading.finish();
			}
		}
    });
</script>

<style scoped>

</style>
