import logger from 'winston';
import {resolve} from 'path';
import {has as hasLang} from 'langs';
import {asyncReadDir} from '../_utils/files';
import {getConfig} from '../_utils/config';
import {getDataFromKaraFile} from './karafile';
import {transaction, db} from './database';
import {
	insertKaras, insertKaraSeries, insertKaraTags, insertSeries, insertTags, inserti18nSeries, selectKaras, selectViewcountKaras, selectRequestKaras, updateSeriesAltNames, deleteAll
} from './sqls/generation';
import {karaTypesMap} from '../_services/constants';
import {serieRequired, verifyKaraData} from '../_services/kara';
import {basename} from 'path';
import parallel from 'async-await-parallel';
import {findSeries, readSeriesFile} from '../_dao/seriesfile';

let error = false;

async function extractKaraFiles() {
	const conf = getConfig();
	const karaDir = resolve(conf.appPath, conf.Path.Karas);
	const karaFiles = [];
	const dirListing = await asyncReadDir(karaDir);
	for (const file of dirListing) {
		if (file.endsWith('.kara') && !file.startsWith('.')) {
			karaFiles.push(resolve(karaDir, file));
		}
	}
	if (karaFiles.length === 0) throw 'No kara files found';
	return karaFiles;
}

export async function readAllKaras(karafiles) {
	const karaPromises = [];
	for (const karafile of karafiles) {
		karaPromises.push(() => readKarafile(karafile));
	}
	const karas = await parallel(karaPromises, 16);
	// Errors are non-blocking
	if (karas.some((kara) => {
		return kara.error;
	})) error = true;
	return karas;
}

async function readKarafile(karafile) {
	const karaData = await getDataFromKaraFile(karafile);
	try {
		verifyKaraData(karaData);
	} catch (err) {
		logger.warn(`[Gen] Kara file ${karafile} is invalid/incomplete : ${err}`);
		error = true;
	}
	return karaData;
}

