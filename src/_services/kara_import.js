/**
 * .kara files generation
 */

import logger from 'winston';
import {extname, resolve,basename} from 'path';
import {getConfig} from '../_utils/config';
import {sanitizeFile, asyncExists, asyncMove, replaceExt} from '../_utils/files';
import {
	extractAssInfos, extractVideoSubtitles, extractMediaTechInfos, writeKara
} from '../_dao/karafile';
import {getType} from '../_services/constants';
import {formatKara} from '../_services/kara';
import {check} from '../_utils/validators';
import timestamp from 'unix-timestamp';
import {sendMail} from '../_utils/mailer';
import { selectAllSeries } from '../_dao/series';
import uuidV4 from 'uuid/v4';
import {writeSeriesFile} from '../_dao/seriesfile';
import {duration} from '../_utils/date';
import got from 'got';

export async function createKara(kara) {
	return await generateKara(kara);
}

async function generateKara(kara, opts) {
	/*
	kara = {
		title = string
		series = string (elements separated by ,) (see series from series.json)
		type = string (see karaTypes from constants)
		year = number or empty
		order = number or empty
		singer = string (elements separated by ,) (see results from GET /api/tags, type is 2)
		songwriter = string (elements separated by ,) (see results from GET /api/tags, type is 8)
		tags = string (elements separated by ,) (see tags from constants)
		creator = string (elements separated by ,) (see results from GET /api/tags, type is 4)
		author = string (elements separated by ,) (see results from GET /api/tags, type is 6)
		lang = string (elements separated by ,) (get iso639-2B from langs.codes("2B") )
		mediafile = mediafile name as uploaded
		subfile = subfile name as uploaded
		mediafile_orig = Original name from the user's computer
		subfile_orig = Original name from the user's computer
	}
	*/
	let validationErrors;
	if (!opts) opts = {};
	try {
		if ((kara.type !== 'MV' && kara.type !== 'LIVE') && kara.series.length === 0) throw 'Series cannot be empty if type is not MV or LIVE';
		if (!kara.mediafile) throw 'No media file uploaded';
		validationErrors = check(kara, {
			year: {integerValidator: true},
			lang: {langValidator: true},
			tags: {tagsValidator: true},
			type: {typeValidator: true},
			order: {integerValidator: true},
			series: {arrayNoCommaValidator: true},
			singer: {arrayNoCommaValidator: true},
			author: {arrayNoCommaValidator: true},
			songwriter: {arrayNoCommaValidator: true},
			creator: {arrayNoCommaValidator: true},
			groups: {arrayNoCommaValidator: true},
			title: {presence: true}
		});
	} catch(err) {
		logger.error(`[KaraImport] Karaoke failed validations: ${err}`);
		throw err;
	}
	// Move files from temp directory to import, depending on the different cases.
	// First name media files and subfiles according to their extensions
	// Since temp files don't have any extension anymore
	const newMediaFile = `${kara.mediafile}${extname(kara.mediafile_orig)}`;
	let newSubFile;
	if (kara.subfile && kara.subfile !== 'dummy.ass' && kara.subfile_orig) newSubFile = `${kara.subfile}${extname(kara.subfile_orig)}`;
	if (kara.subfile === 'dummy.ass') newSubFile = kara.subfile;
	// We don't need these anymore.
	delete kara.subfile_orig;
	delete kara.mediafile_orig;
	// Let's move baby.
	try {
		if (validationErrors) throw JSON.stringify(validationErrors);
		timestamp.round = true;
		kara.dateadded = timestamp.now();
		kara.songwriter.sort();
		kara.singer.sort();
		//Trim spaces before and after elements.
		kara.series.forEach((e,i) => kara.series[i] = e.trim());
		kara.lang.forEach((e,i) => kara.lang[i] = e.trim());
		kara.singer.forEach((e,i) => kara.singer[i] = e.trim());
		kara.groups.forEach((e,i) => kara.groups[i] = e.trim());
		kara.songwriter.forEach((e,i) => kara.songwriter[i] = e.trim());
		kara.tags.forEach((e,i) => kara.tags[i] = e.trim());
		kara.creator.forEach((e,i) => kara.creator[i] = e.trim());
		kara.author.forEach((e,i) => kara.author[i] = e.trim());
		if (!kara.order) kara.order = '';
		const newKara = await importKara(newMediaFile, newSubFile, kara);
		delete newKara.data.ass;
		delete newKara.data.isKaraModified;
		// Construct template
		const conf = getConfig();
		const karaName = `${newKara.data.lang.split(',')[0].toUpperCase()} - ${newKara.data.series.split(',')[0]} - ${newKara.data.type}${newKara.data.order || ''} - ${newKara.data.title}`;
		let title = conf.Import.Template.Title || 'New kara: $kara';
		title = title.replace('$kara', karaName);
		let desc = conf.Import.Template.Description || '';
		desc = desc.replace('$file', basename(newKara.file))
			.replace('$author', newKara.data.author)
			.replace('$title', newKara.data.title)
			.replace('$series', newKara.data.series)
			.replace('$type', newKara.data.type)
			.replace('$order', newKara.data.order || '')
			.replace('$lang', newKara.data.lang)
			.replace('$year', newKara.data.year)
			.replace('$singer', newKara.data.singer)
			.replace('$tags', newKara.data.tags)
			.replace('$songwriter', newKara.data.songwriter)
			.replace('$creator', newKara.data.creator)
			.replace('$groups', newKara.data.groups)
			.replace('$duration', duration(newKara.data.mediaduration))
		try {
			if (conf.Mail.Enabled && conf.Import.Mail.Enabled) sendMail(title, desc, conf.Import.Mail.To);
		} catch(err) {
			logger.error(`[KaraImport] Could not send mail : ${err}`);
		}
		try {
			if (conf.Import.Gitlab.Enabled) {
				const gitlab = conf.Import.Gitlab;
				const params = new URLSearchParams([
					['id', gitlab.ProjectID],
					['title', title],
					['description', desc],
					['labels', gitlab.Labels.join(',')]
				]);
				const res = await got.post(`https://${gitlab.URL}/api/v4/projects/${gitlab.ProjectID}/issues?${params.toString()}`, {
					headers: {
						'PRIVATE-TOKEN': gitlab.AccessToken
					}
				});
				return res.body.web_url;
			}
		} catch(err) {
			logger.error(`[KaraImport] Call to Gitlab API failed : ${err}`);
		}
	} catch(err) {
		logger.error(`[Karagen] Error during generation : ${err}`);
		throw err;
	}
}

