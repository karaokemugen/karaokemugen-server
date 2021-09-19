import languages from '@karaokemugen/i18n-iso-languages';

languages.registerLocale(require('@karaokemugen/i18n-iso-languages/langs/en.json'));
languages.registerLocale(require('@karaokemugen/i18n-iso-languages/langs/fr.json'));

export const languagesSupport = ['en', 'fr'];
let langSupport: string;
let navigatorLanguage: string;
if (process.client) {
	navigatorLanguage = navigator.languages[0].substring(0, 2);
	langSupport = languagesSupport.includes(navigatorLanguage) ? navigatorLanguage : 'en';
}

export function getListLanguagesInLocale(): Array<{ value: string, label: string }> {
	const result = [];
	const langs = Object.values(languages.getNames(navigatorLanguage));
	for (const langInLocale of langs) {
		result.push({ value: languages.getAlpha3BCode(langInLocale, navigatorLanguage) as string, label: langInLocale });
	}
	return result;
}

export function getLanguagesInLocaleFromCode(code: string) {
	return languages.getName(code, langSupport);
}

export function getNavigatorLanguageIn3B(): string {
	return languages.alpha2ToAlpha3B(navigatorLanguage) as string;
}