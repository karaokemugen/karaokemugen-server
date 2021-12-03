<template>
	<modal
		:active="active"
		:modal-title="$t('modal.crop.label')"
		:submit-label="$t('modal.crop.add')"
		:cancel-label="$t('modal.crop.cancel')"
		@submit="upload"
		@close="closeModal"
	>
		<section class="modal-card-body">
			<client-only>
				<cropper
					ref="cropper"
					class="cropper"
					:src="image"
					:stencil-props="{
						aspectRatio: ratio
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
			image: {
				type: String,
				required: true
			},
			active: {
				type: Boolean,
				required: true
			},
			type: {
				type: String,
				default: 'avatar'
			},
			ratio: {
				type: Number,
				default: 1
			}
		},

		methods: {
			closeModal(): void {
				this.$emit('close');
			},
			upload(): void {
				const result = (this.$refs.cropper as any).getResult();
				this.$emit('upload', result.canvas.toDataURL());
			}
		}
	});
</script>

<style lang="scss" scoped>
	.cropper {
		height: 40em;
	}
</style>
