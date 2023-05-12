<template>
	<o-dropdown
		v-model="enabledLanguagesModel"
		aria-role="list"
		multiple
		scrollable
	>
		<template #trigger="{ active }">
			<button class="button">
				<font-awesome-icon
					fixed-width
					:icon="['fas', active ? 'chevron-up':'chevron-down']"
				/>
				{{ label }}
			</button>
		</template>
		<o-dropdown-item
			v-for="language in languages"
			:key="language"
			:value="language"
			aria-role="listitem"
		>
			{{ getLanguagesFromCode(language) }}
		</o-dropdown-item>
	</o-dropdown>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useAuthStore } from '~/store/auth';
	import { useMenubarStore } from '~/store/menubar';

	defineProps<{
		label: string
	}>();

	const languages = ref<string[]>([]);

	const { locale } = useI18n();

	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { enabledLanguages } = storeToRefs(useMenubarStore());
	const { setEnabledLanguages } = useMenubarStore();

	await fetch();

	async function fetch() {
		const res = await useCustomFetch<string[]>('/api/suggestions/languages');
		languages.value = res.filter((value:string) => value !== '');
	}

	const enabledLanguagesModel = computed({
		get(): string[] {
			return enabledLanguages.value;
		},
		set(languages: string[]) {
			setEnabledLanguages(languages);
		}
	});

	function getLanguagesFromCode(code:string) {
		return getLanguagesInLocaleFromCode(code, (loggedIn.value && user?.value?.language) || locale.value);
	}
</script>

<style scoped>

.dropdown-content > p {
	padding: .5em 1em;
	min-width: 18em;
}
.dropdown-item {
	font-size: 0.9rem;
}
</style>
