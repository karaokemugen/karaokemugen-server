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

<script lang="ts">
	import Vue from 'vue';
	import Modal from './Modal.vue';

	interface VState {
		explorerHost?: string
	}

	export default Vue.extend({
		name: 'DeleteAccountModal',

		components: {
			Modal
		},

		props: {
			active: Boolean
		},

		data(): VState {
			return {
				explorerHost: process.env.EXPLORER_HOST
			};
		},

		methods: {
			submitForm(): void {
				this.$axios.delete('/api/myaccount');
				this.$emit('logout');
				this.$auth.logout();
				this.closeModal();
			},
			closeModal(): void {
				this.$emit('close');
			}
		}
	});
</script>

<style lang="scss" scoped>

	.label {
		font-weight: normal;
	}

	.boldLabel {
		font-weight: bold;
	}

</style>
