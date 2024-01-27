<template>
	<modal
		:active="active"
		:modal-title="$t('modal.set_banner.label')"
		:submit-label="$t('modal.set_banner.set')"
		:cancel-label="$t('modal.set_banner.cancel')"
		@close="closeModal"
		@submit="submitBanner(previews[img])"
	>
		<section class="modal-card-body">
			{{ $t('modal.set_banner.catch') }}
			<div class="image-chooser">
				<img
					class="pending-banner"
					:src="`${hardsubUrl}previews/${previews[img]}`"
					:alt="`Banner #${img + 1}`"
				>
				<div class="space-buttons">
					<button
						type="button"
						class="button is-info"
						:class="{'is-loading': loading}"
						:disabled="previews.length === 1 || loading"
						:title="previews.length === 1 ? $t('modal.set_banner.one'):$t('modal.set_banner.previous')"
						@click.prevent="cycleBanner(-1)"
					>
						<font-awesome-icon :icon="['fas', 'chevron-up']" />
					</button>
					<div class="dots">
						<span
							v-for="(_img, index) in previews"
							:key="index"
							class="dot"
							:class="{active: index === img}"
						>
							•
						</span>
					</div>
					<button
						type="button"
						class="button is-info"
						:class="{'is-loading': loading}"
						:disabled="previews.length === 1 || loading"
						:title="previews.length === 1 ? $t('modal.set_banner.one'):$t('modal.set_banner.next')"
						@click.prevent="cycleBanner(1)"
					>
						<font-awesome-icon :icon="['fas', 'chevron-down']" />
					</button>
				</div>
			</div>
		</section>
	</modal>
</template>

<script setup lang="ts">
	import Modal from './Modal.vue';
	import type { DBKara } from '%/lib/types/database/kara';
	import { useAuthStore } from '~/store/auth';


	const props = defineProps<{
		karaoke: DBKara
		active: boolean
	}>();

	const loading = ref(false);
	const img = ref(0);

	const emit = defineEmits<{(e: 'close'): void}>();

	const { setToken } = useAuthStore();

	const conf = useRuntimeConfig();
	const hardsubUrl = conf.public.HARDSUB_URL;

	const previews = computed (() => {
		const arr: string[] = [`${props.karaoke.kid}.${props.karaoke.mediasize}.25.jpg`];
		if (conf.public.SUPPORTED_AUDIO.some(extension => props.karaoke.mediafile.endsWith(extension))) {
			return arr;
		} else {
			return [
				...arr,
				`${props.karaoke.kid}.${props.karaoke.mediasize}.33.jpg`,
				`${props.karaoke.kid}.${props.karaoke.mediasize}.50.jpg`
			];
		}
	});

	function closeModal(): void {
		emit('close');
	}
	function submitBanner(img: string): void {
		if (loading.value) { return; }
		loading.value = true;
		useCustomFetch<{ code: string, data: { token: string } }>('/api/myaccount', {
			method: 'PATCH',
			body: {
				banner: img
			}
		}).then(async (response) => {
			// Refresh auth
			await setToken(response.data.token);
			closeModal();
		}).finally(() => {
			loading.value = false;
		});
	}
	function cycleBanner(step: number) {
		const computed = img.value + step;
		if (computed >= previews.value.length) {
			img.value = 0;
		} else if (computed < 0) {
			img.value = previews.value.length - 1;
		} else {
			img.value = computed;
		}
	}
</script>

<style scoped lang="scss">
	.image-chooser {
		display: flex;

		.space-buttons {
			display: flex;
			justify-content: space-between;
			align-items: center;
			flex-direction: column;
			.button.is-info {
				padding: calc(0.5em - 1px);
			}
			.dots {
				display: flex;
				flex-wrap: nowrap;
				flex-direction: column;
				.dot {
					color: grey;
					&.active {
						color: white;
					}
				}
			}
			padding-left: .5em;
		}
		.pending-banner {
			border-radius: 8px;
			min-width: 0;
			width: 100%;
			height: auto;
		}
	}
</style>
