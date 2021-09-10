<template>
	<div>
		<div v-for="n in Math.ceil(users.length)" :key="n" class="tile is-parent is-12">
			<div v-for="n2 in 3" :key="`${n}_${n2}`" class="tile is-child is-4">
				<user-card v-if="users[(n-1)*3+n2-1]" :user="users[(n-1)*3+n2-1]" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import UserCard from '~/components/UserCard.vue';
	import { DBUser } from '%/lib/types/database/user';

	interface VState {
		users: DBUser[]
	}

	export default Vue.extend({
		name: 'UserSearch',

		components: {
			UserCard
		},

		data() {
			return {
				users: []
			};
		},

		async fetch() {
			this.users = await this.$axios.$get('/api/users');
		}
	});
</script>
