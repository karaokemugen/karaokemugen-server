<template>
	<div class="grid">
		<div class="cell">
			<div class="box">
				<h4 class="title is-4 with-img">
					<picture>
						<source
							type="image/webp"
							src="~/assets/nanami-surpris.webp"
						>
						<source
							type="image/png"
							src="~/assets/nanami-surpris.png"
						>
						<img
							src="~/assets/nanami-surpris.png"
							alt="Surprised Nanami"
						>
					</picture>
					{{ error.message || $t('error.generic') }}&nbsp;
					<nuxt-link to="/">
						{{ $t('error.home') }}
					</nuxt-link>
				</h4>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	defineProps<{
		error: any
	}>();
</script>

<style scoped lang="scss">
	.box {
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
