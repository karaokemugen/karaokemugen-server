<template>
	<div
		class="modal"
		:class="{'is-active': active}"
	>
		<form
			action="#"
			@submit.prevent="submitForm"
		>
			<div
				class="modal-background"
				@click="closeModal"
			/>
			<div class="modal-card">
				<header>
					<div class="modal-card-head is-flex">
						{{ modalTitle }}
						<div>
							<nuxt-link
								class="delete"
								aria-label="close"
								@click="closeModal"
							/>
						</div>
					</div>
				</header>
				<slot />
				<footer class="modal-card-foot">
					<button
						v-if="submitLabel"
						class="button is-success"
						type="submit"
					>
						{{ submitLabel }}
					</button>
					<button
						v-if="cancelLabel"
						type="button"
						class="button"
						@click="cancelModal"
					>
						{{ cancelLabel }}
					</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">

	defineProps<{
		active: boolean,
		modalTitle: string,
		submitLabel?: string,
		cancelLabel?: string
	}>();

	const emit = defineEmits<{ (e: 'close' | 'submit' | 'cancel'): void }>();

	function submitForm(): void {
		emit('submit');
	}
	function closeModal(): void {
		emit('close');
	}
	function cancelModal(): void {
		emit('cancel');
		emit('close');
	}
</script>

<style lang="scss" scoped>

	.modal-card-head {
		justify-content: space-between;
	}

</style>
