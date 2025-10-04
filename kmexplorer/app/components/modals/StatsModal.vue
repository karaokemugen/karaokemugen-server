<template>
	<modal
		:active="active"
		:modal-title="$t('modal.stats.label')"
		:cancel-label="$t('modal.stats.no')"
		:submit-label="$t('modal.stats.yes')"
		@submit="authorizeStats"
		@cancel="refuseStats"
		@close="closeModal"
	>
		<section class="modal-card-body">
			<label class="label">
				{{ $t('modal.stats.desc') }}
			</label>
			<label class="label">
				{{ $t('modal.stats.refuse_desc') }}
			</label>
			<label class="label">
				{{ $t('modal.stats.change') }}
			</label>
		</section>
	</modal>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import type { DBUser } from '~/../kmserver-core/src/lib/types/database/user';
	import { useAuthStore } from '~/store/auth';
	import Modal from './Modal.vue';

	defineProps<{
		active: boolean
	}>();

	const emit = defineEmits<{ (e: 'close'): void }>();

	const { user } = storeToRefs(useAuthStore());
	const { setToken } = useAuthStore();

	async function authorizeStats(): Promise<void> {
		await saveUser(true);
	}
	async function refuseStats(): Promise<void> {
		await saveUser(false);
	}
	async function saveUser(flag_sendstats: boolean): Promise<void> {
		const userUpdated:DBUser = { ...user?.value };
		userUpdated.flag_sendstats = flag_sendstats;
		const response = await useCustomFetch<{data: {token: string}}>('/api/myaccount', {
			method: 'PATCH',
			body: userUpdated
		});
		await setToken(response.data.token);
		emit('close');
	}
	function closeModal(): void {
		emit('close');
	}
</script>
