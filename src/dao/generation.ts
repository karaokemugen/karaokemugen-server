import logger from 'winston';
import {has as hasLang} from 'langs';
import {getConfig} from '../utils/config';
import {join, resolve} from 'path';
import {asyncReadDirFilter} from '../utils/files';
import {getDataFromKaraFile} from './karafile';
import {createVideoPreviews} from '../utils/previews';
import {copyFromData, db, refreshAll} from './database';
import {tags as karaTags, karaTypesMap} from '../services/constants';
import {basename} from 'path';
import parallel from 'async-await-parallel';
import {findSeries, getDataFromSeriesFile} from '../dao/seriesfile';
import {updateSetting} from '../utils/settings';
import slugify from 'slugify';
import {createHash} from 'crypto';
import uuidV4 from 'uuid/v4';

let error = false;
let generating = false;

function hash(string) {
	const hash = createHash('sha1');
	hash.update(string);
	return hash.digest('hex');
}

async function emptyDatabase() {
	await db().query(`
	BEGIN;
	TRUNCATE kara_tag CASCADE;
	TRUNCATE kara_serie CASCADE;
	TRUNCATE tag RESTART IDENTITY CASCADE;
	TRUNCATE serie RESTART IDENTITY CASCADE;
	TRUNCATE serie_lang RESTART IDENTITY CASCADE;
	TRUNCATE kara RESTART IDENTITY CASCADE;
	COMMIT;
	`);
}

export async function extractAllSeriesFiles() {
	const conf = getConfig();
	return await asyncReadDirFilter(resolve(conf.appPath, conf.Path.Series), '.series.json');
}

export async function extractAllKaraFiles() {
	const conf = getConfig();
	return await asyncReadDirFilter(resolve(conf.appPath, conf.Path.Karas), '.kara');
}

export async function readAllKaras(karafiles, seriesMap) {
	const karaPromises = [];
	for (const karafile of karafiles) {
		karaPromises.push(() => readAndCompleteKarafile(karafile, seriesMap));
	}
	const karas = await parallel(karaPromises, 16);
	// Errors are non-blocking
	if (karas.some(kara => kara.error)) error = true;
	return karas.filter(kara => !kara.error);
}

async function readAndCompleteKarafile(karafile, seriesMap) {
	const karaData = await getDataFromKaraFile(karafile);
	if (karaData.series) {
		for (const serie of karaData.series.split(',')) {
			const seriesData = seriesMap.get(serie);
			if (seriesData) {
				seriesData.kids.push(karaData.KID);
				seriesMap.set(serie, seriesData);
			} else {
				error = true;
				karaData.error = true;
				logger.error(`[Gen] Series ${serie} was not found in your series.json files (Kara file : ${karafile})`);
			}
		}
	}
	return karaData;
}

export async function readAllSeries(seriesFiles) {
	const seriesPromises = [];
	const seriesMap = new Map();
	for (const seriesFile of seriesFiles) {
		seriesPromises.push(() => processSerieFile(seriesFile, seriesMap));
	}
	const seriesData = await parallel(seriesPromises, 16);
	return { data: seriesData, map: seriesMap };
}

async function processSerieFile(seriesFile, map) {
	const data = await getDataFromSeriesFile(seriesFile);
	data.seriefile = basename(seriesFile);
	map.set(data.name, { sid: data.sid, kids: [] });
	return data;
}

