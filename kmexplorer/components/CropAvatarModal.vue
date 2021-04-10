<template>
	<modal
		:active="active"
		:modal-title="$t('modal.crop_avatar.label')"
		:close="closeModal"
		:submit-label="$t('modal.crop_avatar.add')"
		:cancel-label="$t('modal.crop_avatar.cancel')"
	>
		<section class="modal-card-body">
			<client-only>
				<cropper
					class="cropper"
					:src="`/avatars/${user.avatar_file}`"
					@change="uploadAvatar"
				/>
			</client-only>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import { Cropper } from 'vue-advanced-cropper';
	import { DBUser } from '%/lib/types/database/user';
	import Modal from '~/components/Modal.vue';

	export default Vue.extend({
		name: 'CropAvatarModal',

		components: {
			Cropper,
			Modal
		},

		props: {
			user: {
				type: Object,
				required: true
			} as PropOptions<DBUser>,
			active: {
				type: Boolean,
				required: true
			}
		},

		methods: {
			closeModal(): void {
				this.$emit('close');
			},
			uploadAvatar({ coordinates, canvas }:any): void {
				// this.$emit('uploadAvatar', canvas.toDataURL());
			}
		}
	});
</script>

<style lang="scss" scoped>
	.cropper {
		height: 600px;
		background: #DDD;
	}
</style>