function defineFilename(data) {
	// Generate filename according to tags and type.
	if (data) {
		const extraTags = [];
		if (data.tags.includes('TAG_PS3')) extraTags.push('PS3');
		if (data.tags.includes('TAG_PS2')) extraTags.push('PS2');
		if (data.tags.includes('TAG_PSX')) extraTags.push('PSX');
		if (data.tags.includes('TAG_SPECIAL')) extraTags.push('SPECIAL');
		if (data.tags.includes('TAG_REMIX')) extraTags.push('REMIX');
		if (data.tags.includes('TAG_OVA')) extraTags.push('OVA');
		if (data.tags.includes('TAG_ONA')) extraTags.push('ONA');
		if (data.tags.includes('TAG_MOVIE')) extraTags.push('MOVIE');
		if (data.tags.includes('TAG_PS4')) extraTags.push('PS4');
		if (data.tags.includes('TAG_PSV')) extraTags.push('PSV');
		if (data.tags.includes('TAG_PSP')) extraTags.push('PSP');
		if (data.tags.includes('TAG_XBOX360')) extraTags.push('XBOX360');
		if (data.tags.includes('TAG_GAMECUBE')) extraTags.push('GAMECUBE');
		if (data.tags.includes('TAG_DS')) extraTags.push('DS');
		if (data.tags.includes('TAG_3DS')) extraTags.push('3DS');
		if (data.tags.includes('TAG_PC')) extraTags.push('PC');
		if (data.tags.includes('TAG_SEGACD')) extraTags.push('SEGACD');
		if (data.tags.includes('TAG_SATURN')) extraTags.push('SATURN');
		if (data.tags.includes('TAG_WII')) extraTags.push('WII');
		if (data.tags.includes('TAG_SWITCH')) extraTags.push('SWITCH');
		if (data.tags.includes('TAG_VIDEOGAME')) extraTags.push('GAME');
		let extraType = '';
		if (extraTags.length > 0) extraType = extraTags.join(' ') + ' ';
		const fileLang = data.lang[0].toUpperCase();
		return sanitizeFile(`${fileLang} - ${data.series[0] || data.singer} - ${extraType}${getType(data.type)}${data.order} - ${data.title}`);
	}
}