function prepareKaraInsertData(kara) {
	return [
		kara.KID,
		kara.title,
		kara.year || null,
		kara.order || null,
		kara.mediafile,
		kara.subfile,
		basename(kara.karafile),
		kara.mediaduration,
		kara.mediasize,
		kara.mediagain,
		new Date(kara.dateadded * 1000).toISOString(),
		new Date(kara.datemodif * 1000).toISOString()
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

function prepareSerieInsertData(serie, data) {
	if (data.aliases) data.aliases.forEach((d,i) => {
		data.aliases[i] = d.replace(/"/g,'\\"');
	});
	return [
		data.sid,
		serie,
		JSON.stringify(data.aliases || []),
		data.seriefile
	];
}

function prepareAllSeriesInsertData(mapSeries, seriesData) {
	const data = [];
	for (const serie of mapSeries) {
		const serieData = seriesData.filter(e => e.name === serie[0]);
		data.push(prepareSerieInsertData(serie[0], serieData[0]));
	}
	return data;
}

/**
 * Warning : we iterate on keys and not on map entries to get the right order and thus the same indexes as the function prepareAllSeriesInsertData. This is the historical way of doing it and should be improved sometimes.
 */
function prepareAllKarasSeriesInsertData(mapSeries) {
	const data = [];
	for (const serie of mapSeries) {
		for (const kid of serie[1].kids) {
			data.push([
				serie[1].sid,
				kid
			]);
		}
	}
	return data;
}

async function prepareAltSeriesInsertData(seriesData, mapSeries) {
	const i18nData = [];
	let index = 0;
	for (const serie of seriesData) {
		if (serie.i18n) {
			for (const lang of Object.keys(serie.i18n)) {
				index++;
				i18nData.push([
					index,
					serie.sid,
					lang,
					serie.i18n[lang]
				]);
			}
		}
	}
	// Checking if some series present in .kara files are not present in the series files
	for (const serie of mapSeries) {
		if (!findSeries(serie[0], seriesData)) {
			index++;
			// Print a warning and push some basic data so the series can be searchable at least
			logger.warn(`[Gen] Series "${serie}" is not in any series file`);
			i18nData.push([
				index,
				uuidV4(),
				'jpn',
				serie[0],
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
	const translations = require(join(__dirname,'../locales/'));
	let lastIndex;

	allTags.forEach((tag, index) => {
		const tagParts = tag.split(',');
		const tagName = tagParts[0];
		const tagType = tagParts[1];
		let tagSlug = slugify(tagName);
		if (slugs.includes(`${tagType} ${tagSlug}`)) {
			tagSlug = `${tagSlug}-${hash(tagName)}`;
		}
		if (slugs.includes(`${tagType} ${tagSlug}`)) {
			logger.error(`[Gen] Duplicate: ${tagType} ${tagSlug} ${tagName}`);
			error = true;
		}
		slugs.push(`${tagType} ${tagSlug}`);
		const tagi18n = {};
		if (+tagType === 7 || +tagType === 3) {
			for (const language of Object.keys(translations)) {
				// Key is the language, value is a i18n text
				if (translations[language][tagName]) tagi18n[language] = translations[language][tagName];
			}
		}
		data.push([
			index + 1,
			tagType,
			tagName,
			tagSlug,
			JSON.stringify(tagi18n)
		]);
		lastIndex = index + 1;
	});
	// We browse through tag data to add the default tags if they don't exist.
	for (const tag of karaTags) {
		const tagi18n = {};
		if (!data.find(t => t[2] === `TAG_${tag}`)) {
			const tagDefaultName = `TAG_${tag}`;
			for (const language of Object.keys(translations)) {
				// Key is the language, value is a i18n text
				if (translations[language][`TAG_${tag}`]) tagi18n[language] = translations[language][`TAG_${tag}`];
			}
			data.push([
				lastIndex + 1,
				7,
				tagDefaultName,
				slugify(tagDefaultName),
				JSON.stringify(tagi18n)
			]);
			lastIndex++;
		}
	}
	// We do it as well for types
	for (const type of karaTypesMap) {
		const tagi18n = {};
		if (!data.find(t => t[2] === `TYPE_${type[0]}`)) {
			const typeDefaultName = `TYPE_${type[0]}`;
			for (const language of Object.keys(translations)) {
				// Key is the language, value is a i18n text
				if (translations[language][`TYPE_${type[0]}`]) tagi18n[language] = translations[language][`TAG_${type[0]}`];
			}
			data.push([
				lastIndex + 1,
				3,
				typeDefaultName,
				slugify(typeDefaultName),
				JSON.stringify(tagi18n)
			]);
			lastIndex++;
		}
	}
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
		// Series data
		const seriesFiles = await extractAllSeriesFiles();
		if (seriesFiles.length === 0) throw 'No series files found';
		const series = await readAllSeries(seriesFiles);
		checkDuplicateSeries(series.data);
		checkDuplicateSIDs(series.data);
		const karaFiles = await extractAllKaraFiles();
		logger.debug(`[Gen] Number of .karas found : ${karaFiles.length}`);
		if (karaFiles.length === 0) throw 'No kara files found';
		const karas = await readAllKaras(karaFiles, series.map);
		// Check if we don't have two identical KIDs
		logger.debug(`[Gen] Number of karas read : ${karas.length}`);
		checkDuplicateKIDs(karas);

		// Preparing data to insert
		logger.info('[Gen] Data files processed, creating database');
		const sqlInsertKaras = prepareAllKarasInsertData(karas);
		const sqlInsertSeries = prepareAllSeriesInsertData(series.map, series.data);
		const sqlInsertKarasSeries = prepareAllKarasSeriesInsertData(series.map);
		const sqlSeriesi18nData = await prepareAltSeriesInsertData(series.data, series.map);
		const tags = getAllKaraTags(karas);
		const sqlInsertTags = prepareAllTagsInsertData(tags.allTags);
		const sqlInsertKarasTags = prepareTagsKaraInsertData(tags.tagsByKara);
		await emptyDatabase();
		// Inserting data in a transaction
		await Promise.all([
			copyFromData('kara', sqlInsertKaras),
			copyFromData('serie', sqlInsertSeries),
			copyFromData('tag', sqlInsertTags)
		]);
		await Promise.all([
			copyFromData('serie_lang', sqlSeriesi18nData),
			copyFromData('kara_tag', sqlInsertKarasTags),
			copyFromData('kara_serie', sqlInsertKarasSeries)
		]);
		// Setting the pk_id_tag sequence to allow further edits during runtime
		await db().query('SELECT SETVAL(\'tag_pk_id_tag_seq\',(SELECT MAX(pk_id_tag) FROM tag))');
		await db().query('SELECT SETVAL(\'serie_lang_pk_id_serie_lang_seq\',(SELECT MAX(pk_id_serie_lang) FROM serie_lang))');
		await db().query('VACUUM ANALYZE;');
		await Promise.all([
			refreshAll(),
			updateSetting('lastGeneration', new Date().toString())
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
