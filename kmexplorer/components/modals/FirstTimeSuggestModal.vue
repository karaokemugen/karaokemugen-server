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
				<i18n path="suggestions.modal.welcome.text3" tag="em">
					<template #discord>
						<a href="https://karaokes.moe/discord" target="_blank">{{ $t('suggestions.modal.welcome.discord') }}</a>
					</template>
				</i18n>
			</label>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue from 'vue';
	import Modal from './Modal.vue';

	export default Vue.extend({
		name: 'FirstTimeSuggestModal',

		components: {
			Modal
		},

		props: {
			active: Boolean
		},

		methods: {
			closeModal(): void {
				window.localStorage.hideSuggestionModal = true;
				this.$emit('close');
			}
		}
	});
</script>
