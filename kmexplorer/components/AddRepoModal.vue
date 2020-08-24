<template>
	<div class="modal" :class="{'is-active': active}">
		<form action="#" @submit.prevent="submitForm">
			<div class="modal-background" @click="closeModal" />
			<div class="modal-card">
				<header>
					<div class="modal-card-head is-flex">
						{{ $t('modal.add_repository.label') }}
						<div><a class="delete" aria-label="close" @click="closeModal" /></div>
					</div>
				</header>
				<section class="modal-card-body">
					<label class="label">
						{{ $t('modal.add_repository.desc') }}
						<a :href="`https://mugen.karaokes.moe/${$i18n.locale === 'fre' ? '' : 'en/'}download.html`">
							{{ $t('modal.add_repository.download') }}
						</a>
					</label>
					<label class="label">
						<i18n path="modal.add_repository.manual" tag="label">
							<template v-slot:repository>
								<span class="boldLabel">{{ explorerHost }}</span>
							</template>
							<template v-slot:online>
								<span class="boldLabel">{{ $t('modal.add_repository.online') }}</span>
							</template>
						</i18n>
					</label>
				</section>
				<footer class="modal-card-foot">
					<button
						class="button is-success"
						type="submit"
					>
						{{ $t('modal.add_repository.add') }}
					</button>
					<button
						type="button"
						class="button"
						@click="closeModal"
					>
						{{ $t('modal.add_repository.cancel') }}
					</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';

	interface VState {
		explorerHost?: string
	}

	export default Vue.extend({
		name: 'AddRepoModal',

		props: {
			active: Boolean
		},

		data(): VState {
			return {
				explorerHost: process.env.EXPLORER_HOST
			};
		},

		methods: {
			submitForm(): void {
				window.open(`km://addRepo/${this.explorerHost}`);
				this.closeModal();
			},
			closeModal(): void {
				this.$emit('close');
			}
		}
	});
</script>

<style lang="scss" scoped>

	.label {
		font-weight: normal;
	}

	.modal-card-head {
		justify-content: space-between;
	}

	.boldLabel {
		font-weight: bold;
	}

</style>
