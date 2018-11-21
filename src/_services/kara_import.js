/**
 * .kara files generation
 */

import logger from 'winston';
import {extname, resolve} from 'path';
import {getConfig} from '../_utils/config';
import {sanitizeFile, asyncCopy, asyncUnlink, asyncExists, asyncMove, replaceExt} from '../_common/utils/files';
import {
	extractAssInfos, extractVideoSubtitles, extractMediaTechInfos, karaFilenameInfos, writeKara
} from '../_dao/karafile';
import {getType} from '../_services/constants';
import {formatKara} from '../_services/kara';
import {check} from '../_utils/validators';
import timestamp from 'unix-timestamp';
import {sendMail} from '../_utils/mailer';

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
		singer = string (elements separated by ,) (see results from GET /api/v1/tags, type is 2)
		songwriter = string (elements separated by ,) (see results from GET /api/v1/tags, type is 8)
		tags = string (elements separated by ,) (see tags from constants)
		creator = string (elements separated by ,) (see results from GET /api/v1/tags, type is 4)
		author = string (elements separated by ,) (see results from GET /api/v1/tags, type is 6)
		lang = string (elements separated by ,) (get iso639-2B from langs.codes("2B") )
		mediafile = mediafile name as uploaded
		subfile = subfile name as uploaded
		mediafile_orig = Original name from the user's computer
		subfile_orig = Original name from the user's computer
	}
	*/
	if (!opts) opts = {};
	if ((kara.type !== 'MV' || kara.type !== 'LIVE') && kara.series.length < 1) throw 'Series cannot be empty if type is not MV or LIVE';
	if (!kara.mediafile) throw 'No media file uploaded';
	const validationErrors = check(kara, {
		year: {integerValidator: true},
		lang: {langValidator: true},
		tags: {tagsValidator: true},
		type: {typeValidator: true},
		order: {integerValidator: true},
		series: {presence: true},
		title: {presence: true}
	});
	// Copy files from temp directory to import, depending on the different cases.
	const newMediaFile = `${kara.mediafile}${extname(kara.mediafile_orig)}`;
	let newSubFile;
	if (kara.subfile && kara.subfile !== 'dummy.ass' && kara.subfile_orig) newSubFile = `${kara.subfile}${extname(kara.subfile_orig)}`;
	if (kara.subfile === 'dummy.ass') newSubFile = kara.subfile;
	delete kara.subfile_orig;
	delete kara.mediafile_orig;
	await asyncCopy(resolve(getConfig().Path.Temp,kara.mediafile),resolve(getConfig().Path.Inbox,newMediaFile), { overwrite: true });
	if (kara.subfile && kara.subfile !== 'dummy.ass') await asyncCopy(resolve(getConfig().Path.Temp,kara.subfile),resolve(getConfig().Path.Inbox,newSubFile), { overwrite: true });

	let newKara;
	try {
		if (validationErrors) throw JSON.stringify(validationErrors);
		timestamp.round = true;
		if (!kara.dateadded) kara.dateadded = timestamp.now();
		//Trim spaces before and after elements.
		kara.series.forEach((e,i) => kara.series[i] = e.trim());
		kara.lang.forEach((e,i) => kara.lang[i] = e.trim());
		kara.singer.forEach((e,i) => kara.singer[i] = e.trim());
		kara.groups.forEach((e,i) => kara.group[i] = e.trim());
		kara.songwriter.forEach((e,i) => kara.songwriter[i] = e.trim());
		kara.tags.forEach((e,i) => kara.tags[i] = e.trim());
		kara.creator.forEach((e,i) => kara.creator[i] = e.trim());
		kara.author.forEach((e,i) => kara.author[i] = e.trim());
		if (!kara.order) kara.order = '';
		newKara = await importKara(newMediaFile, newSubFile, kara);
		sendMail(`[KMServer] New karaoke uploaded by ${newKara.author}`,'Check your inbox folder');
		return newKara;
	} catch(err) {
		logger.error(`[Karagen] Error during generation : ${err}`);
		if (await asyncExists(newMediaFile)) await asyncUnlink(newMediaFile);
		if (newSubFile) if (await asyncExists(newSubFile)) await asyncUnlink(newSubFile);
		throw err;
	}
}

