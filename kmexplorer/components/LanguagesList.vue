<template>
	<div>
		<div
			v-for="langKey in Object.keys(i18n)"
			:key="langKey"
			class="field is-horizontal has-addons is-grouped is-grouped-centered"
		>
			<label class="label">
				{{ getLanguagesFromCode(langKey) }}
			</label>
			<div class="control">
				<input
					:value="i18n[langKey]"
					class="input"
					type="text"
					@input="event => setValueLanguage(langKey, (event.target as HTMLInputElement)?.value)"
				>
			</div>
			<div class="control">
				<div
					class="button"
					:title="$t('kara.import.i18n_delete')"
					@click="() => removeLang(langKey)"
				>
					<font-awesome-icon :icon="['fas', 'minus']" />
				</div>
			</div>
		</div>
		<div
			v-if="!Object.keys(i18n).includes('qro') && langWithRomanization.some(v => Object.keys(i18n).includes(v))"
			class="field is-horizontal"
		>
			<div class="notification is-warning">
				{{ $t('kara.import.romanization_warning') }}
			</div>
		</div>
		<div class="field is-horizontal is-grouped ml-5">
			<label class="label">
				{{ $t('kara.import.i18n_select') }}
			</label>
			<div class="control">
				<o-autocomplete
					v-if="selectVisible"
					v-model="langFilter"
					open-on-focus
					clear-on-select
					:data="getListLanguages"
					@select="addLang"
				>
					<template #default="language">
						{{ language.option.label }} ({{ language.option.value.toUpperCase() }})
					</template>
				</o-autocomplete>
				<div
					v-if="!selectVisible"
					class="button tag is-small"
					@click="selectVisible = true"
				>
					<font-awesome-icon :icon="['fas', 'plus']" />
					{{ $t('kara.import.add') }}
				</div>
			</div>
		</div>
		<div
			v-if="defaultLanguage && Object.keys(i18n).length > 0"
			class="field is-horizontal is-grouped is-grouped-centered"
		>
			<label class="label">
				{{ $t('kara.import.default_language') }}
			</label>
			<div class="control">
				<div class="select">
					<select
						id="type"
						v-model="defaultLanguage"
						:required="true"
						name="type"
						autocomplete="off"
						@change="(event) => setDefaultLanguage((event.target as HTMLInputElement)?.value)"
					>
						<option
							v-for="lang in listDefaultLanguagesAvailable()"
							:key="lang.value"
							:value="lang.value"
							:selected="defaultLanguage === lang.value"
						>
							{{ lang.label }} ({{ lang.value.toUpperCase() }})
						</option>
					</select>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useAuthStore } from '~/store/auth';

	const props = defineProps<{
		value: Record<string, string>
		defaultLanguage?: string
	}>();

	const emit = defineEmits<{
		(e: 'change', value: Record<string, string>): void
		(e: 'onDefaultLanguage', value: string): void
	}>();

	const langFilter = ref('');
	const i18n = ref(props.value);
	const selectVisible = ref(false);
	const defaultLanguage = ref(props.defaultLanguage);

	const { locale } = useI18n();
	const { loggedIn, user } = storeToRefs(useAuthStore());

	const getListLanguages = computed(() => listLanguages(langFilter.value));

	watch([props], ([newProps]) => {
		if (newProps.defaultLanguage) {
			defaultLanguage.value = newProps.defaultLanguage;
		}
		if (props.value !== i18n.value) i18n.value = props.value;
	});

	function listLanguages(lang: string): Array<{ value: string, label: string }> {
		return getListLanguagesInLocale((loggedIn.value && user?.value?.language) || locale.value).filter(option => option.label.toString()
			.toLowerCase().includes(lang.toLowerCase()) ||
			option.value.toString()
				.toLowerCase().includes(lang.toLowerCase()));
	}
	function listDefaultLanguagesAvailable() {
		return getListLanguagesInLocale((loggedIn.value && user?.value?.language) || locale.value).filter(value => Object.keys(i18n.value).includes(value.value));
	}
	function addLang(lang:{label:string, value: string}) {
		if (Object.keys(i18n.value).length === 0 || lang.value === 'qro') {
			setDefaultLanguage(lang.value);
		}
		i18n.value[lang.value] = '';
		selectVisible.value = false;
	}
	function removeLang(lang:string) {
		delete i18n.value[lang];
		if (Object.keys(i18n.value).length > 0 && lang === defaultLanguage.value) {
			setDefaultLanguage(Object.keys(i18n.value)[0]);
		}
	}
	function getLanguagesFromCode(code:string) {
		return getLanguagesInLocaleFromCode(code, (loggedIn.value && user?.value?.language) || locale.value);
	}
	function setValueLanguage(langKey:string, value:string) {
		i18n.value[langKey] = value;
		emit('change', i18n.value);
	}
	function setDefaultLanguage(lang: string) {
		emit('onDefaultLanguage', lang);
	}
</script>

<style scoped lang="scss">
	.select select option {
		color: #dbdee0;
	}

	.label {
		padding-top: 0.375em;
		margin-right: 1.5rem;
	}
</style>
