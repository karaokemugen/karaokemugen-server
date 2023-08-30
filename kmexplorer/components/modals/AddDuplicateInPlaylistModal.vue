<template>
	<modal
		:active="active"
		:modal-title="$t('modal.add_duplicate_in_playlist.label', { name: playlist?.name })"
		:submit-label="$t('modal.add_duplicate_in_playlist.add')"
		:cancel-label="$t('modal.add_duplicate_in_playlist.cancel')"
		@submit="submitForm"
		@close="() => closeModal('addDuplicateInPlaylist')"
	/>
</template>

<script setup lang="ts">
	import { DBPL } from 'kmserver-core/src/types/database/playlist';
	import { useModalStore } from '~/store/modal';

	const props = defineProps<{
		active: boolean
		playlist?: DBPL
	}>();

	const emit = defineEmits<{ (e: 'close', plaid: string): void }>();

	const { closeModal } = useModalStore();

	async function submitForm(): Promise<void> {
		emit('close', props.playlist?.plaid as string);
		closeModal('addDuplicateInPlaylist');
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
