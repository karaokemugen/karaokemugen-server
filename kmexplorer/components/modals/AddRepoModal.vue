<template>
	<modal
		:active="active"
		:modal-title="$t('modal.add_repository.label')"
		:submit-label="$t('modal.add_repository.add')"
		:cancel-label="$t('modal.add_repository.cancel')"
		@submit="submitForm"
		@close="closeModal"
	>
		<section class="modal-card-body">
			<label class="label">
				{{ $t('modal.add_repository.desc') }}
				<nuxt-link :href="`https://mugen.karaokes.moe/${$i18n.locale === 'fr' ? '' : 'en/'}download.html`">
					{{ $t('modal.add_repository.download') }}
				</nuxt-link>
			</label>
			<label class="label">
				<i18n-t
					keypath="modal.add_repository.manual"
					tag="label"
				>
					<template #repository>
						<span class="boldLabel">{{ explorerHost }}</span>
					</template>
					<template #online>
						<span class="boldLabel">{{ $t('modal.add_repository.online') }}</span>
					</template>
				</i18n-t>
			</label>
		</section>
	</modal>
</template>

<script setup lang="ts">
	defineProps<{
		active: boolean
	}>();

	const explorerHost = useRuntimeConfig().public.EXPLORER_HOST;
	const emit = defineEmits<{(e: 'close'): void}>();

	function submitForm(): void {
		window.open(`km://addRepo/${explorerHost}`);
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
