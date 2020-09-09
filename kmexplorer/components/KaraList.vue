<template>
	<div>
		<div v-for="n in Math.ceil(karaokes.infos.to / 3)" :key="n" class="tile is-parent is-12">
			<div v-for="n2 in 3" :key="`${n}_${n2}`" class="tile is-child is-4">
				<kara-card
					v-if="karaokes.content[(n-1)*3+n2-1]"
					:karaoke="karaokes.content[(n-1)*3+n2-1]"
					:i18n="karaokes.i18n"
				/>
			</div>
		</div>
		<loading-nanami v-if="loading" class="tile is-parent is-12" />
		<kara-suggest v-if="fullyLoaded && !loading && !favorites" class="tile is-parent is-12" />
		<div v-else-if="fullyLoaded && !loading && favorites" class="tile is-parent">
			<div class="tile is-child">
				<div class="box">
					<h4 class="title is-4 with-img">
						<img :src="require('~/assets/nanami-surpris.png')" alt="Nanamin surprised">
						{{ $t('layout.empty') }}&nbsp;
						<nuxt-link to="/search/">
							{{ $t('layout.explore') }}
						</nuxt-link>
					</h4>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import LoadingNanami from './LoadingNanami.vue';
	import KaraCard from './KaraCard.vue';
	import KaraSuggest from './KaraSuggest.vue';
	import { KaraList } from '%/lib/types/kara';

	export default Vue.extend({
		name: 'KaraList',

		components: {
			LoadingNanami,
			KaraCard,
			KaraSuggest
		},

		props: {
			karaokes: {
				type: Object,
				required: true
			} as PropOptions<KaraList>,
			loading: {
				type: Boolean,
				required: true
			}
		},

		computed: {
			fullyLoaded(): boolean {
				return this.karaokes.infos.to === this.karaokes.infos.count;
			}
		}
	});
</script>

<style lang="scss" scoped>
	.tile.is-parent.is-12 {
		padding: 0.25rem;
	}
	.tile.is-child.is-4 {
		padding: 0 0.25rem;
	}
	@media (max-width: 769px) {
		.tile.is-child.is-4 {
			padding: 1em 1em;
		}
		.tile.is-parent.is-12 {
			padding: 0;
		}
	}
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
