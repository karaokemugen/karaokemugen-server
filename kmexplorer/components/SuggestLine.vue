<template>
	<div class="tile is-parent">
		<div class="tile is-child">
			<div class="box">
				<h4 class="title is-4 centered with-img">
					<picture>
						<source type="image/webp" :srcset="require('~/assets/nanami-surpris.webp')">
						<source type="image/png" :srcset="require('~/assets/nanami-surpris.png')">
						<img :src="require('~/assets/nanami-surpris.png')" alt="Surprised Nanami">
					</picture>
					<span>{{ $t(empty ? 'layout.empty':'layout.suggest') }}&nbsp;</span>
					<nuxt-link to="/suggest">{{ $t('layout.suggest_open') }}</nuxt-link>
				</h4>
				<h4 v-if="tags.length > 0" class="title is-4 centered">
					{{ $t('layout.remove_tags') }}
				</h4>
				<search-tags class="tagList" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import SearchTags from './SearchTags.vue';

	export default Vue.extend({
		name: 'SuggestLine',

		components: {
			SearchTags
		},

		props: {
			empty: {
				type: Boolean,
				default: false
			}
		},

		computed: mapState('menubar', ['tags'])
	});
</script>

<style scoped lang="scss">
	.title.is-4.centered {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: .5em;
		text-align: center;
		@media screen and (max-width: 1024px) {
			flex-direction: column;
		}
		&.with-img {
			img {
				height: 2.5em;
			}
		}
		&:last-child {
			margin-bottom: 0;
		}
	}

	.tagList {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
