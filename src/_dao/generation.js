import logger from 'winston';
import {has as hasLang} from 'langs';
import {getConfig} from '../_utils/config';
import {resolve} from 'path';
import {asyncReadDirFilter} from '../_utils/files';
import {getDataFromKaraFile} from './karafile';
import {createVideoPreviews} from '../_utils/previews';
import {db, transaction} from './database';
import {refreshKaras, refreshYears} from './kara';
import {
	insertKaras, insertKaraSeries, insertKaraTags, insertSeries, insertTags, inserti18nSeries, deleteAll
} from './sqls/generation';
import {karaTypesMap} from '../_services/constants';
import {basename} from 'path';
import parallel from 'async-await-parallel';
import {findSeries, getDataFromSeriesFile} from '../_dao/seriesfile';
import {updateSetting} from '../_utils/settings';
import { refreshSeries } from './series';
import { refreshTags } from './tag';
import slug from 'slug';
import {createHash} from 'crypto';


let error = false;
let generating = false;

function hash(string) {
	const hash = createHash('sha1');
	hash.update(string);
	return hash.digest('hex');
}

async function emptyDatabase() {
	await db().query(deleteAll);
}

export async function extractAllSeriesFiles() {
	const conf = getConfig();
	return await asyncReadDirFilter(resolve(conf.appPath, conf.Path.Series), '.series.json');
}

export async function extractAllKaraFiles() {
	const conf = getConfig();
	return await asyncReadDirFilter(resolve(conf.appPath, conf.Path.Karas), '.kara');
}

export async function readAllKaras(karafiles) {
	const karaPromises = [];
	for (const karafile of karafiles) {
		karaPromises.push(() => getDataFromKaraFile(karafile));
	}
	const karas = await parallel(karaPromises, 16);
	// Errors are non-blocking
	if (karas.some((kara) => {
		return kara.error;
	})) error = true;
	return karas;
}

export async function readAllSeries(seriesFiles) {
	const seriesPromises = [];
	for (const seriesFile of seriesFiles) {
		seriesPromises.push(() => getDataFromSeriesFile(seriesFile));
	}
	return await parallel(seriesPromises, 16);
}

function prepareKaraInsertData(kara) {
	return [
		kara.KID,
		kara.title,
		kara.year || null,
		kara.order || null,
		kara.mediafile,
		kara.subfile,
		new Date(kara.dateadded * 1000),
		new Date(kara.datemodif * 1000),
		kara.mediagain,
		kara.mediaduration,
		basename(kara.karafile),
		kara.mediasize
	];
}

function prepareAllKarasInsertData(karas) {
	return karas.map(kara => prepareKaraInsertData(kara));
}

function checkDuplicateKIDs(karas) {
	let searchKaras = [];
	let errors = [];
	for (const kara of karas) {
		// Find out if our kara exists in our list, if not push it.
		const search = searchKaras.find(k => {
			return k.KID === kara.KID;
		});
		if (search) {
			// One KID is duplicated, we're going to throw an error.
			errors.push({
				KID: kara.KID,
				kara1: kara.karafile,
				kara2: search.karafile
			});
		}
		searchKaras.push({ KID: kara.KID, karafile: kara.karafile });
	}
	if (errors.length > 0) throw `One or several KIDs are duplicated in your database : ${JSON.stringify(errors,null,2)}. Please fix this by removing the duplicated karaoke(s) and retry generating your database.`;
}

function checkDuplicateSeries(series) {
	let searchSeries = [];
	let errors = [];
	for (const serie of series) {
		// Find out if our series exists in our list, if not push it.
		const search = searchSeries.find(s => {
			return s.name === serie.name;
		});
		if (search) {
			// One series is duplicated, we're going to throw an error.
			errors.push({
				name: serie.name
			});
		}
		searchSeries.push({ name: serie.name });
	}
	if (errors.length > 0) throw `One or several series are duplicated in your database : ${JSON.stringify(errors,null,2)}. Please fix this by removing the duplicated series file(s) and retry generating your database.`;
}

function checkDuplicateSIDs(series) {
	let searchSeries = [];
	let errors = [];
	for (const serie of series) {
		// Find out if our kara exists in our list, if not push it.
		const search = searchSeries.find(s => {
			return s.sid === serie.sid;
		});
		if (search) {
			// One SID is duplicated, we're going to throw an error.
			errors.push({
				sid: serie.sid,
				serie1: serie.seriefile,
				serie2: search.seriefile
			});
		}
		searchSeries.push({ sid: serie.sid, karafile: serie.seriefile });
	}
	if (errors.length > 0) throw `One or several SIDs are duplicated in your database : ${JSON.stringify(errors,null,2)}. Please fix this by removing the duplicated serie(s) and retry generating your database.`;
}

