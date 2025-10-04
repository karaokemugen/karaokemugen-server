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
					ref="cropperElement"
					class="cropperElement"
					:src="image"
					:stencil-props="{
						aspectRatio: ratio
					}"
				/>
			</client-only>
		</section>
	</modal>
</template>

<script setup lang="ts">
	import { Cropper } from 'vue-advanced-cropper';
	import 'vue-advanced-cropper/dist/style.css';

	withDefaults(defineProps<{
		image: string
		active: boolean
		type?: string
		ratio?: number
	}>(), {
		type: 'avatar',
		ratio: 1
	});

	const cropperElement = ref<{getResult: Function}>();

	const emit = defineEmits<{
		(e: 'close'): void
		(e: 'upload', value?: string): void
	}>();

	function closeModal(): void {
		emit('close');
	}
	function upload(): void {
		const result = cropperElement.value?.getResult();
		emit('upload', result.canvas.toDataURL());
	}
</script>

<style lang="scss" scoped>
	.cropper {
		height: 40em;
	}
</style>
