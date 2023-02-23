import { alpha2ToAlpha3B, getAlpha3BCodes, getName, registerLocale } from '@karaokemugen/i18n-iso-languages';
import de from '@karaokemugen/i18n-iso-languages/langs/de.json';
import en from '@karaokemugen/i18n-iso-languages/langs/en.json';
import fr from '@karaokemugen/i18n-iso-languages/langs/fr.json';
import id from '@karaokemugen/i18n-iso-languages/langs/id.json';
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
	if (process.client) {
		const langMap = getAlpha3BCodes();
		const langs = Object.keys(langMap).map((lang3BCode) => ({
			value: lang3BCode,
			label: getName(lang3BCode, userLang) 
				|| langMap[lang3BCode], // fallback to primary language
		}));
		return langs;
	}
	return [];
}

export function getLanguagesInLocaleFromCode(code: string, userLang:string) {
	return getName(code, userLang);
}

export function getNavigatorLanguageIn3B(): string {
	return alpha2ToAlpha3B(navigatorLanguage) as string;
}
