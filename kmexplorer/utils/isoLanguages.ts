import i18nIsoLanguages from '@karaokemugen/i18n-iso-languages';
import en from '@karaokemugen/i18n-iso-languages/langs/en.json';
import fr from '@karaokemugen/i18n-iso-languages/langs/fr.json';
import id from '@karaokemugen/i18n-iso-languages/langs/id.json';
import de from '@karaokemugen/i18n-iso-languages/langs/de.json';
import pt from '@karaokemugen/i18n-iso-languages/langs/pt.json';

i18nIsoLanguages.registerLocale(en);
i18nIsoLanguages.registerLocale(fr);
i18nIsoLanguages.registerLocale(id);
i18nIsoLanguages.registerLocale(de);
i18nIsoLanguages.registerLocale(pt);

let navigatorLanguage: string;
if (process.client) {
	navigatorLanguage = navigator.languages[0].substring(0, 2);
}

export const langWithRomanization = [
	'amh', // amharic
	'ara', // arabic
	'arm', // armenian
	'bel', // belarusian
	'ben', // bengali
	'bul', // bulgarian
	'chi', // chinese
	'geo', // georgian
	'gre', // greek
	'guj', // gujarati
	'heb', // hebrew
	'hin', // hindi
	'ind', // indonesian
	'jpn', // japanese
	'kan', // kannada
	'khm', // kmher
	'kir', // kyrgyz
	'kor', // korean
	'mac', // macedonian
	'mal', // malayalam
	'mar', // marathi
	'mon', // mongolian
	'nep', // nepali
	'ori', // oriya
	'pan', // punjabi
	'per', // persian
	'pus', // pashto
	'rus', // russian
	'san', // sanskrit
	'srp', // serbian
	'tam', // tamil
	'tel', // telugu
	'tha', // thai
	'tib', // tibetan
	'tir', // tigrinya
	'tur', // turk
	'ukr', // ukrainian
	'urd', // urdu
	'vie' // vietnamese
];

export function getListLanguagesInLocale(userLang:string): Array<{ value: string, label: string }> {
	if (process.client) {
		return getAlpha3BLanguagesLocalized(userLang).map(lang => ({label: lang.name, value: lang.alpha3B}));
	}
	return [];
}

export function getLanguagesInLocaleFromCode(code: string, userLang:string) {
	return getLanguageName(code, userLang) || '';
}

export function getNavigatorLanguageIn3B(): string {
	return i18nIsoLanguages.alpha2ToAlpha3B(navigatorLanguage) || '';
}

export function getLocaleIn3B(userLang:string): string {
	return i18nIsoLanguages.alpha2ToAlpha3B(userLang) || '';
}

export function listLangs(name: string, userLang: string): string[] {
	return getAlpha3BLanguagesLocalized(userLang)
		.map(lang => lang.name)
		.filter(langName => langName.toLowerCase().includes(name.toLowerCase()));
}
export function get3BCode(language: string, userLang:string): string {
	return i18nIsoLanguages.getAlpha3BCode(language, userLang) as string || 
		i18nIsoLanguages.getAlpha3BCode(language, 'en') as string;
}

function getAlpha3BLanguagesLocalized(userLang: string): Array<{alpha3B: string, name: string}> {
	const alpha3BMap = i18nIsoLanguages.getAlpha3BCodes();
	return Object.keys(alpha3BMap).map(code => ({alpha3B: code,
		name: getLanguageName(code, userLang) || alpha3BMap[code]
	}))
}

const getLanguageName = (alpha2orAlpha3: string, lang: string) => i18nIsoLanguages.getName(alpha2orAlpha3, lang) || 
	i18nIsoLanguages.getName(alpha2orAlpha3, 'en');