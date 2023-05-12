<template>
	<o-table :data="remotesToken">
		<o-table-column
			v-slot="props"
			field="token"
			:label="$t('remote.token')"
			searchable
		>
			{{ props.row.token }}
		</o-table-column>
		<o-table-column
			v-slot="props"
			field="code"
			:label="$t('remote.code')"
			searchable
		>
			<input
				v-model="props.row.code"
				class="input"
				type="text"
				@keydown.enter="promoteToken(props.row)"
			>
		</o-table-column>
		<o-table-column
			v-slot="props"
			field="last_ip"
			:label="$t('remote.last_ip')"
			searchable
		>
			{{ props.row.last_ip }}
		</o-table-column>
		<o-table-column
			v-slot="props"
			field="last_use"
			:label="$t('remote.last_use')"
			searchable
		>
			{{ props.row.last_use }}
		</o-table-column>
		<o-table-column
			v-slot="props"
			field="permanent"
			:label="$t('remote.permanent')"
			searchable
			:custom-search="searchPermanent"
		>
			<input
				type="checkbox"
				disabled
				:checked="props.row.permanent"
			>
		</o-table-column>
		<o-table-column v-slot="props">
			<button
				class="button"
				@click="removeToken(props.row.token)"
			>
				<font-awesome-icon :icon="['fas', 'trash']" />
				<span>{{ $t('remote.delete_button') }}</span>
			</button>
		</o-table-column>
	</o-table>
</template>

<script setup lang="ts">
	import { RemoteAccessToken } from '%/lib/types/remote';
	import * as Toast from 'vue-toastification';

	// @ts-ignore
	const useToast = Toast.useToast ?? Toast.default.useToast;

	const remotesToken = ref<RemoteAccessToken[]>([]);

	const { t } = useI18n();
	const toast = useToast();

	await fetch();

	async function fetch() {
		const res = await useCustomFetch<RemoteAccessToken[]>('/api/remote')
			.catch(_err => {
				throw createError({ statusCode: 404, message: t('error.remote') as string });
			});
		remotesToken.value = res ? res : [];
	}

	async function removeToken(token: string) {
		try {
			await useCustomFetch(`/api/remote/${token}`, {
				method: 'DELETE'
			});
			fetch();
		} catch (e) {
			toast.error(t('remote.delete_error') as string, { icon: 'error' });
		}
	}
	async function promoteToken(remote: RemoteAccessToken) {
		try {
			await useCustomFetch('/api/remote/promote', {
				method: 'PUT',
				body: {
					token: remote.token,
					code: remote.code
				}
			});
			toast.success(t('remote.edit_success') as string);
			fetch();
		} catch (e) {
			toast.error(t('remote.edit_error') as string, { icon: 'error' });
		}
	}
	function searchPermanent(remote: RemoteAccessToken, input: string) {
		let inputBool: Boolean | undefined;
		if (input === 'true') {
			inputBool = true;
		} else if (input === 'false') {
			inputBool = false;
		}
		return inputBool === undefined || remote.permanent === inputBool;
	}
</script>
