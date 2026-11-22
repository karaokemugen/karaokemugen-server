<template>
    <label
        v-if="canEditPlaylist"
        :class="classProps"
    >
        {{ $t('playlists.add_karaoke') }}
        <ui-combobox
			v-model:model="model"
			v-model:filter="filter"
            :items="karaSearch"
            height="200px"
			:delete-button="false"
			:clear-on-focus="true"
        />
    </label>
</template>

<script setup lang="ts">
import type { DBPLC } from '%/lib/types/database/playlist';
import type { KaraList } from '%/lib/types/kara';
import _ from 'lodash';

const props = defineProps<{
	canEditPlaylist?: boolean,
    classProps: string
    select: (event: { label: string; value: string }) => void
}>();

const model = ref<{label: string, value: string}>();
const filter = ref('');
const karaSearch = ref<{ label: string; value: string }[]>([]);

watch(filter, () => debouncedGetAsyncData(filter.value));
watch(model, () => {
	props.select(model.value as {label: string, value: string});
});

const debouncedGetAsyncData = _.debounce(getAsyncData, 500, { leading: true, trailing: true, maxWait: 750 });

async function getAsyncData(val: string) {
	const res = await useCustomFetch<KaraList>('/api/karas/search',
		{
			params: {
				filter: val,
				size: 50,
				ignoreCollections: true
			}
		});
	if (res.content) {
		karaSearch.value = res.content
			.map((k: DBPLC) => {
				return {
					label: buildKaraTitle(k, res.i18n),
					value: k.kid,
				};
			});
	}
}

</script>