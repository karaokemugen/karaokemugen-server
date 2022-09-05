<template>
	<div class="badges">
		<template v-for="role in effectiveRoles">
			<div
				v-if="role.active || edit"
				:key="role.name"
				class="tag"
				:class="[role.class, edit ? 'edit':undefined]"
				@click="toggleRole(role.name)"
			>
				<input v-if="edit" type="checkbox" :checked="role.active">
				<font-awesome-icon :icon="['fas', role.icon]" fixed-width />
				{{ $t(`roles.${role.name}`) }}
			</div>
		</template>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import { RoleDetail, roles } from '~/assets/constants';
	import { Roles } from '%/lib/types/user';

	type Role = RoleDetail & { name: string, active: boolean };
	type RoleKey = keyof Roles;

	export default Vue.extend({
		name: 'UserBadges',

		props: {
			roles: {
				type: Object,
				required: true
			} as PropOptions<Roles>,
			edit: {
				type: Boolean,
				default: false
			}
		},

		computed: {
			effectiveRoles(): Role[] {
				// Only values that exists in roles table
				const realRoles = Object.keys(roles) as RoleKey[];
				return realRoles.map((r) => {
					return {
						...roles[r],
						name: r,
						active: !!this.roles[r]
					} as Role;
				});
			}
		},

		methods: {
			toggleRole(name: string) {
				if (this.edit) {
					this.$emit('toggle', name);
				}
			}
		}
	});

</script>

<style scoped lang="scss">
	.badges {
		display: flex;
		flex-wrap: wrap;
		> .tag {
			input[type="checkbox"] {
				margin-right: .5em;
				background-color: #373f40;
				border-color: whitesmoke;
				cursor: pointer;
			}
			&.edit {
				cursor: pointer;
				user-select: none;
			}
			&:not(:last-child) {
				margin-right: .25em;
			}
			svg {
				margin-right: .5em;
			}
		}
	}
</style>