/**
 * Returns a Map<String, Array>, linking a series to the karaoke indexes involved.
 */
function getAllSeries(karas, seriesData) {
	const series = {};
	logger.profile('getAllSeries');
	for (const serie of seriesData) {
		series[serie.name] = {
			sid: serie.sid
		};
		for (const kara of karas) {
			const karaSeries = kara.series.split(',');
			if (!series[serie.name].kids) series[serie.name].kids = [];
			if (karaSeries.includes(serie.name)) {
				series[serie.name].kids.push(kara.KID);
			}
		}
	}
	return series;
}

function prepareSerieInsertData(serie, data) {
	return [
		serie,
		JSON.stringify(data.aliases || []),
		data.sid,
		data.seriefile
	];
}

function prepareAllSeriesInsertData(mapSeries, seriesData) {
	const data = [];
	for (const serie of Object.keys(mapSeries)) {
		const serieData = seriesData.filter(e => e.name === serie);
		data.push(prepareSerieInsertData(serie, serieData[0]));
	}
	return data;
}

/**
 * Warning : we iterate on keys and not on map entries to get the right order and thus the same indexes as the function prepareAllSeriesInsertData. This is the historical way of doing it and should be improved sometimes.
 */
function prepareAllKarasSeriesInsertData(mapSeries) {
	const data = [];
	for (const serie of Object.keys(mapSeries)) {
		for (const kid of mapSeries[serie].kids) {
			data.push([
				mapSeries[serie].sid,
				kid
			]);
		}
	}
	return data;
}

async function prepareAltSeriesInsertData(seriesData, mapSeries) {
	const i18nData = [];
	for (const serie of seriesData) {
		if (serie.i18n) {
			for (const lang of Object.keys(serie.i18n)) {
				i18nData.push([
					lang,
					serie.i18n[lang],
					serie.name
				]);
			}
		}
	}
	// Checking if some series present in .kara files are not present in the series files
	for (const serie of Object.keys(mapSeries)) {
		if (!findSeries(serie, seriesData)) {
			// Print a warning and push some basic data so the series can be searchable at least
			logger.warn(`[Gen] Series "${serie}" is not in any series file`);
			i18nData.push([
				'jpn',
				serie,
				serie
			]);
		}
	}
	return i18nData;
}

function getAllKaraTags(karas) {

	const allTags = [];

	const tagsByKara = new Map();

	karas.forEach(kara => {
		const karaIndex = kara.KID;
		tagsByKara.set(karaIndex, getKaraTags(kara, allTags));
	});

	return {
		tagsByKara: tagsByKara,
		allTags: allTags
	};
}

function getKaraTags(kara, allTags) {

	const result = new Set();

	if (kara.singer) {
		kara.singer.split(',').forEach(singer => result.add(getTagId(singer.trim() + ',2', allTags)));
	} else {
		result.add(getTagId('NO_TAG,2', allTags));
	}
	if (kara.author) {
		kara.author.split(',').forEach(author => result.add(getTagId(author.trim() + ',6', allTags)));
	} else {
		result.add(getTagId('NO_TAG,6', allTags));
	}
	if (kara.tags) {
		kara.tags.split(',').forEach(tag => result.add(getTagId(tag.trim() + ',7', allTags)));
	} else {
		result.add(getTagId('NO_TAG,7', allTags));
	}
	if (kara.creator) {
		kara.creator.split(',').forEach(creator => result.add(getTagId(creator.trim() + ',4', allTags)));
	} else {
		result.add(getTagId('NO_TAG,4', allTags));
	}
	if (kara.songwriter) {
		kara.songwriter.split(',').forEach(songwriter => result.add(getTagId(songwriter.trim() + ',8', allTags)));
	} else {
		result.add(getTagId('NO_TAG,8', allTags));
	}
	if (kara.groups) kara.groups.split(',').forEach(group => result.add(getTagId(group.trim() + ',9', allTags)));
	if (kara.lang) kara.lang.split(',').forEach(lang => {
		if (lang === 'und' || lang === 'mul' || lang === 'zxx' || hasLang('2B', lang)) {
			result.add(getTagId(lang.trim() + ',5', allTags));
		}
	});

	getTypes(kara, allTags).forEach(type => result.add(type));

	return result;
}