async function importKara(mediaFile, subFile, data) {
	const mediaFileTemp = data.mediafile;
	const subFileTemp = data.subfile;
	const kara = defineFilename(data);
	let karaSubFile;
	subFile === 'dummy.ass'
		? karaSubFile = subFile
		: karaSubFile = `${kara}${extname(subFile || '.ass')}`;
	let karaData = formatKara({ ...data,
		mediafile: `${kara}${extname(mediaFile)}`,
		subfile: karaSubFile
	});
	karaData.overwrite = data.overwrite;

	// Extract media info, find subfile, and process series before moving files
	const conf = getConfig();
	const mediaPath = resolve(conf.Path.Temp, mediaFileTemp);
	let subPath;
	if (subFile !== 'dummy.ass') subPath = await findSubFile(mediaPath, karaData, subFileTemp);

	// Autocreating groups based on song year

	if (+karaData.year >= 1950 && +karaData.year <= 1959 && !karaData.groups.includes('50s')) karaData.groups.push('50s');
	if (+karaData.year >= 1960 && +karaData.year <= 1969 && !karaData.groups.includes('60s')) karaData.groups.push('60s');
	if (+karaData.year >= 1970 && +karaData.year <= 1979 && !karaData.groups.includes('70s')) karaData.groups.push('70s');
	if (+karaData.year >= 1980 && +karaData.year <= 1989 && !karaData.groups.includes('80s')) karaData.groups.push('80s');
	if (+karaData.year >= 1990 && +karaData.year <= 1999 && !karaData.groups.includes('90s')) karaData.groups.push('90s');
	if (+karaData.year >= 2000 && +karaData.year <= 2009 && !karaData.groups.includes('2000s')) karaData.groups.push('2000s');
	if (+karaData.year >= 2010 && +karaData.year <= 2019 && !karaData.groups.includes('2010s')) karaData.groups.push('2010s');
	if (+karaData.year >= 2020 && +karaData.year <= 2029 && !karaData.groups.includes('2020s')) karaData.groups.push('2010s');

	try {
		if (subPath !== 'dummy.ass') await extractAssInfos(subPath, karaData);
		await extractMediaTechInfos(mediaPath, karaData);
		await processSeries(data);
		return await generateAndMoveFiles(mediaPath, subPath, karaData);
	} catch(err) {
		const error = `Error importing ${kara} : ${err}`;
		logger.error(`[KaraGen] ${error}`);
		throw error;
	}
}

async function processSeries(kara) {
	const seriesDB = await selectAllSeries();
	for (const serie of kara.series) {
		const serieObj = {
			name: serie,
			i18n: {},
			sid: uuidV4()
		};
		serieObj.i18n[kara.lang[0]] = serie;
		if (seriesDB.filter(s => s.name === serie).length === 0) {
			//No series found in database, we'll have to create a series file.
			await writeSeriesFile(serieObj);
		}
	}
}

async function findSubFile(mediaPath, karaData, subFile) {
	// Replacing file extension by .ass in the same directory
	// Default is media + .ass instead of media extension.
	// If subfile exists, assFile becomes that.
	const conf = getConfig();
	let assFile = replaceExt(mediaPath, '.ass');
	if (subFile) assFile = resolve(conf.Path.Temp, subFile);
	if (await asyncExists(assFile) && subFile !== 'dummy.ass') {
		// If a subfile is found, adding it to karaData
		karaData.subfile = replaceExt(karaData.mediafile, '.ass');
		return assFile;
	} else if (mediaPath.endsWith('.mkv')) {
		// In case of a mkv, we're going to extract its subtitles track
		try {
			const extractFile = await extractVideoSubtitles(mediaPath, karaData.KID);
			karaData.subfile = replaceExt(karaData.mediafile, '.ass');
			return extractFile;
		} catch (err) {
			// Non-blocking.
			logger.info('[KaraGen] Could not extract subtitles from video file ' + mediaPath + ' : ' + err);
			return 'dummy.ass';
		}
	} else {
		return 'dummy.ass';
	}
}

async function generateAndMoveFiles(mediaPath, subPath, karaData) {
	// Generating kara file in the first kara folder
	const conf = getConfig();
	const karaFilename = replaceExt(karaData.mediafile, '.kara');
	const karaPath = resolve(conf.Path.Inbox, karaFilename);
	if (subPath === 'dummy.ass') karaData.subfile = 'dummy.ass';
	karaData.series = karaData.series.join(',');
	karaData.groups = karaData.groups.join(',');
	karaData.lang = karaData.lang.join(',');
	karaData.singer = karaData.singer.join(',');
	karaData.songwriter = karaData.songwriter.join(',');
	karaData.tags = karaData.tags.join(',');
	karaData.creator = karaData.creator.join(',');
	karaData.author = karaData.author.join(',');
	const mediaDest = resolve(conf.Path.Inbox, karaData.mediafile);
	let subDest;
	if (subPath && karaData.subfile !== 'dummy.ass') subDest = resolve(conf.Path.Inbox, karaData.subfile);
	try {
		// Moving media
		await asyncMove(mediaPath, mediaDest, { overwrite: karaData.overwrite });
		// Moving subfile
		if (subDest) await asyncMove(subPath, subDest, { overwrite: karaData.overwrite });
		delete karaData.overwrite;
	} catch (err) {
		throw `Error while moving files. Maybe destination files (${mediaDest} or ${subDest} already exist? (${err})`;
	}
	await writeKara(karaPath, karaData);
	return {
		data: karaData,
		file: karaPath
	};
}