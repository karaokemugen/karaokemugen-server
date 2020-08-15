<template>
	<kara-list :karaokes="karaokes" :loading="loading || $fetchState.pending" favorites v-if="karaokes.infos.count > 0" />
	<div v-else class="tile is-parent">
		<div class="tile is-child">
			<div class="box">
				<h4 class="title is-4 with-img">
					<img :src="require('~/assets/nanami-surpris.png')" alt="Nanamin surprised">
					{{ $t('layout.empty') }}&nbsp;
					<nuxt-link to="/search/">{{ $t('layout.explore') }}</nuxt-link>
				</h4>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import merge from 'lodash.merge';

	import KaraList from '~/components/KaraList.vue';
	import { KaraList as KaraListType } from '%/lib/types/kara';

	interface VState {
		karaokes: KaraListType,
		from: number,
		loading: boolean
	}

	export default Vue.extend({
		name: 'KaraListFavorites',

		components: {
			KaraList
		},

		middleware: 'auth',

		async fetch() {
			const res = await this.$axios.get<KaraListType>('/api/favorites/full', {
				params: {
					from: 0,
					size: 20,
					filter: this.search || undefined
				}
			}).catch(
				_err => this.$nuxt.error({ statusCode: 404, message: this.$t('error.generic') as string }));
			if (res) {
				this.karaokes = res.data;
			} else {
				this.$nuxt.error({ statusCode: 500, message: 'Huh?' });
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
			...mapState('menubar', ['search'])
		},

		watch: {
			loading (now, _old) {
				if (now) { this.$nuxt.$loading.start(); } else { this.$nuxt.$loading.finish(); }
			},
			search() {
				this.karaokes = { infos: { count: -1, from: 0, to: 0 }, i18n: {}, content: [] };
				this.from = -1;
				this.$nextTick(() => { this.loadNextPage(); });
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
				const { data } = await this.$axios.get<KaraListType>('/api/favorites/full', {
					params: {
						from: 0,
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

<style scoped lang="scss">
	.title.is-4.with-img {
		display: flex;
		align-items: center;
		justify-content: center;
		img {
			height: 2.5em;
		}
		margin-bottom: 0;
	}
</style>
