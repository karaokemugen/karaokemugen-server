<template>
	<div class="is-ancestor">
		<i18n-t
			keypath="kara.import.description"
			tag="div"
			class="description"
		/>
		<div class="description">
			<i18n-t
				keypath="kara.import.attention"
				class="attention"
			/>
			<i18n-t keypath="kara.import.check_in_progress" />
		</div>
		<div class="description">
			<ul>
				<li v-if="manifest?.docsURL">
					<nuxt-link :href="manifest.docsURL">
						{{ $t('kara.import.documentation_link', { instance: instanceName }) }}
					</nuxt-link>
				</li>
				<li v-if="in_progress_songs_list">
					<nuxt-link
						:href="in_progress_songs_list"
					>
						{{ $t('kara.import.in_progress_link') }}
					</nuxt-link>
				</li>
			</ul>
		</div>
		<article
			v-if="manifest?.license"
			class="message is-info"
		>
			<div class="message-header">
				<p>{{ $t('kara.import.license_reminder', { name: manifest.license }) }}</p>
			</div>
			<div class="message-body">
				<nuxt-link
					v-if="manifest.licenseURL"
					:href="manifest.licenseURL"
				>
					{{ $t('kara.import.license_link') }}
				</nuxt-link>
			</div>
		</article>
		<div class="is-8">
			<kara-edit
				:kara="kara"
				:repository-manifest="manifest"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { DBKara } from '%/lib/types/database/kara';
	import type { RepositoryManifestV2 } from '%/lib/types/repo';

	const config = useRuntimeConfig();
	const route = useRoute();
	const { t } = useI18n();

	const conf = useRuntimeConfig();
	const in_progress_songs_list = config.public.IN_PROGRESS_SONGS_LIST;
	const instanceName = conf.public.INSTANCE_NAME;
	const kara = ref<DBKara>();
	const manifest = ref<RepositoryManifestV2>();

	definePageMeta({
		validate: async () => {
			const config = useRuntimeConfig();
			return (config.public.KM_IMPORT as unknown as boolean);
		}
	});

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
</script>

<style scoped lang="scss">
	.description {
		margin: 1em;
		font-size: medium;

		.attention {
			font-weight: bolder;
		}
	}

	.box {
		transition: width 0.8s;
		max-width: 1000px;
	}

	.is-info {
		max-width: 50em;
	}
</style>
