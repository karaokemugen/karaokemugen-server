<template>
	<modal
		:active="active"
		:modal-title="$t('modal.stats.label')"
		:cancel-label="$t('modal.stats.no')"
		:submit-label="$t('modal.stats.yes')"
		@submit="authorizeStats"
		@cancel="refuseStats"
		@close="closeModal"
	>
		<section class="modal-card-body">
			<label class="label">
				{{ $t('modal.stats.desc') }}
			</label>
			<label class="label">
				{{ $t('modal.stats.refuse_desc') }}
			</label>
			<label class="label">
				{{ $t('modal.stats.change') }}
			</label>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue from 'vue';
	import Modal from './Modal.vue';
	import { DBUser } from '~/../kmserver-core/src/lib/types/database/user';

	export default Vue.extend({
		name: 'StatsModal',

		components: {
			Modal
		},

		props: {
			active: Boolean
		},

		methods: {
			async authorizeStats(): Promise<void> {
				await this.saveUser(true);
			},
			async refuseStats(): Promise<void> {
				await this.saveUser(false);
			},
			async saveUser(flag_sendstats: boolean): Promise<void> {
				const user:DBUser = { ...this.$store.state.auth.user };
				user.flag_sendstats = flag_sendstats;
				const response = await this.$axios.put('/api/myaccount', user);
				await this.$auth.setUserToken(response.data.data.token);
				this.$emit('close');
			},
			closeModal(): void {
				this.$emit('close');
			}
		}
	});
</script>
