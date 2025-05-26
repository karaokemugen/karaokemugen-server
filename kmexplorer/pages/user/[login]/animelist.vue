<template>
	<loading-nanami
		v-if="!user?.login"
		class="tile is-parent is-12"
	/>
	<div v-else>
		<div class="title-box">
			<h1 class="title with-button">
				<i
					:className="`icon-${user?.anime_list_to_fetch}`"
				/>
				{{ $t('profile.anime_list') }}
			</h1>
		</div>
		<kara-query :user-anime-list="user?.login" />
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useAuthStore } from '~/store/auth';
	import { useConfigStore } from '~/store/config';

	const { user } = storeToRefs(useAuthStore());
	const { config } = storeToRefs(useConfigStore());

	if (!config?.value?.Users.Enabled || !user?.value) {
		throw createError({ statusCode: 404 });
	}
</script>

<style scoped lang="scss">

	.title-box {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		@media screen and (max-width: 769px) {
			flex-direction: column;
			align-items: flex-start;
		}
	}
	.title.with-button {
		padding: 1rem .5rem;
		margin-bottom: .5rem;
	}
</style>
