<template>
	<button
		class="button has-background-info"
		@click="generate"
	>
		<font-awesome-icon
			fixed-width
			:icon="['fas', 'database']"
		/>
		{{ $t('administration.generate_database') }}
	</button>
</template>

<script setup lang="ts">
	import * as Toast from 'vue-toastification';

	// @ts-expect-error vue-toastification is not typed
	const useToast = Toast.useToast ?? Toast.default.useToast;

	const { t } = useI18n();
	const toast = useToast();


	async function generate() {
		await useCustomFetch('/api/generate', { method: 'POST' });
		toast.success(t('administration.generation_triggered'));
	}

</script>
