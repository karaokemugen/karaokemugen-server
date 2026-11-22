<template>
	<div>
		<div class="buttons">
			<button class="button" @click="() => openModal('addBans')">
				<font-awesome-icon :icon="['fas', 'plus']" />
				<span>{{ $t('bans.add') }}</span>
			</button>
		</div>
		<ui-table :fields="fields" :data="bans">
			<template #banned_at="{ item }">
				{{ new Date((item as Ban)?.banned_at as any as string)?.toLocaleDateString() }}
			</template>
			<template #button="{ item }">
				<button class="button" @click.prevent="() => deleteBan(item as Ban)">
					<font-awesome-icon :icon="['fas', 'trash']" />
					<span>{{ $t('bans.delete') }}</span>
				</button>
			</template>
		</ui-table>
		<add-bans-modal :active="addBans" @close="afterAddBan" />
	</div>
</template>

<script setup lang="ts">

import type { Ban } from '%/types/user';
import { useAuthStore } from '~/store/auth';
import { useModalStore } from '~/store/modal';

const { addBans } = storeToRefs(useModalStore());
const { openModal, closeModal } = useModalStore();

const bans = ref<Ban[]>([]);

const { user } = storeToRefs(useAuthStore());

const { t } = useI18n();

const fields = [
	{ key: "type", label: t('bans.type'), searchable: true },
	{ key: "value", label: t('bans.value'), searchable: true },
	{ key: "banned_at", label: t('bans.banned_at') },
	{ key: "reason", label: t('bans.reason'), searchable: true },
	{ key: "button", label: '' },
];

if (import.meta.client && !user?.value?.roles?.admin) throw createError({ statusCode: 404 });

fetch();

async function fetch() {
	const res = await useCustomFetch<Ban[]>('/api/bans')
		.catch(_err => {
			throw createError({ statusCode: 404, message: t('error.bans') });
		});
	bans.value = res ? res : [];
}

async function deleteBan(ban: Ban) {
	await useCustomFetch('/api/bans', {
		method: 'DELETE',
		body: ban
	});
	fetch();
}

function afterAddBan() {
	closeModal('addBans');
	fetch();
}

</script>
