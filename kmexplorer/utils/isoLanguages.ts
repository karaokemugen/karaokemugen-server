import { registerLocale, getNames, getAlpha3BCode, getName, alpha2ToAlpha3B } from '@karaokemugen/i18n-iso-languages';

registerLocale(require('@karaokemugen/i18n-iso-languages/langs/en.json'));
registerLocale(require('@karaokemugen/i18n-iso-languages/langs/fr.json'));

export const languagesSupport = ['en', 'fr'];
let langSupport: string;
let navigatorLanguage: string;
if (process.client) {
	navigatorLanguage = navigator.languages[0].substring(0, 2);
	langSupport = languagesSupport.includes(navigatorLanguage) ? navigatorLanguage : 'en';
}

export function getListLanguagesInLocale(): Array<{ value: string, label: string }> {
	const result = [];
	const langs = Object.values(getNames(navigatorLanguage));
	for (const langInLocale of langs) {
		result.push({ value: getAlpha3BCode(langInLocale, navigatorLanguage) as string, label: langInLocale });
	}
	return result;
}

export function getLanguagesInLocaleFromCode(code: string) {
	return getName(code, langSupport);
}

export function getNavigatorLanguageIn3B(): string {
	return alpha2ToAlpha3B(navigatorLanguage) as string;
}
