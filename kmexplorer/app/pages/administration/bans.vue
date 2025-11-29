<template>
	<div>
		<div class="buttons">
			<button
				class="button"
				@click="() => openModal('addBans')"
			>
				<font-awesome-icon :icon="['fas', 'plus']" />
				<span>{{ $t('bans.add') }}</span>
			</button>
		</div>
		<o-table :data="bans">
			<o-table-column
				v-slot="props"
				field="type"
				:label="$t('bans.type')"
				searchable
			>
				{{ props.row.type }}
			</o-table-column>
			<o-table-column
				v-slot="props"
				field="value"
				:label="$t('bans.value')"
				searchable
			>
				{{ props.row.value }}
			</o-table-column>
			<o-table-column
				v-slot="props"
				field="banned_at"
				:label="$t('bans.banned_at')"
				searchable
			>
				{{ new Date(props.row.banned_at).toLocaleDateString() }}
			</o-table-column>
			<o-table-column
				v-slot="props"
				field="reason"
				:label="$t('bans.reason')"
				searchable
			>
				{{ props.row.reason }}
			</o-table-column>
			<o-table-column v-slot="props">
				<button
					class="button"
					@click.prevent="() => deleteBan(props.row)"
				>
					<font-awesome-icon :icon="['fas', 'trash']" />
					<span>{{ $t('bans.delete') }}</span>
				</button>
			</o-table-column>
		</o-table>
		<add-bans-modal
			:active="addBans"
			@close="afterAddBan"
		/>
	</div>
</template>

<script setup lang="ts">
	import type { Ban } from '%/types/user';
	import { useModalStore } from '~/store/modal';

	const { addBans } = storeToRefs(useModalStore());
	const { openModal, closeModal } = useModalStore();

	const bans = ref<Ban[]>([]);

	const { t } = useI18n();

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
		bans.value = bans.value.filter(value => value.type !== ban.type && value.value !== ban.value);
	}

	function afterAddBan() {
		closeModal('addBans');
		fetch();
	}
</script>
