<template>
	<div class="badges">
		<div v-for="role in effectiveRoles" :key="role.name" class="tag" :class="[role.class]">
			<font-awesome-icon :icon="['fas', role.icon]" fixed-width />
			{{ $t(`roles.${role.name}`) }}
		</div>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import { RoleDetail, roles } from '~/assets/constants';
	import { Roles } from '%/lib/types/user';

	type Role = RoleDetail & { name: string };
	type RoleKey = keyof Roles;

	export default Vue.extend({
		name: 'UserBadges',

		props: {
			roles: {
				type: Object,
				required: true
			} as PropOptions<Roles>
		},

		computed: {
			effectiveRoles(): Role[] {
				// Only truthy values and values that exists in roles table
				const realRoles = (Object.keys(this.roles) as RoleKey[]).filter(r => !!this.roles[r] && !!roles[r]);
				return realRoles.map((r) => {
					return {
						...roles[r],
						name: r
					} as Role;
				});
			}
		}
	});

</script>

<style scoped lang="scss">
	.badges {
		display: flex;
		> .tag {
			&:not(:last-child) {
				margin-right: .25em;
			}
			svg {
				margin-right: .5em;
			}
		}
	}
</style>
