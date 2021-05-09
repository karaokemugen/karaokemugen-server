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
			<label class="label" for="token">
				{{ $t('modal.join_kara.desc') }}
			</label>
			<input
				id="token"
				v-model="token"
				type="text"
				name="token"
				class="input"
			>
			<p class="help">
				{{ $t('modal.join_kara.help') }}
			</p>
			<p v-if="error" class="help is-danger">
				{{ $t('modal.join_kara.error') }}
			</p>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue from 'vue';
	import Modal from './Modal.vue';

	interface VState {
		explorerHost?: string
		remoteProtocol?: string
		token: string
		error: boolean
	}

	export default Vue.extend({
		name: 'JoinKaraModal',

		components: {
			Modal
		},

		props: {
			active: Boolean
		},

		data(): VState {
			return {
				explorerHost: process.env.EXPLORER_HOST,
				remoteProtocol: process.env.REMOTE_PROTOCOL,
				token: '',
				error: false
			};
		},

		methods: {
			async submitForm(): Promise<void> {
				if (this.token) {
					this.error = false;
					try {
						let url: string;
						if (/^https?:\/\//.test(this.token)) {
							url = this.token;
						} else {
							url = `${this.remoteProtocol}://${this.token}.${this.explorerHost}`;
						}
						await this.$axios.get(url);
						window.open(url, '_self');
					} catch (e) {
						this.error = true;
						throw e;
					}
				}
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

</style>
