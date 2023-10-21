<template>
	<div
		class="modal"
		:class="{ 'is-active': active }"
	>
		<form
			action="#"
			@submit.prevent="submitForm"
		>
			<div
				class="modal-background"
				@click.prevent="cancel"
			/>
			<div class="modal-card">
				<header class="modal-card-head">
					<p class="modal-card-title">
						{{
							$t(playlist.plaid ?
								'modal.create_edit_playlist.title_edit' :
								'modal.create_edit_playlist.title_create')
						}}
					</p>
					<button
						class="delete"
						aria-label="close"
						@click="cancel"
					/>
				</header>
				<section class="modal-card-body">
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="name"
								class="label"
							>{{ $t('modal.create_edit_playlist.name') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="name"
										v-model="playlist.name"
										type="text"
										name="name"
										class="input"
										required
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="playlist.plaid"
						class="field is-horizontal"
					>
						<div class="field-label is-normal">
							<label class="label">{{ $t('modal.create_edit_playlist.contributors') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<editable-user-group
										:plaid="playlist.plaid"
										:params="playlist.contributors || []"
										@change="(contributors) => playlist.contributors = contributors"
									/>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="description"
								class="label"
							>{{ $t('modal.create_edit_playlist.description') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="description"
										v-model="playlist.description"
										type="text"
										name="description"
										class="input"
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label
								for="flag_visible_online	"
								class="label"
							>{{ $t('modal.create_edit_playlist.public') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="flag_visible_online"
										v-model="playlist.flag_visible_online"
										type="checkbox"
										name="name"
									>
								</div>
							</div>
						</div>
					</div>
				</section>
				<footer class="modal-card-foot">
					<button
						class="button is-success"
						:class="{ 'is-loading': loading }"
						type="submit"
					>
						{{
							$t(playlist.plaid ?
								'modal.create_edit_playlist.submit_edit' :
								'modal.create_edit_playlist.submit_create')
						}}
					</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import type { DBPL } from 'kmserver-core/src/types/database/playlist';
	import { useAuthStore } from '~/store/auth';
	import { useModalStore } from '~/store/modal';

	const props = defineProps<{
		active: boolean
		slug?: string
	}>();

	const { user } = storeToRefs(useAuthStore());

	const loading = ref(false);
	const playlist = ref<DBPL>({
		name: '',
		description: '',
		contributors: [],
		flag_visible: true,
		flag_visible_online: true
	});

	const emit = defineEmits<{ (e: 'close', pl?: DBPL): void }>();

	const { closeModal } = useModalStore();

	watch(() => props.active, (now) => {
		if (now && props.slug) getPlaylist();
	});

	async function getPlaylist() {
		const playlists = await useCustomFetch<DBPL[]>('/api/playlist', {
			params: {
				username: user?.value?.login,
				slug: props.slug
			}
		});
		if (playlists.length > 0) playlist.value = playlists[0];
	}

	function cancel(): void {
		closeModal('createEditPlaylist');
	}
	async function submitForm() {
		if (playlist.value.name) {
			loading.value = true;
			try {
				const res = await useCustomFetch<DBPL>(`/api/playlist${props.slug ? `/${playlist.value.plaid}` : ''}`, {
					method: props.slug ? 'PUT' : 'POST',
					body: playlist.value
				});
				playlist.value = {
					name: '',
					description: '',
					contributors: [],
					flag_visible: true,
					flag_visible_online: true
				};
				emit('close', res);
			} finally {
				loading.value = false;
			}
		}
	}
</script>

<style scoped lang="scss">
	.field-label {
		flex-grow: 2;
	}

	input[type="checkbox"] {
		margin-top: 0.75em;
	}

	.field:has(*:required) .label::before {
		content: '* ';
		color: red;
	}

	.select select option {
		color: white;
	}
</style>
