<template>
	<div class="is-ancestor">
		<div v-if="inboxCount" class="description notification is-info">
			<font-awesome-icon fixed-width :icon="['fas', 'circle-info']" />
			<i18n-t keypath="kara.import.quota_count">
				<template #count>
					<span class="has-text-weight-bold">{{ inboxCount }}</span>
				</template>
			</i18n-t>
		</div>
		<i18n-t keypath="kara.import.description" tag="div" class="description">
			<template #instance>
				<span>{{ url.hostname }}</span>
			</template>
		</i18n-t>
		<div class="description">
			<i18n-t keypath="kara.import.attention" class="attention" />
			<i18n-t keypath="kara.import.check_in_progress" />
		</div>
		<div class="description">
			<ul>
				<li v-if="manifest?.docsURL">
					<nuxt-link :href="manifest.docsURL">
						{{ $t('kara.import.documentation_link', { instance: url.hostname }) }}
					</nuxt-link>
				</li>
				<li v-if="config?.Frontend.InProgressSongsList">
					<nuxt-link :href="config?.Frontend.InProgressSongsList">
						{{ $t('kara.import.in_progress_link') }}
					</nuxt-link>
				</li>
			</ul>
		</div>
		<article v-if="manifest?.license" class="message is-info">
			<div class="message-header">
				<p>{{ $t('kara.import.license_reminder', { name: manifest.license }) }}</p>
			</div>
			<div class="message-body">
				<nuxt-link v-if="manifest.licenseURL" :href="manifest.licenseURL">
					{{ $t('kara.import.license_link') }}
				</nuxt-link>
			</div>
		</article>
		<div class="tile is-child is-8">
			<kara-edit :kara="kara" :repository-manifest="manifest" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { DBKara } from '%/lib/types/database/kara';
	import type { DBInbox } from '%/lib/types/inbox';
	import type { RepositoryManifestV2 } from '%/lib/types/repo';
	import { useConfigStore } from '~/store/config';

	const { config } = storeToRefs(useConfigStore());

	const route = useRoute();
	const { t } = useI18n();

	const url = useRequestURL();

	const kara = ref<DBKara>();
	const manifest = ref<RepositoryManifestV2>();
	const inboxCount = ref(0);

	if (config?.value && !config.value.Frontend.Import.Enabled) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Page Not Found'
		})
	}

	if (route.params?.id) {
		try {
			const data = await useCustomFetch<DBKara>(`/api/karas/${route.params.id}`);
			kara.value = data;
		} catch (e) {
			throw createError({ statusCode: 404, message: t('kara.notfound') });
		}
	}

	const data = await useCustomFetch<{ Manifest: RepositoryManifestV2 }>('/api/karas/repository');
	manifest.value = data.Manifest;

	if (config?.value && config.value.Frontend.Import.LoginNeeded && config.value.Frontend.Import.MaxPerUser) {
		const submissionInfo = await useCustomFetch<DBInbox[]>('/api/myaccount/inbox/submitted', {
			method: 'POST',
		});
		inboxCount.value = config.value.Frontend.Import.MaxPerUser - submissionInfo.filter(inbox => !inbox.fix).length;
		if (inboxCount.value === 0) {
			showError({
				statusCode: 403,
				statusMessage: t('kara.import.quota_reached')
			})
		}
	}
</script>

<style scoped lang="scss">
	.description {
		margin: 1em;
		font-size: medium;

		.attention {
			font-weight: bolder;
		}
	}

	.tile .is-child {
		transition: width 0.8s;
		max-width: 1000px;
	}

	.message.is-info {
		max-width: 50em;
	}
</style>
