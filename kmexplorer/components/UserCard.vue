<template>
	<div class="user-box">
		<img :src="`/banners/${user.banner}`" alt="User banner" class="banner">
		<div class="title-bar">
			<img :src="`/avatars/${user.avatar_file}`" alt="" class="profile">
			<div class="name-stats">
				<nuxt-link :to="`/user/${user.login}`">
					{{
						user.nickname +
							(viewingSelf ? $t('profile.you'):'')
					}}
				</nuxt-link>
				<div>
					{{ $tc('profile.favorites_count', user.favorites_count, { x: user.favorites_count }) }}
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import { DBUser } from '%/lib/types/database/user';

	export default Vue.extend({
		name: 'UserCard',

		props: {
			user: {
				type: Object,
				required: true
			} as PropOptions<DBUser>
		},

		computed: {
			viewingSelf() {
				// @ts-ignore: just send help.
				return this.$auth.loggedIn && (this.user.login === this.$auth.user.login);
			}
		}
	});
</script>

<style scoped lang="scss">
@mixin height-hack($factor: 1) {
	height: 15rem * $factor;
	@media screen and (max-width: 1600px) {
		height: 10rem * $factor;
	}
	@media screen and (max-width: 1200px) {
		height: 7.5rem * $factor;
	}
	@media screen and (max-width: 680px) {
		height: 5rem * $factor;
	}
}

.user-box {
	position: relative;
	padding: .5em;
	box-sizing: content-box;
	@include height-hack;
	border-radius: 8px;
	> img.banner {
		@include height-hack;
		width: 100%;
		object-fit: cover;
		border-radius: 8px;
		border: 1px solid #7f828b;
	}
	.title-bar {
		position: absolute;
		display: flex;
		align-items: center;
		bottom: 0;
		width: calc(100% - 1em);
		background-color: #000000bf;
		border-bottom-left-radius: 8px;
		border-bottom-right-radius: 8px;
		border: 1px solid #7f828b;
		border-top-color: #7f828bbb;
		> img.profile {
			@include height-hack(0.33);
			width: auto;
			border-bottom-left-radius: 8px;
		}
		> .name-stats {
			padding-left: .5em;
			> a {
				line-height: 1em;
				font-size: 1.75em;
				font-weight: bold;
			}
		}
	}
}
</style>
