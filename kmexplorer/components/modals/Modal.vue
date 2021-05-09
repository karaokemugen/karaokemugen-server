<template>
	<div class="modal" :class="{'is-active': active}">
		<form action="#" @submit.prevent="submitForm">
			<div class="modal-background" @click="closeModal" />
			<div class="modal-card">
				<header>
					<div class="modal-card-head is-flex">
						{{ modalTitle }}
						<div><a class="delete" aria-label="close" @click="closeModal" /></div>
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

<script lang="ts">
	import Vue from 'vue';

	export default Vue.extend({
		name: 'Modal',

		props: {
			active: Boolean,
			modalTitle: String,
			submitLabel: String,
			cancelLabel: String
		},

		methods: {
			submitForm(): void {
				this.$emit('submit');
			},
			closeModal(): void {
				this.$emit('close');
			},
			cancelModal(): void {
				this.$emit('cancel');
				this.$emit('close');
			}
		}
	});
</script>

<style lang="scss" scoped>

	.modal-card-head {
		justify-content: space-between;
	}

</style>
