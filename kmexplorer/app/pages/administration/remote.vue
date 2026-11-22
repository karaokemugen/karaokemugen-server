<template>
	<ui-table :fields="fields" :data="remotesToken">
		<template #code="{ item }">
			<input v-model="(item as RemoteAccessToken).code" class="input" type="text">
		</template>
		<template #permanent="{ item }">
			{{ (item as RemoteAccessToken).permanent ? $t('actions.yes') : $t('actions.no') }}
		</template>
		<template #button="{ item }">
			<div class="buttons">
				<button class="button" @click="promoteToken(item as RemoteAccessToken)">
					<font-awesome-icon :icon="['fas', 'edit']" />
					<span>{{ $t('remote.edit_button') }}</span>
				</button>
				<button class="button" @click="removeToken((item as RemoteAccessToken).token)">
					<font-awesome-icon :icon="['fas', 'trash']" />
					<span>{{ $t('remote.delete_button') }}</span>
				</button>
			</div>
		</template>
	</ui-table>
</template>

<script setup lang="ts">
import type { RemoteAccessToken } from '%/lib/types/remote';
import * as Toast from 'vue-toastification';
import { useAuthStore } from '~/store/auth';

// @ts-expect-error vue-toastification is not typed
const useToast = Toast.useToast ?? Toast.default.useToast;

const remotesToken = ref<RemoteAccessToken[]>([]);
const { user } = storeToRefs(useAuthStore());

const { t } = useI18n();
const toast = useToast();

const fields = [
	{ key: "token", label: t('remote.token'), searchable: true },
	{ key: "code", label: t('remote.code'), searchable: true },
	{ key: "last_ip", label: t('remote.last_ip'), searchable: true },
	{ key: "last_use", label: t('remote.last_use'), searchable: true },
	{ key: "permanent", label: t('remote.permanent'), searchable: true },
	{ key: "button", label: '' },
];

if (import.meta.client && !user?.value?.roles?.admin) throw createError({ statusCode: 404 });

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
	} catch (_) {
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
	} catch (_) {
		toast.error(t('remote.edit_error') as string, { icon: 'error' });
	}
}
</script>
