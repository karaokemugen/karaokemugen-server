<template>
	<modal
		:active="active"
		:modal-title="$t('bans.add')"
		:submit-label="$t('bans.submit')"
		@submit="submitForm"
		@close="closeModal"
	>
		<section class="modal-card-body">
			<div class="field is-horizontal">
				<div class="field-label is-normal">
					<label
						for="type"
						class="label"
					>{{ $t('bans.type') }}</label>
				</div>
				<div class="field-body">
					<div class="control">
						<div class="select">
							<select
								id="type"
								v-model="ban.type"
								name="type"
								autocomplete="off"
								required
							>
								<option value="email">
									{{ $t('modal.profile.fields.email.label') }}
								</option>
								<option value="nickname">
									{{ $t('modal.profile.fields.nickname.label') }}
								</option>
								<option value="username">
									{{ $t('modal.profile.fields.username.label') }}
								</option>
							</select>
						</div>
					</div>
				</div>
			</div>
			<div class="field is-horizontal">
				<div class="field-label is-normal">
					<label
						for="value"
						class="label"
					>{{ $t('bans.value') }}</label>
				</div>
				<div class="field-body">
					<div class="field">
						<div class="control">
							<input
								id="value"
								v-model="ban.value"
								type="text"
								name="name"
								class="input"
								required
								autocomplete="off"
							>
						</div>
					</div>
				</div>
			</div>
			<div class="field is-horizontal">
				<div class="field-label is-normal">
					<label
						for="reason"
						class="label"
					>{{ $t('bans.reason') }}</label>
				</div>
				<div class="field-body">
					<div class="field">
						<div class="control">
							<input
								id="reason"
								v-model="ban.reason"
								type="text"
								name="name"
								class="input"
							>
						</div>
					</div>
				</div>
			</div>
		</section>
	</modal>
</template>

<script setup lang="ts">
	import type { Ban } from '%/types/user';


	defineProps<{
		active: boolean
	}>();

	const emit = defineEmits<{(e: 'close'): void}>();

	const ban = ref<Ban>({
		type: 'email',
		value: ''
	});

	async function submitForm() {
		if (ban.value?.type && ban.value.value) {
			await useCustomFetch('/api/bans', {
				method: 'POST',
				body: ban.value
			});
			closeModal();
		}
	}
	function closeModal(): void {
		ban.value = {
			type: 'email',
			value: '',
			reason: undefined
		};
		emit('close');
	}
</script>

<style lang="scss" scoped>

	.label {
		font-weight: normal;
	}

	.select select option {
		color: #dbdee0;
	}

	.field:has(*:required) .label::before {
		content: '* ';
		color: red;
	}
</style>
