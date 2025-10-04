<template>
	<modal
		:active="active"
		:modal-title="$t(canDeleteAdmin ?
		 'modal.delete_account.label_admin' 
		: 'modal.delete_account.label')"
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
	const { loggedIn, user: userConnected } = storeToRefs(useAuthStore());
	const { params } = useRoute();
	const { push } = useRouter();

	const viewingSelf = computed(() => loggedIn.value && (params.login === userConnected?.value?.login));
	const canDeleteAdmin = computed(() => loggedIn.value && !!userConnected?.value?.roles?.admin && !viewingSelf.value);

	const emit = defineEmits<{(e: 'close'| 'logout'): void}>();

	function submitForm(): void {
		if (canDeleteAdmin.value) {
			useCustomFetch(`/api/users/${params.login}`, {
				method: 'DELETE'
			});
		} else {
			useCustomFetch('/api/myaccount', {
				method: 'DELETE'
			});
			emit('logout');
			logout();
		}
		closeModal();
		push('/users')
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
