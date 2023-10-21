<template>
	<div class="user-box">
		<div class="user-header">
			<img
				:src="`${apiUrl}banners/${user.banner}`"
				alt="User banner"
				class="banner"
			>
			<div class="title-bar">
				<img
					:src="`${apiUrl}avatars/${user.avatar_file}`"
					alt=""
					class="profile"
				>
				<div class="name-stats">
					<nuxt-link :to="`/user/${user.login}`">
						{{
							user.nickname +
								(viewingSelf ? $t('profile.you'):'')
						}}
					</nuxt-link>
					<div>
						{{ $t('profile.favorites_count', user.favorites_count || 0) }}
					</div>
				</div>
			</div>
		</div>
		<p>{{ user.bio }}</p>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import type { DBUser } from '%/lib/types/database/user';
	import { useAuthStore } from '~/store/auth';

	const props = defineProps<{
		user: DBUser
	}>();

	const { loggedIn, user:userConnected } = storeToRefs(useAuthStore());

	const conf = useRuntimeConfig();
	const apiUrl = conf.public.API_URL;

	const viewingSelf = computed(() => loggedIn.value && props.user.login === userConnected?.value?.login);
</script>

<style scoped lang="scss">
@mixin height-hack($factor: 1, $property: 'height') {
	#{$property}: 15rem * $factor;
	@media screen and (max-width: 1600px) {
		#{$property}: 12.5rem * $factor;
	}
	@media screen and (max-width: 1200px) {
		#{$property}: 10rem * $factor;
	}
	@media screen and (max-width: 680px) {
		#{$property}: 7.5rem * $factor;
	}
}

.user-box {
	margin: 0 .5em;
	@media screen and (max-width: 769px) {
		margin: .5em 0;
	}
	border: 1px solid #373f40;
	border-radius: 8px;
	.user-header {
		position: relative;
		box-sizing: border-box;
		@include height-hack;
		border-radius: 8px;
		> img.banner {
			@include height-hack;
			width: 100%;
			object-fit: cover;
			border-top-right-radius: 8px;
			border-top-left-radius: 8px;
			filter: saturate(0.8) brightness(0.8);
		}
		> img.banner[src="/banners/default.jpg"] {
			filter: saturate(0.75) brightness(0.7);
		}
		.title-bar {
			position: absolute;
			display: flex;
			align-items: center;
			bottom: 0;
			width: 100%;
			background-color: #000000bb;
			border-bottom: 1px solid #7f828bbb;
			text-shadow: 1px 1px 1px black;
			> img.profile {
				@include height-hack(0.33);
				width: auto;
			}
			> .name-stats {
				padding-left: .5em;
				> a {
					line-height: 1em;
					@include height-hack(0.15, 'font-size');
					font-weight: bold;
					height: 1em;
					display: inline-block;
					overflow: hidden;
				}
			}
		}
	}
	p {
		background-color: #373f40;
		padding: .5em;
		border-bottom-right-radius: 8px;
		border-bottom-left-radius: 8px;
	}
}
</style>
