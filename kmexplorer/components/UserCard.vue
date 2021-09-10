<template>
	<div class="user-box">
		<img :src="`/banners/${user.banner}`" alt="User banner" class="banner">
		<div class="title-bar">
			<img :src="`/avatars/${user.avatar_file}`" alt="" class="profile">
			<nuxt-link :to="`/user/${user.login}`">
				{{
					user.nickname +
						(viewingSelf ? $t('profile.you'):'')
				}}
			</nuxt-link>
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
	transform: translate(-1.25rem, -1.25rem);
	width: calc(100% + 2.5rem);
	@include height-hack;
	> img.banner {
		@include height-hack;
		width: 100%;
		object-fit: cover;
		border-radius: 8px;
	}
	.title-bar {
		position: absolute;
		display: flex;
		align-items: center;
		bottom: 0;
		width: 100%;
		background-color: #000000bb;
		border-bottom-left-radius: 8px;
		border-bottom-right-radius: 8px;
		> img.profile {
			@include height-hack(0.25);
			width: auto;
		}
		> a {
			padding: .25em;
			line-height: 1em;
			font-size: 1.75em;
			font-weight: bold;
		}
	}
}
</style>
