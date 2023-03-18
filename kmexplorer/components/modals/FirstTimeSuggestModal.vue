<template>
	<modal
		:active="active"
		:modal-title="$t('suggestions.modal.welcome.title')"
		:cancel-label="$t('suggestions.modal.welcome.btn')"
		@close="closeModal"
	>
		<section class="modal-card-body">
			<label class="label">
				{{ $t('suggestions.modal.welcome.text') }}
			</label>
			<label class="label">
				{{ $t('suggestions.modal.welcome.text2') }}
			</label>
			<label class="label">
				<i18n-t
					keypath="suggestions.modal.welcome.text3"
					tag="em"
				>
					<template #discord>
						<nuxt-link
							href="https://karaokes.moe/discord"
							target="_blank"
						>{{ $t('suggestions.modal.welcome.discord') }}</nuxt-link>
					</template>
				</i18n-t>
			</label>
		</section>
	</modal>
</template>

<script setup lang="ts">
	import { useLocalStorageStore } from '~/store/localStorage';

	defineProps<{
		active: boolean
	}>();

	const emit = defineEmits<{(e: 'close'): void}>();
	const { setHideSuggestionModal } = useLocalStorageStore();

	function closeModal(): void {
		setHideSuggestionModal();
		emit('close');
	}
</script>
