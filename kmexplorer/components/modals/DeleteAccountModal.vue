<template>
	<modal
		:active="active"
		:modal-title="$t('modal.delete_account.label')"
		:submit-label="$t('modal.delete_account.add')"
		:cancel-label="$t('modal.delete_account.cancel')"
		@submit="submitForm"
		@close="closeModal"
	/>
</template>

<script setup lang="ts">
	import { useAuthStore } from '~/store/auth';

	defineProps<{
		active: boolean
	}>();

	const { logout } = useAuthStore();

	const emit = defineEmits<{(e: 'close'| 'logout'): void}>();

	function submitForm(): void {
		useCustomFetch('/api/myaccount', {
			method: 'DELETE'
		});
		emit('logout');
		logout();
		closeModal();
	}
	function closeModal(): void {
		emit('close');
	}
</script>

<style lang="scss" scoped>

	.label {
		font-weight: normal;
	}

	.boldLabel {
		font-weight: bold;
	}

</style>
