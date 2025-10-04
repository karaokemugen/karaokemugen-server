<template>
	<o-table :data="remotesToken">
		<o-table-column
			v-slot="props"
			field="token"
			:label="$t('remote.token')"
			searchable
			position="centered"
		>
			{{ props.row.token }}
		</o-table-column>
		<o-table-column
			v-slot="props"
			field="code"
			:label="$t('remote.code')"
			searchable
			position="centered"
		>
			<input
				v-model="props.row.code"
				class="input"
				type="text"
			>
		</o-table-column>
		<o-table-column
			v-slot="props"
			field="last_ip"
			:label="$t('remote.last_ip')"
			searchable
			position="centered"
		>
			{{ props.row.last_ip }}
		</o-table-column>
		<o-table-column
			v-slot="props"
			field="last_use"
			:label="$t('remote.last_use')"
			searchable
			position="centered"
		>
			{{ props.row.last_use }}
		</o-table-column>
		<o-table-column
			v-slot="props"
			field="permanent"
			:label="$t('remote.permanent')"
			searchable
			position="centered"
			:custom-search="searchPermanent"
		>
			{{ props.row.permanent ? $t('remote.yes') : $t('remote.no') }}
		</o-table-column>
		<o-table-column v-slot="props">
			<div class="buttons">
				<button
					class="button"
					@click="promoteToken(props.row)"
				>
					<font-awesome-icon :icon="['fas', 'edit']" />
					<span>{{ $t('remote.edit_button') }}</span>
				</button>
				<button
					class="button"
					@click="removeToken(props.row.token)"
				>
					<font-awesome-icon :icon="['fas', 'trash']" />
					<span>{{ $t('remote.delete_button') }}</span>
				</button>
			</div>
		</o-table-column>
	</o-table>
</template>

<script setup lang="ts">
	import type { RemoteAccessToken } from '%/lib/types/remote';
	import * as Toast from 'vue-toastification';

	// @ts-expect-error vue-toastification is not typed
	const useToast = Toast.useToast ?? Toast.default.useToast;

	const remotesToken = ref<RemoteAccessToken[]>([]);

	const { t } = useI18n();
	const toast = useToast();

	fetch();

	async function fetch() {
		const res = await useCustomFetch<RemoteAccessToken[]>('/api/remote')
			.catch(_err => {
				throw createError({ statusCode: 404, message: t('error.remote') });
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
		let inputBool: boolean | undefined;
		if (input.toLowerCase() === t('remote.yes').toLowerCase()) {
			inputBool = true;
		} else if (input.toLowerCase() === t('remote.no').toLowerCase()) {
			inputBool = false;
		}
		return inputBool === undefined || remote.permanent === inputBool;
	}
</script>
