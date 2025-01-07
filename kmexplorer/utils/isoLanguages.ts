import i18nIsoLanguages from '@karaokemugen/i18n-iso-languages';
import de from '@karaokemugen/i18n-iso-languages/langs/de.json';
import en from '@karaokemugen/i18n-iso-languages/langs/en.json';
import fr from '@karaokemugen/i18n-iso-languages/langs/fr.json';
import id from '@karaokemugen/i18n-iso-languages/langs/id.json';
import pt from '@karaokemugen/i18n-iso-languages/langs/pt.json';
import es from '@karaokemugen/i18n-iso-languages/langs/es.json';
import it from '@karaokemugen/i18n-iso-languages/langs/it.json';
import pl from '@karaokemugen/i18n-iso-languages/langs/pl.json';
import ta from '@karaokemugen/i18n-iso-languages/langs/ta.json';

i18nIsoLanguages.registerLocale(en);
i18nIsoLanguages.registerLocale(fr);
i18nIsoLanguages.registerLocale(id);
i18nIsoLanguages.registerLocale(de);
i18nIsoLanguages.registerLocale(pt);
i18nIsoLanguages.registerLocale(es);
i18nIsoLanguages.registerLocale(it);
i18nIsoLanguages.registerLocale(pl);
i18nIsoLanguages.registerLocale(ta);

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
	'vie', // vietnamese
];

export function getListLanguagesInLocale(userLang: string): Array<{ value: string; label: string }> {
	if (process.client) {
		return getAlpha3BLanguagesLocalized(userLang).map((lang) => ({ label: lang.name, value: lang.alpha3B }));
	}
	return [];
}

export function getLanguagesInLocaleFromCode(code: string, userLang: string) {
	return getLanguageName(code, userLang) || '';
}

export function getNavigatorLanguageIn3B(): string {
	return i18nIsoLanguages.alpha2ToAlpha3B(navigatorLanguage) || '';
}

export function getLanguageIn3B(code: string) {
	return i18nIsoLanguages.alpha2ToAlpha3B(code) || '';
}

export function listLangs(name: string, userLang: string): string[] {
	return getAlpha3BLanguagesLocalized(userLang)
		.map((lang) => lang.name)
		.filter((langName) => langName.toLowerCase().includes(name.toLowerCase()));
}
export function get3BCode(language: string, userLang: string): string {
	const nuxt = useNuxtApp();
	if (language === nuxt.$i18n.t('languages.qro')) return 'qro';
	return (
		(i18nIsoLanguages.getAlpha3BCode(language, userLang) as string) ||
		(i18nIsoLanguages.getAlpha3BCode(language, 'en') as string)
	);
}

function getAlpha3BLanguagesLocalized(userLang: string): Array<{ alpha3B: string; name: string }> {
	const nuxt = useNuxtApp();
	const alpha3BMap = i18nIsoLanguages.getAlpha3BCodes();
	const result = Object.keys(alpha3BMap).map((code) => ({
		alpha3B: code,
		name: getLanguageName(code, userLang) || alpha3BMap[code],
	}));
	result.push({ alpha3B: 'qro', name: nuxt.$i18n.t('languages.qro') });
	return result;
}

function getLanguageName(alpha2orAlpha3: string, lang: string) {
	const nuxt = useNuxtApp();
	if (alpha2orAlpha3 === 'qr' || alpha2orAlpha3 === 'qro') return nuxt.$i18n.t('languages.qro');
	return i18nIsoLanguages.getName(alpha2orAlpha3, lang) || i18nIsoLanguages.getName(alpha2orAlpha3, 'en');
}
