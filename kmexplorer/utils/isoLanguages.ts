import { registerLocale, getNames, getAlpha3BCode, getName, alpha2ToAlpha3B } from '@karaokemugen/i18n-iso-languages';
import en from '@karaokemugen/i18n-iso-languages/langs/en.json';
import fr from '@karaokemugen/i18n-iso-languages/langs/fr.json';
import id from '@karaokemugen/i18n-iso-languages/langs/id.json';
import de from '@karaokemugen/i18n-iso-languages/langs/de.json';

registerLocale(en);
registerLocale(fr);
registerLocale(id);
registerLocale(de);

export const languagesSupport = ['en', 'fr', 'id', 'de'];
let langSupport: string;
let navigatorLanguage: string;
if (process.client) {
	navigatorLanguage = navigator.languages[0].substring(0, 2);
	langSupport = languagesSupport.includes(navigatorLanguage) ? navigatorLanguage : 'en';
}

export function getListLanguagesInLocale(): Array<{ value: string, label: string }> {
	const result = [];
	if (process.client) {
		const langs = Object.values(getNames(navigatorLanguage));
		for (const langInLocale of langs) {
			result.push({ value: getAlpha3BCode(langInLocale, navigatorLanguage) as string, label: langInLocale });
		}
	}
	return result;
}

export function getLanguagesInLocaleFromCode(code: string) {
	return getName(code, langSupport);
}

export function getNavigatorLanguageIn3B(): string {
	return alpha2ToAlpha3B(navigatorLanguage) as string;
}