function getTypes(kara, allTags) {
	const result = new Set();

	karaTypesMap.forEach((value, key) => {
		// Adding spaces since some keys are included in others.
		// For example MV and AMV.
		if (` ${kara.type} `.includes(` ${key} `)) {
			result.add(getTagId(value, allTags));
		}
	});

	if (result.size === 0) {
		logger.warn(`[Gen] Karaoke type cannot be detected (${kara.type}) in kara :  ${JSON.stringify(kara, null, 2)}`);
		error = true;
	}

	return result;
}

function getTagId(tagName, tags) {

	const index = tags.indexOf(tagName) + 1;

	if (index > 0) {
		return index;
	}

	tags.push(tagName);
	return tags.length;
}

function prepareAllTagsInsertData(allTags) {
	const data = [];
	const slugs = [];

	allTags.forEach((tag, index) => {
		const tagParts = tag.split(',');
		const tagName = tagParts[0];
		const tagType = tagParts[1];
		slug.defaults.mode = 'rfc3986';
		let tagSlug = slug(tagName, {
			lower: true,
		});
		if (slugs.includes(`${tagType} ${tagSlug}`)) {
			tagSlug = `${tagSlug}-${hash(tagName)}`;
		}
		if (slugs.includes(`${tagType} ${tagSlug}`)) {
			logger.error(`[Gen] Duplicate: ${tagType} ${tagSlug} ${tagName}`);
			error = true;
		}
		slugs.push(`${tagType} ${tagSlug}`);
		data.push([
			index + 1,
			tagType,
			tagName,
			tagSlug,
		]);
	});

	return data;
}

function prepareTagsKaraInsertData(tagsByKara) {
	const data = [];

	tagsByKara.forEach((tags, kid) => {
		tags.forEach(tagId => {
			data.push([
				tagId,
				kid
			]);
		});
	});

	return data;
}

export async function run() {
	try {
		if (generating) throw 'A database generation is already in progress';
		generating = true;

		logger.info('[Gen] Starting database generation');
		const karaFiles = await extractAllKaraFiles();
		logger.debug(`[Gen] Number of .karas found : ${karaFiles.length}`);
		if (karaFiles.length === 0) throw 'No kara files found';

		const karas = await readAllKaras(karaFiles);
		logger.debug(`[Gen] Number of karas read : ${karas.length}`);
		// Check if we don't have two identical KIDs
		checkDuplicateKIDs(karas);
		// Series data

		const seriesFiles = await extractAllSeriesFiles();
		if (seriesFiles.length === 0) throw 'No series files found';
		const seriesData = await readAllSeries(seriesFiles);
		checkDuplicateSeries(seriesData);
		checkDuplicateSIDs(seriesData);
		// Preparing data to insert
		logger.info('[Gen] Data files processed, creating database');
		const sqlInsertKaras = prepareAllKarasInsertData(karas);
		const seriesMap = getAllSeries(karas, seriesData);
		const sqlInsertSeries = prepareAllSeriesInsertData(seriesMap, seriesData);
		const sqlInsertKarasSeries = prepareAllKarasSeriesInsertData(seriesMap);
		const sqlSeriesi18nData = await prepareAltSeriesInsertData(seriesData, seriesMap);
		const tags = getAllKaraTags(karas);
		const sqlInsertTags = prepareAllTagsInsertData(tags.allTags);
		const sqlInsertKarasTags = prepareTagsKaraInsertData(tags.tagsByKara);
		await emptyDatabase();
		// Inserting data in a transaction
		await transaction([
			{sql: insertKaras, params: sqlInsertKaras},
			{sql: insertSeries, params: sqlInsertSeries},
			{sql: insertTags, params: sqlInsertTags},
			{sql: insertKaraTags, params: sqlInsertKarasTags},
			{sql: insertKaraSeries, params: sqlInsertKarasSeries},
			{sql: inserti18nSeries, params: sqlSeriesi18nData}
		]);
		await Promise.all([
			db().query('VACUUM ANALYZE;'),
			refreshKaras(),
			refreshSeries(),
			refreshYears(),
			refreshTags(),
			updateSetting('lastGeneration', new Date())
		]);
		createVideoPreviews();
		if (error) throw 'Error during generation. Find out why in the messages above.';
	} catch (err) {
		logger.error(`[Gen] Generation error: ${err}`);
		throw err;
	} finally {
		generating = false;
	}
}


