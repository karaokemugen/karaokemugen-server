import {getConfig} from '../_utils/config';
import {asyncWriteFile, asyncStat, checksum, asyncExists, asyncReadFile} from '../_utils/files';
import {parse as parseini} from 'ini';
import logger from 'winston';
import {resolve} from 'path';
import {extractSubtitles, getMediaInfo} from '../_utils/ffmpeg';
import {formatKara} from '../_services/kara';
import {now} from 'unix-timestamp';
import {stringify} from 'ini';

let error = false;

export async function parseKara(karaFile) {
	let data: any = await asyncReadFile(karaFile, 'utf-8');
	data = data.replace(/\r/g, '');
	return parseini(data);
}

export async function writeKara(karafile, karaData) {
	if (!karaData.isKaraModified) return;
	const infosToWrite: any = (formatKara(karaData));
	infosToWrite.datemodif = now();
	delete infosToWrite.karafile;
	await asyncWriteFile(karafile, stringify(infosToWrite));
}

export async function getDataFromKaraFile(karafile) {
	const conf = getConfig();
	const karaData = await parseKara(karafile);

	karaData.karafile = karafile;
	try {
		await asyncExists(resolve(conf.appPath, conf.Path.Medias, karaData.mediafile));
	} catch (err) {
		logger.error('[Kara] Media file not found : ' + karaData.mediafile);
		error = true;
	}
	try {
		if (karaData.subfile !== 'dummy.ass') await asyncExists(resolve(conf.appPath, conf.Path.Lyrics, karaData.subfile));
	} catch (err) {
		logger.warn(`[Kara] Could not find subfile '${karaData.subfile}'`);
		error = true;
	}

	if (error) karaData.error = true;

	return karaData;
}

export async function extractAssInfos(subFile, karaData) {
	if (subFile) {
		karaData.ass = await asyncReadFile(subFile, {encoding: 'utf8'});
		karaData.ass = karaData.ass.replace(/\r/g, '');
		const subChecksum = checksum(karaData.ass);
		if (subChecksum !== karaData.subchecksum) {
			karaData.isKaraModified = true;
			karaData.subchecksum = subChecksum;
		}
	} else {
		karaData.ass = '';
	}
	return karaData;
}

export async function extractVideoSubtitles(videoFile, kid) {
	const extractFile = resolve(getConfig().Path.Temp, `kara_extract.${kid}.ass`);
	try {
		await extractSubtitles(videoFile, extractFile);
		return extractFile;
	} catch (err) {
		throw err;
	}
}

export async function extractMediaTechInfos(mediaFile, karaData) {
	const mediaStats = await asyncStat(mediaFile);
	if (mediaStats.size !== +karaData.mediasize) {
		karaData.isKaraModified = true;
		karaData.mediasize = mediaStats.size;
		const mediaData = await getMediaInfo(mediaFile);
		if (mediaData.error) error = true;
		karaData.mediagain = mediaData.audiogain;
		karaData.mediaduration = mediaData.duration;
	}
}