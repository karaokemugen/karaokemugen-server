<template>
	<div
		v-for="pl in playlists.slice(0, maxIndexPlaylists)"
		:key="pl.plaid"
		class="py-1"
	>
		<nuxt-link
			class="link box"
			:to="`/playlist/${pl.slug}`"
		>
			<playlist-card
				:playlist="pl"
				:with-buttons="withButtons"
				@delete="() => emit('delete', pl)"
				@edit="() => emit('edit', pl)"
			/>
		</nuxt-link>
	</div>
	<div v-if="maxIndexPlaylists < playlists.length">
		<div class="box">
			<h4 class="title is-4 with-img">
				<img
					src="~/assets/nanami-surpris.png"
					alt="Nanamin surprised"
				>
				<nuxt-link :onclick="() => maxIndexPlaylists = maxIndexPlaylists + chunkSize">
					{{ $t('layout.end_playlists', {
						number: (maxIndexPlaylists + chunkSize) > playlists.length ?
							playlists.length - chunkSize : chunkSize
					}) }}
				</nuxt-link>
			</h4>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';

	const props = defineProps<{
		playlists: DBPL[]
		chunkSize: number
		withButtons?: boolean
	}>();

	const emit = defineEmits<{ (e: 'delete' | 'edit', playlist: DBPL): void }>();

	const maxIndexPlaylists = ref(props.chunkSize);
</script>
<style scope lang="scss">

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