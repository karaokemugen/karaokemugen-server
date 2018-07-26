import {uuidRegexp, subFileRegexp, karaTypesArray, mediaFileRegexp, karaTypes} from './constants';
import {check, initValidators} from '../_utils/validators';
import {selectAllKaras} from '../_dao/kara';
import {getConfig} from '../_utils/config';
import langs from 'langs';
import {getLanguage} from 'iso-countries-languages';
import {resolve} from 'path';
import testJSON from 'is-valid-json';


export function formatKaraList(karaList, lang, from, count) {
	return {
		infos: {
			count: count,
			from: from,
			to: from + karaList.length
		},
		content: karaList
	};
}

export async function getAllKaras(filter, lang, from = 0, size = 99999999999, mode, modeValue) {
	try {
		const pl = await selectAllKaras(filter, lang, mode, modeValue);
		return formatKaraList(pl.slice(from, from + size), lang, from, pl.length);
	} catch(err) {
		throw err;
	}
}

export function translateKaraInfo(karalist, lang) {
	const conf = getConfig();
	// If lang is not provided, assume we're using node's system locale
	if (!lang) lang = conf.EngineDefaultLocale;
	// Test if lang actually exists in ISO639-1 format
	if (!langs.has('1',lang)) throw `Unknown language : ${lang}`;
	// Instanciate a translation object for our needs with the correct language.
	const i18n = require('i18n'); // Needed for its own translation instance
	i18n.configure({
		directory: resolve(__dirname,'../_common/locales'),
	});
	i18n.setLocale(lang);

	// We need to read the detected locale in ISO639-1
	const detectedLocale = langs.where('1',lang);
	// If the kara list provided is not an array (only a single karaoke)
	// Put it into an array first
	let karas;
	if (!Array.isArray(karalist)) {
		karas = [];
		karas[0] = karalist;
	} else {
		karas = karalist;
	}
	karas.forEach((kara,index) => {
		karas[index].songtype_i18n = i18n.__(kara.songtype);
		karas[index].songtype_i18n_short = i18n.__(kara.songtype+'_SHORT');

		if (kara.language != null) {
			const karalangs = kara.language.split(',');
			let languages = [];
			let langdata;
			karalangs.forEach(karalang => {
				// Special case : und
				// Undefined language
				// In this case we return something different.
				// Special case 2 : mul
				// mul is for multilanguages, when a karaoke has too many languages to list.
				switch (karalang) {
				case 'und':
					languages.push(i18n.__('UNDEFINED_LANGUAGE'));
					break;
				case 'mul':
					languages.push(i18n.__('MULTI_LANGUAGE'));
					break;
				default:
					// We need to convert ISO639-2B to ISO639-1 to get its language
					langdata = langs.where('2B',karalang);
					if (langdata === undefined) {
						languages.push(__('UNKNOWN_LANGUAGE'));
					} else {
						languages.push(getLanguage(detectedLocale[1],langdata[1]));
					}
					break;
				}
			});
			karas[index].language_i18n = languages.join();
		}
		// Let's do the same with tags, without language stuff
		if (kara.misc != null) {
			let tags = [];
			const karatags = kara.misc.split(',');
			karatags.forEach(function(karatag){
				tags.push(i18n.__(karatag));
			});
			karas[index].misc_i18n = tags.join();
		} else {
			karas[index].misc_i18n = null;
		}
		// We need to format the serie properly.
		if (kara.serie) {
			//Transform the i18n field we got from the database into an object.
			let seriei18n;
			if (kara.serie_i18n && kara.serie_i18n.length > 0 && testJSON(kara.serie_i18n)) {
				seriei18n = JSON.parse(kara.serie_i18n);
				karas[index].serie_i18n = {};
				const serieTrans = {};
				seriei18n.forEach((serieLang) => {
					serieTrans[serieLang.lang] = serieLang.name;
				});
				karas[index].serie_i18n = Object.assign(serieTrans);
			} else {
				karas[index].serie_i18n = {eng: kara.serie};
			}
		}
	});
	return karas;
}

export function serieRequired(karaType) {
	return karaType !== karaTypes.MV.type && karaType !== karaTypes.LIVE.type;
}

export function verifyKaraData(karaData) {
	const validationErrors = karaDataValidationErrors(karaData);
	if (validationErrors) {
		throw `Karaoke data is not valid: ${JSON.stringify(validationErrors)}`;
	}
}

export function karaDataValidationErrors(karaData) {
	initValidators();
	switch (karaData.version) {
	case 0:
	case 1:
	case 2:
		return check(karaData, karaConstraintsV2);
	default:
	case 3:
		return check(karaData, karaConstraintsV3);
	}
}

const karaConstraintsV3 = {
	mediafile: {
		presence: {allowEmpty: false},
		format: mediaFileRegexp
	},
	subfile: {
		presence: {allowEmpty: false},
		format: subFileRegexp
	},
	title: {presence: {allowEmpty: true}},
	type: {presence: true, inclusion: karaTypesArray},
	series: function(value, attributes) {
		if (!serieRequired(attributes['type'])) {
			return { presence: {allowEmpty: true} };
		} else {
			return { presence: {allowEmpty: false} };
		}
	},
	lang: {langValidator: true},
	order: {integerValidator: true},
	year: {integerValidator: true},
	KID: {presence: true, format: uuidRegexp},
	dateadded: {numericality: {onlyInteger: true, greaterThanOrEqualTo: 0}},
	datemodif: {numericality: {onlyInteger: true, greaterThanOrEqualTo: 0}},
	mediasize: {numericality: {onlyInteger: true, greaterThanOrEqualTo: 0}},
	mediagain: {numericality: true},
	mediaduration: {numericality: {onlyInteger: true, greaterThanOrEqualTo: 0}},
	version: {numericality: {onlyInteger: true, equality: 3}}
};

const karaConstraintsV2 = {
	videofile: {
		presence: {allowEmpty: false},
		format: mediaFileRegexp
	},
	subfile: {
		presence: {allowEmpty: false},
		format: subFileRegexp
	},
	title: {presence: {allowEmpty: true}},
	type: {presence: true, inclusion: karaTypesArray},
	series: function(value, attributes) {
		if (!serieRequired(attributes['type'])) {
			return { presence: {allowEmpty: true} };
		} else {
			return { presence: {allowEmpty: false} };
		}
	},
	lang: {langValidator: true},
	order: {integerValidator: true},
	year: {integerValidator: true},
	KID: {presence: true, format: uuidRegexp},
	dateadded: {numericality: {onlyInteger: true, greaterThanOrEqualTo: 0}},
	datemodif: {numericality: {onlyInteger: true, greaterThanOrEqualTo: 0}},
	videosize: {numericality: {onlyInteger: true, greaterThanOrEqualTo: 0}},
	videogain: {numericality: true},
	videoduration: {numericality: {onlyInteger: true, greaterThanOrEqualTo: 0}},
	version: {numericality: {onlyInteger: true, lowerThanOrEqualTo: 2}}
};
