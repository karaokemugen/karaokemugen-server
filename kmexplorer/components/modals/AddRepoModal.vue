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
				<a :href="`https://mugen.karaokes.moe/${$i18n.locale === 'fre' ? '' : 'en/'}download.html`">
					{{ $t('modal.add_repository.download') }}
				</a>
			</label>
			<label class="label">
				<i18n path="modal.add_repository.manual" tag="label">
					<template #repository>
						<span class="boldLabel">{{ explorerHost }}</span>
					</template>
					<template #online>
						<span class="boldLabel">{{ $t('modal.add_repository.online') }}</span>
					</template>
				</i18n>
			</label>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue from 'vue';
	import Modal from './Modal.vue';

	interface VState {
		explorerHost?: string
	}

	export default Vue.extend({
		name: 'AddRepoModal',

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
				window.open(`km://addRepo/${this.explorerHost}`);
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
