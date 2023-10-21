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
		<o-autocomplete
			ref="inputToFocus"
			v-model="currentVal"
			keep-first
			open-on-focus
			:data="availableUsers.filter(u => !props.params.find(user => user.username === u.login) && u.login !== user?.login)"
			:loading="isFetching"
			:custom-formatter="(user: User) => user.nickname"
			:clear-on-select="true"
			@typing="debouncedGetAsyncData"
			@select="addValue"
		/>
	</div>
</template>

<script setup lang="ts">
	import _ from 'lodash';
	import { storeToRefs } from 'pinia';
	import type { User } from 'kmserver-core/src/lib/types/user';
	import type { UserList } from 'kmserver-core/src/types/user';
	import { useAuthStore } from '~/store/auth';
	import type { Contributors } from 'kmserver-core/src/lib/types/database/playlist';

	const props = defineProps<{
		params: Contributors[]
		plaid: string
	}>();

	const { user } = storeToRefs(useAuthStore());

	const emit = defineEmits<{ (e: 'change', value: Contributors[]): void }>();

	const availableUsers = ref<User[]>([]);
	const values = ref<User[]>([]);
	const inputVisible = ref(false);
	const currentVal = ref('');
	const isFetching = ref(false);
	const loading = ref(false);
	const debouncedGetAsyncData = ref();
	const inputToFocus = ref<HTMLElement>();

	watch([props, inputVisible], ([_newProps, newInputVisible]) => {
		if (newInputVisible) {
			nextTick(() => {
				inputToFocus.value?.focus();
			});
		}
		updateProps();
	}, { deep: true });

	onMounted(async () => {
		debouncedGetAsyncData.value = _.debounce(getAsyncData, 500, { leading: true, trailing: true, maxWait: 750 });
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
				filter
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
	async function addValue(option: User) {
		inputVisible.value = false;
		currentVal.value = '';
		if (option) {
			loading.value = true;
			await useCustomFetch(`/api/playlist/${props.plaid}/contributor/${option.login}`, {
				method: 'POST'
			}).finally(() => {
				loading.value = false;
			});
			const valuesUpdated: User[] = values.value;
			valuesUpdated.push(option);
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
