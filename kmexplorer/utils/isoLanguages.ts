import { registerLocale, getNames, getAlpha3BCode, getName, alpha2ToAlpha3B } from '@karaokemugen/i18n-iso-languages';
import en from '@karaokemugen/i18n-iso-languages/langs/en.json';
import fr from '@karaokemugen/i18n-iso-languages/langs/fr.json';
import id from '@karaokemugen/i18n-iso-languages/langs/id.json';
import de from '@karaokemugen/i18n-iso-languages/langs/de.json';
import pt from '@karaokemugen/i18n-iso-languages/langs/pt.json';

registerLocale(en);
registerLocale(fr);
registerLocale(id);
registerLocale(de);
registerLocale(pt);

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
	const result = [];
	if (process.client) {
		const langs = Object.values(getNames(userLang));
		for (const langInLocale of langs) {
			result.push({ value: getAlpha3BCode(langInLocale, userLang) as string, label: langInLocale });
		}
	}
	return result;
}

export function getLanguagesInLocaleFromCode(code: string, userLang:string) {
	return getName(code, userLang);
}

export function getNavigatorLanguageIn3B(): string {
	return alpha2ToAlpha3B(navigatorLanguage) as string;
}
