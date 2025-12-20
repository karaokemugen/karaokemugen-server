<template>
	<div>
		<div class="title-box">
			<h1 class="title with-button">
				<font-awesome-icon :icon="['fas', 'masks-theater']" fixed-width />
				{{ $t('profile.shared_favorites_number', favorites?.infos.count || 0) }}
			</h1>
		</div>
		<kara-list :karaokes="favorites" :playlists="[]" :loading="loading" :with-suggest=false />
	</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useConfigStore } from '~/store/config';
import type { KaraList } from '%/lib/types/kara';
import type { DBKara } from '%/lib/types/database/kara';


const favorites = ref<KaraList<DBKara>>({ infos: { count: 0, from: 0, to: 0 }, i18n: {}, avatars: {}, content: [] });

const { t } = useI18n();
const { config } = storeToRefs(useConfigStore());
const route = useRoute();
const loading = ref(false);

await fetch();

async function fetch() {
	if (config?.value && !config.value.Users.Enabled) {
		throw createError({ statusCode: 404 });
	}
	loading.value = true;
	const res = await useCustomFetch<KaraList<DBKara>>('/api/favorites/compare', {
		method: 'POST',
		body: {
			username1: route.query.username1,
			username2: route.query.username2,
		}
	}).catch((err) => {
		if (err?.response?.status === 403) {
			throw createError({ statusCode: 403, message: t('error.private_profile') });
		} else if (err?.response?.status === 404) {
			throw createError({ statusCode: 404 });
		}
		throw createError({ statusCode: 500 });
	});
	loading.value = false;
	favorites.value = res;
}

</script>

<style scoped lang="scss">
.title-box {
	display: flex;
	justify-content: flex-start;
	align-items: center;

	@media screen and (max-width: 769px) {
		flex-direction: column;
		align-items: flex-start;
	}
}

.title.with-button {
	padding: 1rem .5rem;
	margin-bottom: .5rem;
}
</style>
