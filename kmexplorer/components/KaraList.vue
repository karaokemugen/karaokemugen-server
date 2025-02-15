<template>
	<div
		v-for="n in karaokes.infos.to"
		:key="n"
		class="cell is-4"
	>
		<kara-card
			v-if="karaokes.content[n]"
			:karaoke="karaokes.content[n]"
			:playlists="playlists"
			:karaokes-i18n="karaokes.i18n"
			@update-playlist="() => emit('update-playlist')"
		/>
	</div>
	<loading-nanami
		v-if="loading"
		class="cell is-12"
	/>
	<suggest-line
		v-if="fullyLoaded && !loading && !favorites && withSuggest"
		class="cell is-12"
		:empty="karaokes.content.length === 0"
	/>
	<div
		v-else-if="fullyLoaded && !loading && myFavorites"
		class="cell"
	>
		<div class="box">
			<h4 class="title is-4 with-img">
				<img
					src="~/assets/nanami-surpris.png"
					alt="Nanamin surprised"
				>
				<span>{{ $t('layout.end_my_favorites') }}&nbsp;</span>
				<nuxt-link to="/search/">
					{{ $t('layout.explore') }}
				</nuxt-link>
			</h4>
		</div>
	</div>
	<div
		v-else-if="fullyLoaded && !loading && favorites"
		class="cell"
	>
		<div class="box">
			<h4 class="title is-4 with-img">
				<img
					src="~/assets/nanami-surpris.png"
					alt="Nanamin surprised"
				>
				<span>{{ $t('layout.end_favorites') }}&nbsp;</span>
			</h4>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import type { KaraList } from '%/lib/types/kara';
	import { useAuthStore } from '~/store/auth';
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';

	const props = withDefaults(defineProps<{
		karaokes: KaraList
		playlists: DBPL[]
		loading: Boolean
		favorites: string
		withSuggest: boolean
	}>(), {
		favorites: '',
		withSuggest: true
	});

	const emit = defineEmits<{ (e: 'update-playlist'): void }>();

	const { user } = storeToRefs(useAuthStore());

	const fullyLoaded = computed(() => props.karaokes.infos.to === props.karaokes.infos.count);
	const myFavorites = computed(() => user?.value?.login === props.favorites);
</script>

<style lang="scss" scoped>
	.cell.is-12 {
		padding: 0.25rem;
	}
	.box.is-4 {
		padding: 0 0.25rem;
	}
	@media (max-width: 769px) {
		.box.is-4 {
			padding: 0.25em 0.75em;
		}
		.cell.is-12 {
			padding: 0;
		}
	}
	.title.is-4.with-img {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		@media screen and (max-width: 1024px) {
			flex-direction: column;
		}
		img {
			height: 2.5em;
		}
		margin-bottom: 0;
	}
</style>
