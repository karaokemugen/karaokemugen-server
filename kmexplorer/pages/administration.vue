<template>
	<div class="is-flex">
		<button
			class="button"
			@click="updateGit"
		>
			<font-awesome-icon
				fixed-width
				:icon="['fab', 'git-alt']"
			/>
			{{ $t('administration.update_git') }}
		</button>
		<button
			class="button has-background-info"
			@click="generate"
		>
			<font-awesome-icon
				fixed-width
				:icon="['fas', 'database']"
			/>
			{{ $t('administration.generate_database') }}
		</button>
		<button
			class="button"
			@click="generatePreviews"
		>
			<font-awesome-icon
				fixed-width
				:icon="['fas', 'images']"
			/>
			{{ $t('administration.generate_previews') }}
		</button>
		<button
			v-if="config?.Hardsub.Enabled"
			class="button"
			@click="generateHardsubs"
		>
			<font-awesome-icon
				fixed-width
				:icon="['fas', 'file-video']"
			/>
			{{ $t('administration.generate_hardsubs') }}
		</button>
	</div>
</template>

<script setup lang="ts">
	import * as Toast from 'vue-toastification';
	import { useConfigStore } from '~/store/config';

	// @ts-expect-error vue-toastification is not typed
	const useToast = Toast.useToast ?? Toast.default.useToast;

	const { t } = useI18n();
	const toast = useToast();
	const { config } = storeToRefs(useConfigStore());

	async function updateGit() {
		await useCustomFetch('/api/git/update', { method: 'POST' });
		toast.success(t('administration.update_git_triggered'));
	}

	async function generate() {
		await useCustomFetch('/api/generate', { method: 'POST' });
		toast.success(t('administration.generation_triggered'));
	}

	async function generatePreviews() {
		await useCustomFetch('/api/previews/generate', { method: 'POST' });
		toast.success(t('administration.generation_triggered'));
	}

	async function generateHardsubs() {
		await useCustomFetch('/api/hardsubs/generate', { method: 'POST' });
		toast.success(t('administration.generation_triggered'));
	}

</script>

<style lang="scss">
	.is-flex {
		gap: 0.5em;	
	}
</style>
