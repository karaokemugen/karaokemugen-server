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
					:src="`/previews/${previews[img]}`"
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

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import Modal from './Modal.vue';
	import { DBKara } from '%/lib/types/database/kara';

	interface VState {
		loading: boolean,
		img: number
	}

	export default Vue.extend({
		name: 'BannerChangeModal',

		components: {
			Modal
		},

		props: {
			karaoke: {
				type: Object,
				required: true
			} as PropOptions<DBKara>,
			active: Boolean
		},

		data(): VState {
			return {
				loading: false,
				img: 0
			};
		},

		computed: {
			previews(): string[] {
				const arr: string[] = [`${this.karaoke.kid}.${this.karaoke.mediasize}.25.hd.jpg`];
				if (this.karaoke.mediafile.endsWith('.mp3')) {
					return arr;
				} else {
					return [
						...arr,
						`${this.karaoke.kid}.${this.karaoke.mediasize}.33.hd.jpg`,
						`${this.karaoke.kid}.${this.karaoke.mediasize}.50.hd.jpg`
					];
				}
			}
		},

		methods: {
			closeModal(): void {
				this.$emit('close');
			},
			submitBanner(img: string): void {
				if (this.loading) { return; }
				this.loading = true;
				this.$axios.$patch('/api/myaccount', {
					banner: img
				}).then(async (response) => {
					// Refresh auth
					await this.$auth.setUserToken(response.data.token);
					this.closeModal();
				}).finally(() => {
					this.loading = false;
				});
			},
			cycleBanner(step: number) {
				const computed = this.img + step;
				if (computed >= this.previews.length) {
					this.img = 0;
				} else if (computed < 0) {
					this.img = this.previews.length - 1;
				} else {
					this.img = computed;
				}
			}
		}
	});
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
