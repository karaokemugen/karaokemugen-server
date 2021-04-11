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
				<file-pond
					:label-idle="$t('modal.profile.select_avatar')"
					allow-image-preview="true"
					allow-image-transform="true"
					allow-image-crop="true"
					accepted-file-types="image/jpeg, image/png"
					:server="{ processFiles }"
					image-crop-aspect-ratio="1"
					instant-upload="false"
				/>
			</client-only>
		</section>
	</modal>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import vueFilePond from 'vue-filepond';
	import 'filepond/dist/filepond.min.css';
	import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';
	import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
	import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
	import FilePondPluginImageCrop from 'filepond-plugin-image-crop';
	import FilePondPluginImageTransform from 'filepond-plugin-image-transform';
	import { DBUser } from '%/lib/types/database/user';
	import Modal from '~/components/Modal.vue';

	const FilePond = vueFilePond(
		FilePondPluginFileValidateType,
		FilePondPluginImagePreview,
		FilePondPluginImageCrop,
		FilePondPluginImageTransform
	);

	export default Vue.extend({
		name: 'CropAvatarModal',

		components: {
			FilePond,
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

		data() {
			return {
				myFiles: [
					{
						source: `/avatars/${this.$props.user.avatar_file}`,
						options: {
							type: 'local'
						}
					}
				]
			};
		},

		methods: {
			closeModal(): void {
				this.$emit('close');
			},
			processFiles(filename:any, file:any, metadata:any, load:any) {
				load(file);
			}
		}
	});
</script>