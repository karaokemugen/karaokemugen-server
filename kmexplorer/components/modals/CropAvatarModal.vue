<template>
	<modal
		:active="active"
		:modal-title="$t('modal.crop_avatar.label')"
		:close="closeModal"
		:submit-action="uploadAvatar"
		:submit-label="$t('modal.crop_avatar.add')"
		:cancel-label="$t('modal.crop_avatar.cancel')"
	>
		<section class="modal-card-body">
			<client-only>
				<cropper
					ref="cropper"
					class="cropper"
					:src="avatar"
					:stencil-props="{
						aspectRatio: 1
					}"
				/>
			</client-only>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { Cropper } from 'vue-advanced-cropper';
	import 'vue-advanced-cropper/dist/style.css';
	import Modal from './Modal.vue';

	export default Vue.extend({
		name: 'CropAvatarModal',

		components: {
			Cropper,
			Modal
		},

		props: {
			avatar: {
				type: String,
				required: true
			},
			active: {
				type: Boolean,
				required: true
			}
		},

		methods: {
			closeModal(): void {
				this.$emit('close');
			},
			uploadAvatar(): void {
				const result = (this.$refs.cropper as any).getResult();
				this.$emit('uploadAvatar', result.canvas.toDataURL());
			}
		}
	});
</script>

<style lang="scss" scoped>
	.cropper {
		height: 40em;
	}
</style>
