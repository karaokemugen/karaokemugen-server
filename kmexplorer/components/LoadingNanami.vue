<template>
	<div class="tile is-parent">
		<div class="tile is-child">
			<div class="box">
				<h4 class="title is-4 with-img">
					<picture>
						<source type="image/webp" :srcset="require('~/assets/nanami-surpris.webp')">
						<source type="image/png" :srcset="require('~/assets/nanami-surpris.png')">
						<img :src="require('~/assets/nanami-surpris.png')" alt="Surprised Nanami">
					</picture>
					{{ $t('layout.loading') }}
				</h4>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'LoadingNanami'
	};
</script>

<style scoped lang="scss">
	.tile.is-child {
		padding: 0 1em;
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
