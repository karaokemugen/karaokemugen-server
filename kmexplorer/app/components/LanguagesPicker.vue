<template>
	<ui-select
		v-if="languages.length > 0"
		v-model:model="enabledLanguagesList"
		:button-label="$t('search.types.languages')"
		:items="languages"
		height='200px'
		:is-check="(item: string) => enabledLanguages.includes(item)"
	/>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/auth';
import { useMenubarStore } from '~/store/menubar';

const languages = ref<{ label: string; value: string; }[]>([]);
const enabledLanguagesList = ref<{ label: string; value: string; }[]>([]);

const { locale } = useI18n();

const { loggedIn, user } = storeToRefs(useAuthStore());
const { enabledLanguages } = storeToRefs(useMenubarStore());
const { setEnabledLanguages } = useMenubarStore();

watch(enabledLanguagesList, () => setEnabledLanguages(enabledLanguagesList.value.map(l => l.value)));

async function fetch() {
	const res = await useCustomFetch<string[]>('/api/suggestions/languages');
	languages.value = res.filter((value:string) => value !== '').map((l: string) => {
		return {label: getLanguagesInLocaleFromCode(l, (loggedIn.value && user?.value?.language) || locale.value), value: l}
	});
	enabledLanguagesList.value = languages.value.filter(c => enabledLanguages.value.includes(c.value));
}

fetch();
</script>