import {uuidRegexp, subFileRegexp, karaTypesArray, mediaFileRegexp, karaTypes} from './constants';
import {check, initValidators} from '../_utils/validators';
import {countKaras, selectAllKaras, selectAllYears, selectBaseStats} from '../_dao/kara';
import timestamp from 'unix-timestamp';
import uuidV4 from 'uuid/v4';

export function getBaseStats() {
	return selectBaseStats();
}

export function formatKara(karaData) {
	timestamp.round = true;
	return {
		mediafile: karaData.mediafile || '',
		subfile: karaData.subfile || 'dummy.ass',
		subchecksum: karaData.subchecksum || '',
		title: karaData.title || '',
		series: karaData.series || '',
		type: karaData.type || '',
		order: karaData.order || '',
		year: karaData.year || '',
		singer: karaData.singer || '',
		tags: karaData.tags || '',
		groups: karaData.groups || '',
		songwriter: karaData.songwriter || '',
		creator: karaData.creator || '',
		author: karaData.author || '',
		lang: karaData.lang || 'und',
		KID: karaData.KID || uuidV4(),
		dateadded: karaData.dateadded || timestamp.now(),
		datemodif: karaData.datemodif || timestamp.now(),
		mediasize: karaData.mediasize || 0,
		mediagain: karaData.mediagain || 0,
		mediaduration: karaData.mediaduration || 0,
		version: karaData.version || 3
	};
}

export function formatKaraList(karaList, from, count) {
	return {
		infos: {
			count: +count,
			from: from,
			to: from + karaList.length
		},
		content: karaList
	};
}

export async function getAllYears() {
	return await selectAllYears();
}

export async function getAllKaras(filter, lang, from = 0, size = 0, mode, modeValue) {
	try {
		const [length, pl] = await Promise.all([
			countKaras(filter, mode, modeValue),
			selectAllKaras(filter, lang, +from, +size, mode, modeValue)
		]);
		return formatKaraList(pl, +from, length);
	} catch(err) {
		throw err;
	}
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
	return check(karaData, karaConstraintsV3);
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