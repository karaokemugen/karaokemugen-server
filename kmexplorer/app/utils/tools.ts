import { getBrowserLanguageIn3B } from './isoLanguages';
import type { DBTag } from '%/lib/types/database/tag';
import type { DBKara, DBKaraTag } from '%/lib/types/database/kara';
import { useMenubarStore, type TagExtend } from '~/store/menubar';
import { tagTypes, tagTypesMap } from '~/assets/constants';
import { useLocalStorageStore } from '~/store/localStorage';
import { useAuthStore } from '~/store/auth';
import { storeToRefs } from 'pinia';
import slug from 'slug';

export function getPropertyInLanguage(
	prop: 'i18n',
	tag: DBKaraTag | DBTag,
	mainLanguage: string,
	fallbackLanguage: string,
	i18nParam?: Record<string, string>,
): string;
export function getPropertyInLanguage(
	prop: 'description',
	tag: DBTag,
	mainLanguage: string,
	fallbackLanguage: string,
): string | null;
export function getPropertyInLanguage(
	prop: 'description' | 'i18n',
	tag: DBKaraTag | DBTag,
	mainLanguage: string,
	fallbackLanguage: string,
	i18nParam?: Record<string, string>,
): string | null {
	const i18n = i18nParam ? i18nParam : tag[prop];
	if (i18n) {
		return i18n[mainLanguage]
			? i18n[mainLanguage]
			: i18n[fallbackLanguage]
				? i18n[fallbackLanguage]
				: i18n.eng
					? i18n.eng
					: prop === 'description'
						? null
						: tag.name;
	} else {
		return prop === 'i18n' ? tag.name : '';
	}
}

export function getTagInLocale(tag: DBKaraTag | DBTag, i18nParam?: Record<string, string>) {
	const nuxt = useNuxtApp();
	const { user } = storeToRefs(useAuthStore());
	const tagLang =
		(tag as DBKaraTag).type_in_kara || (tag as DBTag).types
			? tagTypesMap[(tag as DBKaraTag).type_in_kara ? (tag as DBKaraTag).type_in_kara : (tag as DBTag).types[0]]
					.language
			: null;
	if (tagLang === 'user' && user?.value && user.value.language) {
		return getPropertyInLanguage(
			'i18n',
			tag,
			getLanguageIn3B(user.value.language),
			getBrowserLanguageIn3B(),
			i18nParam,
		);
	} else if (
		tagLang === 'song_name' &&
		user?.value &&
		user.value.main_series_lang &&
		user.value.fallback_series_lang
	) {
		return getPropertyInLanguage(
			'i18n',
			tag,
			user.value.main_series_lang,
			user.value.fallback_series_lang,
			i18nParam,
		);
	} else {
		return getPropertyInLanguage('i18n', tag, getLanguageIn3B(nuxt.$i18n.locale.value), getBrowserLanguageIn3B(), i18nParam);
	}
}

export function getDescriptionInLocale(tag: DBTag) {
	const nuxt = useNuxtApp();
	const { user } = storeToRefs(useAuthStore());
	if (user?.value && user?.value.language) {
		return getPropertyInLanguage(
			'description',
			tag,
			getLanguageIn3B(user.value.language),
			getBrowserLanguageIn3B(),
		);
	} else {
		return getPropertyInLanguage('description', tag, getLanguageIn3B(nuxt.$i18n.locale.value), getBrowserLanguageIn3B());
	}
}

export function getTitleInLocale(titles: Record<string, string>, titles_default_language?: string) {
	const nuxt = useNuxtApp();
	const { user } = storeToRefs(useAuthStore());
	if (user?.value && user?.value.main_series_lang && user?.value.fallback_series_lang) {
		return titles[user?.value.main_series_lang]
			? titles[user?.value.main_series_lang]
			: titles[user?.value.fallback_series_lang]
				? titles[user?.value.fallback_series_lang]
				: titles[titles_default_language || getBrowserLanguageIn3B()];
	} else {
		return titles[getLanguageIn3B(nuxt.$i18n.locale.value)]
			? titles[getLanguageIn3B(nuxt.$i18n.locale.value)]
			: titles[getBrowserLanguageIn3B()]
				? titles[getBrowserLanguageIn3B()]
				: titles[titles_default_language || 'eng'];
	}
}

export function buildKaraTitle(
	data: DBKara,
	i18nParam?: Record<string, Record<string, string>>,
	withoutLangs = false,
): string {
	const serieText =
		data.from_display_type && data[data.from_display_type]
			? data[data.from_display_type]
					.slice(0, 3)
					.map((e) => getTagInLocale(e, i18nParam && i18nParam[e.tid]))
					.join(', ') + (data[data.from_display_type].length > 3 ? '...' : '')
			: data?.series?.length > 0
				? data.series
						.slice(0, 3)
						.map((e) => getTagInLocale(e, i18nParam && i18nParam[e.tid]))
						.join(', ') + (data.series.length > 3 ? '...' : '')
				: data?.singergroups?.length > 0
					? data.singergroups
							.slice(0, 3)
							.map((e) => getTagInLocale(e, i18nParam && i18nParam[e.tid]))
							.join(', ') + (data.singergroups.length > 3 ? '...' : '')
					: data?.singers?.length > 0
						? data.singers
								.slice(0, 3)
								.map((e) => getTagInLocale(e, i18nParam && i18nParam[e.tid]))
								.join(', ') + (data.singers.length > 3 ? '...' : '')
						: ''; // wtf?
	const langsText = data?.langs
		?.map((e) => e.name)
		.join(', ')
		.toUpperCase();
	const songtypeText = sortAndHideTags(data?.songtypes)
		.map((e) => (e.short ? +e.short : e.name))
		.join(' ');
	const songorderText = data?.songorder > 0 ? ' ' + data.songorder : '';
	const versions = sortAndHideTags(data?.versions).map(
		(t) => `[${getTagInLocale(t, i18nParam && i18nParam[t.tid])}]`,
	);
	const version = versions?.length > 0 ? ` ${versions.join(' ')}` : '';
	return `${withoutLangs ? '' : `${langsText} - `}${serieText} - ${songtypeText} ${songorderText} - ${getTitleInLocale(
		data.titles,
		data.titles_default_language,
	)} ${version}`;
}

