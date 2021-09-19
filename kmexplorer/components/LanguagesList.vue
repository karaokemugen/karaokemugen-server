<template>
	<div>
		<div v-for="langKey in Object.keys(i18n)" :key="langKey" class="field is-horizontal has-addons is-grouped is-grouped-centered">
			<label class="label">
				{{ getLanguagesFromCode(langKey) }}
			</label>
			<div class="control">
				<input v-model="i18n[langKey]" class="input" type="text" @change="setValueLanguage">
			</div>
			<div class="control">
				<div class="button" :title="$t('kara.import.i18n_delete')" @click="() => removeLang(langKey)">
					<font-awesome-icon :icon="['fas', 'minus']" />
				</div>
			</div>
		</div>
		<div class="field is-horizontal is-grouped is-grouped-centered">
			<label class="label">
				{{ $t('kara.import.i18n_select') }}
			</label>
			<div class="control">
				<b-autocomplete
					v-if="selectVisible"
					v-model="langFilter"
					open-on-focus
					clear-on-select
					:data="getListLanguages"
					@select="addLang"
				>
					<template slot-scope="props">
						{{ props.option.label }} ({{ props.option.value.toUpperCase() }})
					</template>
				</b-autocomplete>
				<div v-if="!selectVisible" class="button tag is-small" @click="selectVisible = true">
					<font-awesome-icon :icon="['fas', 'plus']" />
					{{ $t('kara.import.add') }}
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import { getLanguagesInLocaleFromCode, getListLanguagesInLocale } from '../utils/isoLanguages';

	interface VState {
		langFilter: string,
		i18n: Record<string, string>,
		inputToFocus: string,
		selectVisible: boolean,
	}

	export default Vue.extend({
		name: 'LanguagesList',

		props: {
			value: {
				type: Object,
				required: true
			} as PropOptions<Record<string, string>>
		},

		data(): VState {
			return {
				langFilter: '',
				i18n: this.value,
				inputToFocus: '',
				selectVisible: false
			};
		},

		computed: {
			getListLanguages(): Array<{ value: string, label: string }> {
				return this.listLanguages(this.langFilter);
			}
		},

		methods: {
			listLanguages(lang: string): Array<{ value: string, label: string }> {
				return getListLanguagesInLocale().filter(option => option.label.toString()
					.toLowerCase().includes(lang.toLowerCase()) ||
					option.value.toString()
						.toLowerCase().includes(lang.toLowerCase()));
			},
			addLang(lang:{label:string, value: string}) {
				this.i18n[lang.value] = '';
				this.selectVisible = false;
				this.inputToFocus = lang.value;
			},
			removeLang(lang:string) {
				Vue.delete(this.i18n, lang);
			},
			getLanguagesFromCode(code:string) {
				return getLanguagesInLocaleFromCode(code);
			},
			setValueLanguage() {
				this.$emit('change', this.i18n);
			}
		}
	});
</script>

<style scoped lang="scss">
	.select select option {
		color: white;
	}

	.label {
		padding-top: 0.375em;
		margin-right: 1.5rem;
	}
</style>
