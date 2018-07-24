import {getConfig} from '../_utils/config';
import {asyncExists, asyncReadFile} from '../_utils/files';
import {parse as parseini} from 'ini';
import logger from 'winston';
import {resolve} from 'path';

let error = false;


export async function parseKara(karaFile) {
	let data = await asyncReadFile(karaFile, 'utf-8');
	data = data.replace(/\r/g, '');
	return parseini(data);
}

export async function getDataFromKaraFile(karafile) {
	const conf = getConfig();
	const karaData = await parseKara(karafile);

	// Code to keep compatibility with v2 kara files.
	karaData.mediafile = karaData.mediafile || karaData.videofile;
	karaData.mediasize = karaData.mediasize || karaData.videosize;
	karaData.mediagain = karaData.mediagain || karaData.videogain;
	karaData.mediaduration = karaData.mediaduration || karaData.videoduration;
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
