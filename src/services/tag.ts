import langs from 'langs';
import {join} from 'path';
import {getSupportedLangs, getLanguage} from 'iso-countries-languages';
import {selectTags} from '../dao/tag';
import { KaraList } from '../lib/types/kara';

export async function getTags(filter: string, type: string, from = 0, size = 0): Promise<KaraList> {
	let tags = await selectTags(filter, type, +from, +size);
	tags = await translateTags(tags);
	return {
		content: tags,
		infos: {
			count: tags.length,
			from: +from,
			to: +from + tags.length
		}
	};
}


export function translateTags(taglist: any[]) {
	const translations = require(join(__dirname,'../locales/'));
	// We need to read the detected locale in ISO639-1
	taglist.forEach((tag, index) => {
		let i18nString: string;
		if (tag.type === 5) {
			const langdata = langs.where('2B', tag.name);
			if (!langdata) i18nString = 'UNKNOWN_LANGUAGE';
			if (tag.name === 'und') i18nString = 'UNDEFINED_LANGUAGE';
			if (tag.name === 'zxx') i18nString = 'NO_LANGUAGE';
			if (i18nString) {
				for (const language of Object.keys(translations)) {
					taglist[index].i18n[language] = translations[language][i18nString];
				}
			} else {
				for (const lang of getSupportedLangs()) {
					taglist[index].i18n[lang] = getLanguage(lang, langdata[1]);
				}
			}
		}
	});
	return taglist;
}