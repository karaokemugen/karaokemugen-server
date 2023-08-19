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
				<li>
					<nuxt-link href="https://docs.karaokes.moe">
						{{ $t('kara.import.documentation_link') }}
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
			v-if="base_license_name"
			class="message is-info"
		>
			<div class="message-header">
				<p>{{ $t('kara.import.license_reminder', {name: base_license_name}) }}</p>
			</div>
			<div class="message-body">
				<nuxt-link
					v-if="base_license_link"
					:href="base_license_link"
				>
					{{ $t('kara.import.license_link') }}
				</nuxt-link>
			</div>
		</article>
		<div class="tile is-child is-8">
			<kara-edit :kara="kara" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { DBKara } from '%/lib/types/database/kara';

	const config = useRuntimeConfig();
	const route = useRoute();
	const { t } = useI18n();

	const base_license_name = ref(config.public.BASE_LICENSE_NAME);
	const base_license_link = ref(config.public.BASE_LICENSE_LINK);
	const in_progress_songs_list = ref(config.public.IN_PROGRESS_SONGS_LIST);
	const kara = ref<DBKara>();

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

	.is-info {
		max-width: 50em;
	}
</style>