export function sortTagByPriority(a: any, b: any, reverse: boolean) {
	return (reverse ? a.priority < b.priority : a.priority > b.priority) ? 1 : a.name.localeCompare(b.name);
}

/**
 * Tags can have a -1 priority to be hidden from public, and -2 to be hidden everywhere
 * @param {Array} tags array of tags
 * @param {Boolean} reverse inverse sort of priority
 * @returns {Array} array of tags without hidden tags and sort
 */
export function sortAndHideTags(tags: any[], reverse: boolean = false) {
	return tags?.length > 0
		? tags.filter((tag) => tag.priority >= -1).sort((a, b) => sortTagByPriority(a, b, reverse))
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
			0: count || 0,
		},
	};
}

export function generateNavigation(
	search = useMenubarStore().search,
	tags = useMenubarStore().tags,
	page = '/search/',
	enabledCollections = useLocalStorageStore().enabledCollections,
) {
	const navigation = {
		path: `${page}${encodeURIComponent(search)}`,
		query: { collections: encodeURIComponent(enabledCollections?.join(':')) } as {
			collections: string;
			q?: string;
		},
	};
	const criterias: string[] = [];
	const tagsUpdated: string[] = [];
	for (const tag of uniqueTag(tags)) {
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

function uniqueTag(tags: TagExtend[]) {
	const tids = new Set();
	return tags.filter((tag) => {
		if (tids.has(tag.tag.tid)) {
			return false;
		}
		tids.add(tag.tag.tid);
		return true;
	});
}

export function getDurationString(duration: number, t: any, withSecondes = true) {
	const durationArray = getArrayDuration(duration);
	const returnString = [];
	if (durationArray[0] !== 0) {
		returnString.push(`${durationArray[0]} ${t('duration.days')}`);
	}
	if (durationArray[1] !== 0) {
		returnString.push(`${durationArray[1]} ${t('duration.hours')}`);
	}
	if (durationArray[2] !== 0) {
		returnString.push(`${durationArray[2]} ${t('duration.minutes')}`);
	}
	if (durationArray[3] !== 0 && withSecondes) {
		returnString.push(`${durationArray[3]} ${t('duration.seconds')}`);
	}
	return returnString.join(' ');
}

// FormatDateString From Duration in Seconds
function getArrayDuration(duration: any) {
	duration = parseInt(duration);
	if (typeof duration !== 'number') {
		throw new TypeError(`The parameter ${duration} is supposed to be a number!`);
	}
	if (Math.floor(duration) !== duration || duration <= 0) {
		throw new TypeError(`The parameter ${duration} is supposed to be positive integer`);
	}

	// calculate (and subtract) whole days
	const days = Math.floor(duration / 86400);
	duration -= days * 86400;

	// calculate (and subtract) whole hours
	const hours = Math.floor(duration / 3600) % 24;
	duration -= hours * 3600;

	// calculate (and subtract) whole minutes
	const minutes = Math.floor(duration / 60) % 60;
	duration -= minutes * 60;

	// what's left is seconds
	const seconds = duration % 60; // in theory the modulus is not required
	return [days, hours, minutes, seconds];
}

export function getSerieOrSingerGroupsOrSingers(
	karaoke: DBKara,
	karaokesI18n?: Record<string, Record<string, string>>,
) {
	if (
		karaoke.from_display_type &&
		karaoke[karaoke.from_display_type] &&
		karaoke[karaoke.from_display_type].length > 0
	) {
		return {
			name: getTagInLocale(
				karaoke[karaoke.from_display_type][0],
				karaokesI18n && karaokesI18n[karaoke[karaoke.from_display_type][0].tid],
			),
			slug: slug(karaoke[karaoke.from_display_type][0].name),
			type: karaoke.from_display_type,
			tag: karaoke[karaoke.from_display_type][0],
		};
	}
	if (karaoke.series[0]) {
		return {
			name: getTagInLocale(karaoke.series[0], karaokesI18n && karaokesI18n[karaoke.series[0].tid]),
			slug: slug(karaoke.series[0].name),
			type: 'series',
			tag: karaoke.series[0],
		};
	} else if (karaoke.singergroups[0]) {
		return {
			name: getTagInLocale(karaoke.singergroups[0], karaokesI18n && karaokesI18n[karaoke.singergroups[0].tid]),
			slug: slug(karaoke.singergroups[0].name),
			type: 'singergroups',
			tag: karaoke.singergroups[0],
		};
	} else if (karaoke.singers[0]) {
		return {
			name: getTagInLocale(karaoke.singers[0], karaokesI18n && karaokesI18n[karaoke.singers[0].tid]),
			slug: slug(karaoke.singers[0].name),
			type: 'singers',
			tag: karaoke.singers[0],
		};
	} else {
		// You never know~
		throw new TypeError('The karaoke does not have any series nor singers, wtf?');
	}
}
