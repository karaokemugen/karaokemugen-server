<template>
	<div>
		<div
			v-for="n in Math.ceil(karaokes.infos.to / 3)"
			:key="n"
			class="tile is-parent is-12"
		>
			<div
				v-for="n2 in 3"
				:key="`${n}_${n2}`"
				class="tile is-child is-4"
			>
				<kara-card
					v-if="karaokes.content[(n-1)*3+n2-1]"
					:karaoke="karaokes.content[(n-1)*3+n2-1]"
					:playlists="playlists"
					:karaokes-i18n="karaokes.i18n"
					@update-playlist="() => emit('update-playlist')"
				/>
			</div>
		</div>
		<loading-nanami
			v-if="loading"
			class="tile is-parent is-12"
		/>
		<suggest-line
			v-if="fullyLoaded && !loading && !favorites && withSuggest"
			class="tile is-parent is-12"
			:empty="karaokes.content.length === 0"
		/>
		<div
			v-else-if="fullyLoaded && !loading && myFavorites"
			class="tile is-parent"
		>
			<div class="tile is-child">
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
		</div>
		<div
			v-else-if="fullyLoaded && !loading && favorites"
			class="tile is-parent"
		>
			<div class="tile is-child">
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
