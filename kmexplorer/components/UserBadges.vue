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
				<input
					v-if="edit"
					type="checkbox"
					:checked="role.active"
				>
				<font-awesome-icon
					:icon="['fas', role.icon]"
					fixed-width
				/>
				{{ $t(`roles.${role.name}`) }}
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import type { RoleDetail } from '~/assets/constants';
	import { rolesList } from '~/assets/constants';
	import type { Roles } from '%/lib/types/user';

	type Role = RoleDetail & { name: RoleKey, active: boolean };
	type RoleKey = keyof Roles;

	const props = withDefaults(defineProps<{
		roles?: Roles
		edit?: boolean
	}>(), {
		edit: false
	});

	const emit = defineEmits<{(e: 'toggle', nname: RoleKey): void}>();

	const effectiveRoles  = computed<Role[]>(() => {
		// Only values that exists in roles table
		const realRoles = Object.keys(rolesList) as RoleKey[];
		return realRoles.map((r) => {
			return {
				...rolesList[r],
				name: r,
				active: props.roles && !!props.roles[r]
			} as Role;
		});
	});

	function toggleRole(name: RoleKey) {
		if (props.edit) {
			emit('toggle', name);
		}
	}
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
