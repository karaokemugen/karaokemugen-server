import languages from '@cospired/i18n-iso-languages';
import { User } from '~/../kmserver-core/src/lib/types/user';
import { DBTag } from '%/lib/types/database/tag';
import { DBKara, DBKaraTag } from '%/lib/types/database/kara';
import { Tag } from '%/lib/types/tag';
import menubar from '~/store/menubar';
import { tagTypes } from '~/assets/constants';

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

// Generate a fake tag with tid
export function fakeYearTag(year: string, count?: number): Tag {
	// That's really crappy, but at least the function will return the same tag tid
	const tagTid = `09b149df-dec1-${year}-9083-829000e60199`;
	return {
		name: year,
		short: year,
		tid: tagTid,
		types: [0],
		i18n: {},
		karacount: {
			0: count || 0
		}
	};
}

export function sortTypesKara(karaoke: DBKara): DBKara {
	// Sorting algorithm, as suggested in https://discord.com/channels/84245347336982528/324208228680466434/730387614460543016
	const high_prio: DBKaraTag[] = [];
	const std_prio: DBKaraTag[] = [];
	const low_prio: DBKaraTag[] = [];
	for (const songtype of karaoke.songtypes) {
		// Opening, Ending, MV, Insert
		if (['f02ad9b3-0bd9-4aad-85b3-9976739ba0e4',
			'38c77c56-2b95-4040-b676-0994a8cb0597',
			'7be1b15c-cff8-4b37-a649-5c90f3d569a9',
			'5e5250d9-351a-4a82-98eb-55db50ad8962'].includes(songtype.tid)) {
			high_prio.push(songtype);
		// Audio, Other
		} else if (['97769615-a2e5-4f36-8c23-b2ce2ce3c460',
			'42a262ae-acba-4ab5-a446-c5789c96c821'].includes(songtype.tid)) {
			low_prio.push(songtype);
		// All others
		} else {
			std_prio.push(songtype);
		}
	}
	karaoke.songtypes = [...high_prio, ...std_prio, ...low_prio];
	return karaoke;
}

export function generateNavigation(menuBarStore: menubar) {
	const navigation = { path: `/search/${encodeURIComponent(menuBarStore.search)}`, query: {} as { q?: string } };
	const criterias: string[] = [];
	const tags: string[] = [];
	for (const tag of menuBarStore.tags) {
		if (tag.type === 'years') {
			criterias.push(`y:${tag.tag.name}`);
		} else {
			tags.push(`${tag.tag.tid}~${tagTypes[tag.type].type}`);
		}
	}
	if (tags.length > 0) {
		criterias.push(`t:${tags.join(',')}`);
	}
	if (criterias.length > 0) {
		navigation.query.q = criterias.join('!');
	}
	return navigation;
}
