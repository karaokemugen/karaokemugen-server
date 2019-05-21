import langs from 'langs';
import {getConfig} from '../_utils/config';
import {resolve} from 'path';
import {getLanguage} from 'iso-countries-languages';
import {selectTags} from '../_dao/tag';

export async function getTags(lang, filter, type, from = 0, size = 999999999999999) {
	let tags = await selectTags(filter, type, +from, +size);
	tags = await translateTags(tags, lang);
	return {
		content: tags,
		infos: {
			count: tags.length,
			from: +from,
			to: +from + tags.length
		}
	};
}


export function translateTags(taglist,lang) {
	const conf = getConfig();
	// If lang is not provided, assume we're using node's system locale
	if (!lang) lang = conf.EngineDefaultLocale;
	// Test if lang actually exists in ISO639-1 format
	if (!langs.has('1',lang)) throw `Unknown language : ${lang}`;
	// Instanciate a translation object for our needs with the correct language.
	const i18n = require('i18n'); // Needed for its own translation instance
	i18n.configure({
		directory: resolve(__dirname,'../_locales'),
	});
	i18n.setLocale(lang);
	// We need to read the detected locale in ISO639-1
	const detectedLocale = langs.where('1',lang);
	taglist.forEach((tag, index) => {
		if (tag.type >= 2 && tag.type <= 999 && tag.type !== 5) {
			if (tag.name.startsWith('TAG_') || tag.name.startsWith('TYPE_')) {
				taglist[index].name_i18n = i18n.__(tag.name);
			} else {
				taglist[index].name_i18n = tag.name;
			}
		}
		// Special case for languages
		if (tag.type === 5) {
			if (tag.name === 'und') {
				taglist[index].name_i18n = i18n.__('UNDEFINED_LANGUAGE');
			} else {
				// We need to convert ISO639-2B to ISO639-1 to get its language
				const langdata = langs.where('2B', tag.name);
				if (langdata === undefined) {
					taglist[index].name_i18n = i18n.__('UNKNOWN_LANGUAGE');
				} else {
					taglist[index].name_i18n = (getLanguage(detectedLocale[1],langdata[1]));
				}
			}
		}
	});
	return taglist;
}