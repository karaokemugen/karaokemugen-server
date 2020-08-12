import languages from '@cospired/i18n-iso-languages';
import { DBKaraTag } from '~/../kmserver-core/src/lib/types/database/kara';
import { User } from '~/../kmserver-core/src/lib/types/user';
import { DBTag } from '%/lib/types/database/tag';

let navigatorLanguage:string;
if (process.client) {
	navigatorLanguage = languages.alpha2ToAlpha3B(navigator.languages[0].substring(0, 2));
}

export function getTagInLanguage(tag: DBKaraTag | DBTag, mainLanguage: string, fallbackLanguage: string, i18nParam?: any) {
	const i18n = (i18nParam && i18nParam[tag.tid]) ? i18nParam[tag.tid] : tag.i18n;
	if (i18n) {
		return i18n[mainLanguage] ? i18n[mainLanguage]
			: (i18n[fallbackLanguage] ? i18n[fallbackLanguage] : tag.name);
	} else {
		return tag.name;
	}
}

export function getSerieLanguage(tag: DBKaraTag | DBTag, karaLanguage: string, user:User, i18nParam?: any) {
	let mode: number | undefined = user && user.series_lang_mode;
	if (!user || user.series_lang_mode === -1) {
		mode = 3;
	}

	if (mode === 0) {
		return tag.name;
	} else if (mode === 1) {
		return getTagInLanguage(tag, karaLanguage, 'eng', i18nParam);
	} else if (mode === 2 || mode === 3) {
		return getTagInLanguage(tag, navigatorLanguage, 'eng', i18nParam);
	} else if (mode === 4) {
		if (user && user.main_series_lang && user.fallback_series_lang) {
			return getTagInLanguage(tag, user.main_series_lang, user.fallback_series_lang, i18nParam);
		} else {
			return getTagInLanguage(tag, navigatorLanguage, 'eng', i18nParam);
		}
	} else { return tag.name; }
}
