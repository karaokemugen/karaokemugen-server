<template>
	<modal
		:active="active"
		:modal-title="$t('modal.stats.label')"
		:submit-action="submitForm"
		:close="closeModal"
		:submit-label="$t('modal.stats.add')"
		:cancel-label="$t('modal.stats.cancel')"
	>
		<section class="modal-card-body">
			<label class="checkbox">
				<div class="control">
					<input
						v-model="flag_sendstats"
						type="checkbox"
					>
					{{ $t('modal.profile.fields.flag_sendstats.label') }}
				</div>
			</label>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { DBUser } from '~/../kmserver-core/src/lib/types/database/user';
	import Modal from '~/components/Modal.vue';

	interface VState {
		flag_sendstats: boolean
	}

	export default Vue.extend({
		name: 'StatsModal',

		components: {
			Modal
		},

		props: {
			active: Boolean
		},

		data(): VState {
			return {
				flag_sendstats: true
			};
		},

		methods: {
			async submitForm(): Promise<void> {
				const user:DBUser = { ...this.$store.state.auth.user };
				user.flag_sendstats = this.flag_sendstats;
				const response = await this.$axios.put('/api/myaccount', user);
				await this.$auth.setUserToken(response.data.data.token);
				this.closeModal();
			},
			closeModal(): void {
				this.$emit('close');
			}
		}
	});
</script>
