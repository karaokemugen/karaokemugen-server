<template>
	<div class="tags">
		<span
			v-for="u in values"
			:key="u.login"
			class="tag"
		>
			{{ u.nickname }}
			<nuxt-link
				class="delete is-small"
				@click.prevent="() => deleteValue(u)"
			/>
		</span>
		<div
			class="button tag is-small"
			@click="inputVisible = true"
		>
			<font-awesome-icon :icon="['fas', 'plus']" />
			{{ $t('kara.import.add') }}
		</div>
	</div>
	<div v-if="inputVisible">
		<ui-combobox
			v-model:model="model"
			v-model:filter="filter"
			:items="availableUsers
				.filter((u: User) => !props.params.find(user => user.username === u.login) && u.login !== user?.login)
				.map(u => {
					return {label: u.nickname || u.login, value: u as never}
				})"
			height="200px"
			:delete-button="false"
			:clear-on-focus="true"
		/>
	</div>
</template>

<script setup lang="ts">
	import _ from 'lodash';
	import { storeToRefs } from 'pinia';
	import type { User } from '%/lib/types/user';
	import type { UserList } from '%/types/user';
	import { useAuthStore } from '~/store/auth';
	import type { Contributors } from '%/lib/types/database/playlist';

	const props = defineProps<{
		params: Contributors[]
		plaid: string
	}>();

	const { user } = storeToRefs(useAuthStore());

	const emit = defineEmits<{ (e: 'change', value: Contributors[]): void }>();

	const availableUsers = ref<User[]>([]);
	const values = ref<User[]>([]);
	const inputVisible = ref(false);
	const isFetching = ref(false);
	const loading = ref(false);
	const model = ref<{label: string, value: User}>();
	const filter = ref('');

	watch([props, inputVisible], () => {
		updateProps();
	}, { deep: true });

	watch(filter, () => debouncedGetAsyncData(filter.value));
	watch(model, () => {
		addValue(model.value as {label: string, value: User});
	});

	const debouncedGetAsyncData = _.debounce(getAsyncData, 500, { leading: true, trailing: true, maxWait: 750 });

	onMounted(async () => {
		updateProps();
	});

	async function updateProps() {
		if (props.params.length > 0) {
			const users: User[] = [];
			for (const u of props.params) {
				const userFound = availableUsers.value.find(val => val.login === u.username);
				if (userFound) {
					users.push(userFound);
				} else {
					const data = await useCustomFetch<User>(`/api/users/${u.username}`);
					if (!data) {
						throw new TypeError(`User ${u.username} unknown`);
					}
					users.push(data);
				}
			}
			values.value = users;
		}
	}

	async function getUsers(filter?: string): Promise<User[]> {
		const { content } = await useCustomFetch<UserList>('/api/users', {
			query: {
				filter,
				size: 100
			}
		});
		return content;
	}
	function getAsyncData(val: string) {
		isFetching.value = true;
		getUsers(val)
			.then((content) => {
				const logins = values.value.map(user => user.login);
				availableUsers.value = content
					? content.filter(u => !logins.includes(u.login) && u.login !== user?.value?.login).sort((a, b) =>
						a.login.localeCompare(b.login)
					)
					: [];
			})
			.finally(() => {
				isFetching.value = false;
			});
	}
	async function addValue(option: {label: string, value: User}) {
		inputVisible.value = false;
		if (option.value) {
			loading.value = true;
			await useCustomFetch(`/api/playlist/${props.plaid}/contributor/${option.value.login}`, {
				method: 'POST'
			}).finally(() => {
				loading.value = false;
			});
			const valuesUpdated: User[] = values.value;
			valuesUpdated.push(option.value);
			values.value = valuesUpdated;
			emit('change', values.value.map((user: User) => {
				return {
					username: user.login,
					nickname: user.nickname,
					avatar_file: user.avatar_file
				} as Contributors;
			}));
		}
	}
	async function deleteValue(option: User) {
		loading.value = true;
		await useCustomFetch(`/api/playlist/${props.plaid}/contributor/${option.login}`, {
			method: 'DELETE'
		}).finally(() => {
			loading.value = false;
		});
		values.value = values.value.filter((user: User) => user.login !== option.login);
		emit('change', values.value.map((user: User) => {
			return {
				username: user.login,
				nickname: user.nickname,
				avatar_file: user.avatar_file
			} as Contributors;
		}));
	}
</script>

<style scoped lang="scss">
	.checkbox {
		width: 250px;
	}
</style>