async function importKara(mediaFile, subFile, data) {
	let kara = mediaFile;
	if (data) {
		const fileLang = data.lang[0].toUpperCase();
		kara = sanitizeFile(`${fileLang} - ${data.series[0] || data.singer} - ${getType(data.type)}${data.order} - ${data.title}`);
	}

	logger.info('[KaraGen] Generating kara file for media ' + kara);
	let karaSubFile;
	subFile === 'dummy.ass' ? karaSubFile = subFile : karaSubFile = `${kara}${extname(subFile || '.ass')}`;
	let karaData = formatKara({ ...data,
		mediafile: `${kara}${extname(mediaFile)}`,
		subfile: karaSubFile
	});
	karaData.overwrite = data.overwrite;
	if (!data) karaData = {mediafile: mediaFile, ...karaDataInfosFromFilename(mediaFile)};

	const mediaPath = resolve(getConfig().Path.Inbox, mediaFile);
	let subPath;
	if (subFile !== 'dummy.ass') subPath = await findSubFile(mediaPath, karaData, subFile);
	try {
		if (subPath !== 'dummy.ass') await extractAssInfos(subPath, karaData);
		await extractMediaTechInfos(mediaPath, karaData);
		return await generateAndMoveFiles(mediaPath, subPath, karaData);
	} catch(err) {
		const error = `Error importing ${kara} : ${err}`;
		logger.error(`[KaraGen] ${error}`);
		throw error;
	}
}

function karaDataInfosFromFilename(mediaFile) {
	try {
		const filenameInfos = karaFilenameInfos(mediaFile);
		const common = {
			title: filenameInfos.title,
			type: getType(filenameInfos.type),
			order: filenameInfos.order,
			lang: filenameInfos.lang
		};

		if (filenameInfos.type === 'LIVE' || filenameInfos.type === 'MV') {
			return { ...common, singer: filenameInfos.serie };
		} else {
			return { ...common, series: filenameInfos.serie };
		}
	} catch (err) {
		// File not named correctly
		logger.warn('[KaraGen] Bad kara file name: ' + err);
	}
	return {};
}

async function findSubFile(mediaPath, karaData, subFile) {
	// Replacing file extension by .ass in the same directory
	let assFile = replaceExt(mediaPath, '.ass');
	if (subFile) assFile = resolve(getConfig().Path.Inbox, subFile);
	if (await asyncExists(assFile) && subFile !== 'dummy.ass') {
		// If a subfile is found, adding it to karaData
		karaData.subfile = replaceExt(karaData.mediafile, '.ass');
		return assFile;
	} else if (mediaPath.endsWith('.mkv')) {
		try {
			const extractFile = await extractVideoSubtitles(mediaPath, karaData.KID);
			karaData.subfile = replaceExt(karaData.mediafile, '.ass');
			return extractFile;
		} catch (err) {
			// Non-blocking.
			logger.info('[KaraGen] Could not extract subtitles from video file ' + mediaPath + ' : ' + err);
		}
	} else {
		return 'dummy.ass';
	}
}


async function generateAndMoveFiles(mediaPath, subPath, karaData) {
	// Generating kara file in the first kara folder
	const conf = getConfig();
	const karaFilename = replaceExt(karaData.mediafile, '.kara');
	const karaPath = resolve(conf.Path.Inbox, 'karas/', sanitizeFile(karaData.author[0]), karaFilename);
	const mediaDest = resolve(conf.Path.Inbox, 'medias/', sanitizeFile(karaData.author[0]), karaData.mediafile);
	if (subPath === 'dummy.ass') karaData.subfile = 'dummy.ass';
	let subDest;
	if (subPath && karaData.subfile !== 'dummy.ass') subDest = resolve(conf.Path.Inbox, 'lyrics/', sanitizeFile(karaData.author[0]), karaData.subfile);
	karaData.series = karaData.series.join(',');
	karaData.groups = karaData.groups.join(',');
	karaData.lang = karaData.lang.join(',');
	karaData.singer = karaData.singer.join(',');
	karaData.songwriter = karaData.songwriter.join(',');
	karaData.tags = karaData.tags.join(',');
	karaData.creator = karaData.creator.join(',');
	karaData.author = karaData.author.join(',');
	try {
		// Moving media in the first media folder.
		await asyncMove(mediaPath, mediaDest, { overwrite: karaData.overwrite });
		// Moving subfile in the first lyrics folder.
		if (subDest) await asyncMove(subPath, subDest, { overwrite: karaData.overwrite });
		delete karaData.overwrite;
	} catch (err) {
		throw `Error while moving files. Maybe destination files (${mediaDest} or ${subDest} already exist? (${err})`;
	}
	karaData.isKaraModified = true;
	await writeKara(karaPath, karaData);
	return {
		data: karaData,
		file: karaPath
	};
}