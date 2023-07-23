import { getNavigatorLanguageIn3B } from './isoLanguages';
import { DBTag } from '%/lib/types/database/tag';
import { DBKara, DBKaraTag } from '%/lib/types/database/kara';
import { useMenubarStore } from '~/store/menubar';
import { tagTypes } from '~/assets/constants';
import { useLocalStorageStore } from '~/store/localStorage';
import { useAuthStore } from '~/store/auth';
import { storeToRefs } from 'pinia';

export function getPropertyInLanguage(prop: 'i18n', tag: DBKaraTag | DBTag, mainLanguage: string, fallbackLanguage: string, i18nParam?: any): string
export function getPropertyInLanguage(prop: 'description', tag: DBTag, mainLanguage: string, fallbackLanguage: string): string
export function getPropertyInLanguage(prop: 'description' | 'i18n', tag: DBKaraTag | DBTag, mainLanguage: string, fallbackLanguage: string, i18nParam?: any): string {
	// @ts-ignore: The overload will prevent DBKaraTag (without description) being passed to get descriptions
	const i18n = (i18nParam && i18nParam[tag.tid]) ? i18nParam[tag.tid] : tag[prop];
	if (i18n) {
		return i18n[mainLanguage]
			? i18n[mainLanguage]
			: (i18n[fallbackLanguage]
				? i18n[fallbackLanguage]
				: (i18n.eng ? i18n.eng : tag.name)
			);
	} else {
		return prop === 'i18n' ? tag.name : '';
	}
}

export function getTagInLocale(tag: DBKaraTag | DBTag, i18nParam?: any) {
	const { user } = storeToRefs(useAuthStore());
	if (user?.value && user?.value.main_series_lang && user?.value.fallback_series_lang) {
		return getPropertyInLanguage('i18n', tag, user?.value.main_series_lang, user?.value.fallback_series_lang, i18nParam);
	} else {
		return getPropertyInLanguage('i18n', tag, getNavigatorLanguageIn3B(), 'eng', i18nParam);
	}
}

export function getDescriptionInLocale(tag: DBTag) {
	const { user } = storeToRefs(useAuthStore());
	if (user?.value && user?.value.main_series_lang && user?.value.fallback_series_lang) {
		return getPropertyInLanguage('description', tag, user?.value.main_series_lang, user?.value.fallback_series_lang);
	} else {
		return getPropertyInLanguage('description', tag, getNavigatorLanguageIn3B(), 'eng');
	}
}

export function getTitleInLocale(titles: any, titles_default_language?:string) {
	const { user } = storeToRefs(useAuthStore());
	if (user?.value && user?.value.main_series_lang && user?.value.fallback_series_lang) {
		return titles[user?.value.main_series_lang]
			? titles[user?.value.main_series_lang]
			: (titles[user?.value.fallback_series_lang]
				? titles[user?.value.fallback_series_lang]
				: titles[titles_default_language || 'eng']
			);
	} else {
		return titles[getNavigatorLanguageIn3B()] ? titles[getNavigatorLanguageIn3B()] : titles[titles_default_language || 'eng'];
	}
}

export function buildKaraTitle(
	data: DBKara,
	i18nParam?: any,
	withoutLangs = false
): string {
	const isMulti = data?.langs?.find(e => e.name.includes('mul'));
	if (data?.langs && isMulti) {
		data.langs = [isMulti];
	}
	const serieText =
		data?.series?.length > 0
			? data.series
				.slice(0, 3)
				.map(e => getTagInLocale(e, i18nParam))
				.join(', ') + (data.series.length > 3 ? '...' : '')
			: data?.singergroups?.length > 0
				? data.singergroups
					.slice(0, 3)
					.map(e => getTagInLocale(e, i18nParam))
					.join(', ') + (data.singergroups.length > 3 ? '...' : '')
				: data?.singers?.length > 0
					? data.singers
						.slice(0, 3)
						.map(e => getTagInLocale(e, i18nParam))
						.join(', ') + (data.singers.length > 3 ? '...' : '')
					: ''; // wtf?
	const langsText = data?.langs
		?.map(e => e.name)
		.join(', ')
		.toUpperCase();
	const songtypeText = sortAndHideTags(data?.songtypes)
		.map(e => (e.short ? +e.short : e.name))
		.join(' ');
	const songorderText = data?.songorder > 0 ? ' ' + data.songorder : '';
	const versions = sortAndHideTags(data?.versions).map(t => `[${getTagInLocale(t, i18nParam)}]`);
	const version = versions?.length > 0 ? ` ${versions.join(' ')}` : '';
	return `${withoutLangs ? '' : `${langsText} - `}${serieText} - ${songtypeText} ${songorderText} - ${getTitleInLocale(
		data.titles,
		data.titles_default_language
	)} ${version}`;
}

export function sortTagByPriority(a: any, b: any) {
	return a.priority < b.priority ? 1 : a.name.localeCompare(b.name);
}

/**
 * Tags can have a -1 priority to be hidden from public, and -2 to be hidden everywhere
 * @param {Array} tags array of tags
 * @param {String} scope public or admin
 * @returns {Array} array of tags without hidden tags and sort
 */
export function sortAndHideTags(tags: any[]) {
	return tags?.length > 0
		? tags.filter(tag => tag.priority >= 0).sort(sortTagByPriority)
		: [];
}

// Generate a fake tag with tid
export function fakeYearTag(year: string, count?: number): DBTag {
	// That's really crappy, but at least the function will return the same tag tid
	const tagTid = `09b149df-dec1-${year}-9083-829000e60199`;
	return {
		name: year,
		short: year,
		tid: tagTid,
		types: [<any>0],
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

export function generateNavigation() {
	const { search, tags } = storeToRefs(useMenubarStore());
	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const navigation = {
		path: `/search/${encodeURIComponent(search.value)}`,
		query: { collections: encodeURIComponent(enabledCollections.value?.join(':')) } as { collections: string, q?: string }
	};
	const criterias: string[] = [];
	const tagsUpdated: string[] = [];
	for (const tag of tags.value) {
		if (tag.type === 'years') {
			criterias.push(`y:${tag.tag.name}`);
		} else {
			tagsUpdated.push(`${tag.tag.tid}~${tagTypes[tag.type].type}`);
		}
	}
	if (tagsUpdated.length > 0) {
		criterias.push(`t:${tagsUpdated.join(',')}`);
	}
	if (criterias.length > 0) {
		navigation.query.q = criterias.join('!');
	}
	return navigation;
}
