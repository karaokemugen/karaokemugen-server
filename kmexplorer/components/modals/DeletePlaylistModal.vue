<template>
	<modal
		:active="active"
		:modal-title="$t('modal.delete_playlist.label', { name: playlist?.name })"
		:submit-label="$t('modal.delete_playlist.add')"
		:cancel-label="$t('modal.delete_playlist.cancel')"
		@submit="submitForm"
		@close="() => closeModal('deletePlaylist')"
	/>
</template>

<script setup lang="ts">
	import { DBPL } from 'kmserver-core/src/lib/types/database/playlist';
	import { useModalStore } from '~/store/modal';

	const props = defineProps<{
		active: boolean
		playlist?: DBPL
	}>();

	const emit = defineEmits<{ (e: 'close', plaid?: string): void }>();

	const { closeModal } = useModalStore();

	async function submitForm(): Promise<void> {
		await useCustomFetch(`/api/playlist/${props.playlist?.plaid}`, {
			method: 'DELETE',
		});
		emit('close', props.playlist?.plaid);
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
