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
		<div v-if="defaultLanguage && Object.keys(i18n).length > 0" class="field is-horizontal is-grouped is-grouped-centered">
			<label class="label">
				{{ $t('kara.import.default_language') }}
			</label>
			<div class="control">
				<div class="select">
					<select
						id="type"
						v-model="defaultLang"
						:required="true"
						name="type"
						autocomplete="off"
						@change="(event) => setDefaultLanguage(event.target.value)"
					>
						<option
							v-for="lang in listDefaultLanguagesAvailable()"
							:key="lang.value"
							:value="lang.value"
							:selected="defaultLang === lang.value"
						>
							{{ lang.label }} ({{ lang.value.toUpperCase() }})
						</option>
					</select>
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
		defaultLang?: string
	}

	export default Vue.extend({
		name: 'LanguagesList',

		props: {
			value: {
				type: Object,
				required: true
			} as PropOptions<Record<string, string>>,
			defaultLanguage: {
				type: String,
				required: false
			}
		},

		data(): VState {
			return {
				langFilter: '',
				i18n: this.value,
				inputToFocus: '',
				selectVisible: false,
				defaultLang: this.defaultLanguage
			};
		},

		computed: {
			getListLanguages(): Array<{ value: string, label: string }> {
				return this.listLanguages(this.langFilter);
			}
		},

		watch: {
			defaultLanguage(now) {
				if (now) {
					this.defaultLang = now;
				}
			}
		},

		methods: {
			listLanguages(lang: string): Array<{ value: string, label: string }> {
				return getListLanguagesInLocale((this.$auth.loggedIn && this.$auth.user.language) || this.$i18n.locale).filter(option => option.label.toString()
					.toLowerCase().includes(lang.toLowerCase()) ||
					option.value.toString()
						.toLowerCase().includes(lang.toLowerCase()));
			},
			listDefaultLanguagesAvailable() {
				return getListLanguagesInLocale((this.$auth.loggedIn && this.$auth.user.language) || this.$i18n.locale).filter(value => Object.keys(this.i18n).includes(value.value));
			},
			addLang(lang:{label:string, value: string}) {
				if (Object.keys(this.i18n).length === 0) {
					this.setDefaultLanguage(lang.value);
				}
				this.i18n[lang.value] = '';
				this.selectVisible = false;
				this.inputToFocus = lang.value;
			},
			removeLang(lang:string) {
				Vue.delete(this.i18n, lang);
				if (Object.keys(this.i18n).length > 0 && lang === this.defaultLang) {
					this.setDefaultLanguage(Object.keys(this.i18n)[0]);
				}
			},
			getLanguagesFromCode(code:string) {
				return getLanguagesInLocaleFromCode(code, (this.$auth.loggedIn && this.$auth.user.language) || this.$i18n.locale);
			},
			setValueLanguage() {
				this.$emit('change', this.i18n);
			},
			setDefaultLanguage(lang: string) {
				this.$emit('onDefaultLanguage', lang);
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
