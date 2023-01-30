<template>
	<modal
		:active="active"
		:modal-title="$t('modal.join_kara.label')"
		:submit-label="$t('modal.join_kara.add')"
		:cancel-label="$t('modal.join_kara.cancel')"
		@submit="submitForm"
		@close="closeModal"
	>
		<section class="modal-card-body">
			<label
				class="label"
				for="token_join_kara"
			>
				{{ $t('modal.join_kara.desc') }}
			</label>
			<input
				id="token_join_kara"
				v-model="token"
				type="text"
				name="token"
				class="input"
			>
			<p class="help">
				{{ $t('modal.join_kara.help') }}
			</p>
			<p
				v-if="error"
				class="help is-danger"
			>
				{{ $t('modal.join_kara.error') }}
			</p>
		</section>
	</modal>
</template>

<script setup lang="ts">

	defineProps<{
		active: boolean
	}>();

	const emit = defineEmits<{(e: 'close'): void}>();

	const token = ref('');
	const error = ref(false);

	const conf = useRuntimeConfig();
	const explorerProtocol = conf.public.EXPLORER_PROTOCOL;
	const explorerHost = conf.public.EXPLORER_HOST;

	async function submitForm(): Promise<void> {
		if (token.value) {
			error.value = false;
			try {
				let url: string;
				if (/^https?:\/\//.test(token.value)) {
					url = token.value;
				} else {
					url = `${explorerProtocol}://${token.value}.${explorerHost}`;
				}
				await $fetch(url);
				window.open(url, '_self');
			} catch (e) {
				error.value = true;
				throw e;
			}
		}
	}
	function closeModal(): void {
		emit('close');
	}
</script>

<style lang="scss" scoped>

	.label {
		font-weight: normal;
	}

</style>
