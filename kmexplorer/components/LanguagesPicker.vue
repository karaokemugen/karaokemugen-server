<template>
	<b-dropdown v-model="enabledLanguages" aria-role="list" multiple>
		<template #trigger="{ active }">
			<button class="button">
				<font-awesome-icon fixed-width :icon="['fas', active ? 'chevron-up':'chevron-down']" />
				{{ label }}
			</button>
		</template>
		<b-dropdown-item v-for="language in languages" :key="language" :value="language" aria-role="listitem">
			{{ getLanguagesFromCode(language) }}
		</b-dropdown-item>
	</b-dropdown>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { menuBarStore } from '~/store';
	import { getLanguagesInLocaleFromCode } from '~/utils/isoLanguages';

	interface VState {
		languages: string[]
	}

	export default Vue.extend({
		name: 'LanguagesPicker',

		props: {
			label: {
				type: String,
				required: true
			}
		},

		data(): VState {
			return {
				languages: []
			};
		},

		async fetch() {
			const languages = await this.$axios.$get('/api/suggestions/languages');
			this.languages = languages.filter((value:string) => value !== '');
		},

		computed: {
			enabledLanguages: {
				get(): string[] {
					return menuBarStore.enabledLanguages;
				},
				set(languages: string[]) {
					menuBarStore.setEnabledLanguages(languages);
				}
			}
		},

		methods: {
			getLanguagesFromCode(code:string) {
				return getLanguagesInLocaleFromCode(code);
			}
		}
	});
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