function prepareKaraInsertData(kara, index) {
	return [
		index,
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
	// Remember JS indexes start at 0.
	return karas.map((kara, index) => prepareKaraInsertData(kara, index + 1));
}

function getSeries(kara) {
	const series = new Set();

	// Extracted series names from kara files
	if (kara.series && kara.series.trim()) {
		kara.series.split(',').forEach(serie => {
			if (serie.trim()) {
				series.add(serie.trim());
			}
		});
	}

	// At least one series is mandatory if kara is not LIVE/MV type
	if (serieRequired(kara.type) && !series) {
		logger.error(`Karaoke series cannot be detected! (${JSON.stringify(kara)})`);
		error = true;
	}

	return series;
}

/**
 * Returns a Map<String, Array>, linking a series to the karaoke indexes involved.
 */
function getAllSeries(karas) {
	const map = new Map();
	karas.forEach((kara, index) => {
		const karaIndex = index + 1;
		getSeries(kara).forEach(serie => {
			if (map.has(serie)) {
				map.get(serie).push(karaIndex);
			} else {
				map.set(serie, [karaIndex]);
			}
		});
	});

	return map;
}

function prepareSerieInsertData(serie, index) {
	return [
		index,
		serie
	];
}

function prepareAllSeriesInsertData(mapSeries) {
	const data = [];
	let index = 1;
	for (const serie of mapSeries.keys()) {
		data.push(prepareSerieInsertData(serie, index));
		index++;
	}
	return data;
}

/**
 * Warning : we iterate on keys and not on map entries to get the right order and thus the same indexes as the function prepareAllSeriesInsertData. This is the historical way of doing it and should be improved sometimes.tre améliorée.
 */
function prepareAllKarasSeriesInsertData(mapSeries) {
	const data = [];
	let index = 1;
	for (const serie of mapSeries.keys()) {
		for (const karaIndex of mapSeries.get(serie)) {
			data.push([
				index,
				karaIndex
			]);
		}
		index++;
	}

	return data;
}

async function prepareAltSeriesInsertData(altSeriesFile, mapSeries) {

	const altNameData = [];
	const i18nData = [];
	const seriesData = await readSeriesFile(altSeriesFile);
	for (const serie of seriesData.series) {
		if (serie.aliases) altNameData.push([
			JSON.stringify(serie.aliases),
			serie.name
		]);
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
	// Checking if some series present in .kara files are not present in the series file
	for (const serie of mapSeries.keys()) {
		if (!findSeries(serie, seriesData)) {
			// Print a warning and push some basic data so the series can be searchable at least
			logger.warn(`[Gen] Series "${serie}" is not in the series file`);
			altNameData.push([
				serie
			]);
			i18nData.push([
				'jpn',
				serie,
				serie
			]);
		}
	}
	return {
		altNameData: altNameData,
		i18nData: i18nData
	};
}

function getAllKaraTags(karas) {

	const allTags = [];

	const tagsByKara = new Map();

	karas.forEach((kara, index) => {
		const karaIndex = index + 1;
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
	if (kara.group) kara.group.split(',').forEach(group => result.add(getTagId(group.trim() + ',9', allTags)));
	if (kara.lang) kara.lang.split(',').forEach(lang => {
		if (lang === 'und' || lang === 'mul' || hasLang('2B', lang)) {
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
		logger.warn(`[Gen] Karaoke type cannot be detected (${kara.type}) in kara :  ${JSON.stringify(kara)}`);
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
	allTags.forEach((tag, index) => {
		const tagParts = tag.split(',');
		const tagName = tagParts[0];
		const tagType = tagParts[1];
		data.push([
			index + 1,
			tagType,
			tagName
		]);
	});

	return data;
}

function prepareTagsKaraInsertData(tagsByKara) {
	const data = [];

	tagsByKara.forEach((tags, karaIndex) => {
		tags.forEach(tagId => {
			data.push([
				tagId,
				karaIndex
			]);
		});
	});

	return data;
}

export async function run(config) {
	try {
		const conf = config || getConfig();
		const seriesFile = resolve(conf.appPath, conf.Path.Series);

		logger.info('[Gen] Starting database generation');
		logger.info('[Gen] GENERATING DATABASE CAN TAKE A WHILE, PLEASE WAIT.');
		const karaFiles = await extractKaraFiles();
		const karas = await readAllKaras(karaFiles);
		// Preparing data to insert
		const sqlInsertKaras = prepareAllKarasInsertData(karas);
		const seriesMap = getAllSeries(karas);
		const sqlInsertSeries = prepareAllSeriesInsertData(seriesMap);
		const sqlInsertKarasSeries = prepareAllKarasSeriesInsertData(seriesMap);
		const tags = getAllKaraTags(karas);
		const sqlInsertTags = prepareAllTagsInsertData(tags.allTags);
		const sqlInsertKarasTags = prepareTagsKaraInsertData(tags.tagsByKara);
		const seriesAltNamesData = await prepareAltSeriesInsertData(seriesFile, seriesMap);
		const sqlUpdateSeriesAltNames = seriesAltNamesData.altNameData;
		const sqlInserti18nSeries = seriesAltNamesData.i18nData;

		// Inserting data in a transaction

		await transaction([
			{sql: deleteAll},
			{sql: insertKaras, params: sqlInsertKaras},
			{sql: insertSeries, params: sqlInsertSeries},
			{sql: insertTags, params: sqlInsertTags},
			{sql: insertKaraTags, params: sqlInsertKarasTags},
			{sql: insertKaraSeries, params: sqlInsertKarasSeries},
			{sql: inserti18nSeries, params: sqlInserti18nSeries},
			{sql: updateSeriesAltNames, params: sqlUpdateSeriesAltNames}
		]);
		// These tables do not exist yet
		//await checkUserdbIntegrity(null, conf);
		logger.info('[Gen] Done generating database');
		return error;
	} catch (err) {
		console.log(err);
		logger.error(`[Gen] Generation error: ${err}`);
		return error;
	}
}


/**
 * @function run_userdb_integrity_checks
 * Get all karas from all_karas view
 * Get all karas in playlist_content, blacklist, viewcount, whitelist
 * Parse karas in playlist_content, search for the KIDs in all_karas
 * If id_kara is different, write a UPDATE query.
 */
export async function checkUserdbIntegrity() {

	logger.info('[Gen] Running user database integrity checks');

	const [
		allKaras,
		viewcountKaras,
		requestKaras,
	] = await Promise.all([
		db().query(selectKaras),
		db().query(selectViewcountKaras),
		db().query(selectRequestKaras),
	]);

	// Listing existing KIDs
	const karaKIDs = allKaras.rows.map(k => `'${k.kid}'`).join(',');

	// Deleting records which aren't in our KID list
	await Promise.all([
		db().query(`DELETE FROM viewcount WHERE kid NOT IN (${karaKIDs});`),
		db().query(`DELETE FROM request WHERE kid NOT IN (${karaKIDs});`),
	]);
	const karaIdByKid = new Map();
	allKaras.rows.forEach(k => karaIdByKid.set(k.kid, k.id_kara));
	let sql = '';

	viewcountKaras.forEach(vck => {
		if (karaIdByKid.has(vck.kid) && karaIdByKid.get(vck.kid) !== vck.id_kara) {
			sql += `UPDATE viewcount SET fk_id_kara = ${karaIdByKid.get(vck.kid)} WHERE kid = '${vck.kid}';`;
		}
	});
	requestKaras.forEach(rqk => {
		if (karaIdByKid.has(rqk.kid) && karaIdByKid.get(rqk.kid) !== rqk.id_kara) {
			sql += `UPDATE request SET fk_id_kara = ${karaIdByKid.get(rqk.kid)} WHERE kid = '${rqk.kid}';`;
		}
	});

	if (sql !== '') await db().query(sql);

	logger.info('[Gen] Integrity checks complete, database generated');
}
