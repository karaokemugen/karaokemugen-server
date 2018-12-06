import {getConfig} from './config';
import {getAllKaras} from '../_services/kara';
import { asyncReadDir, asyncUnlink, asyncExists } from './files';
import {resolve} from 'path';
import { createThumbnail } from './ffmpeg';
import logger from 'winston';

let creatingThumbnails = false;

export async function createVideoPreviews() {
	if (creatingThumbnails) throw 'Creating video previews in progress, please wait a moment and try again later';
	creatingThumbnails = true;
	const conf = getConfig();
	const karas = await getAllKaras();
	const previewFiles = await asyncReadDir(resolve(conf.appPath, conf.Path.Previews));
	// Remove unused previewFiles
	for (const file of previewFiles) {
		const fileParts = file.split('.');
		let mediasize;
		const found = karas.content.some(k => {
			// If it returns true, we found a karaoke. We'll check mediasize of that kara to determine if we need to remove the preview and recreate it.
			// Since .some stops after a match, mediasize will be equal to the latest kara parsed's mediafile
			mediasize = k.mediasize;
			return k.kid === fileParts[0];
		});
		if (found) {
			// Compare mediasizes. If mediasize is different, remove file
			if (mediasize !== +fileParts[1]) asyncUnlink(resolve(conf.appPath, conf.Path.Previews, file));
		} else {
			// No kara with that KID found in database, the preview files must be removed
			asyncUnlink(resolve(conf.appPath, conf.Path.Previews, file));
		}
	}
	// Now create non-existing previews
	for (const index in karas.content) {
		const kara = karas.content[index];
		const counter = +index + 1;
		if (!await asyncExists(resolve(conf.appPath, conf.Path.Previews, `${kara.kid}.${kara.mediasize}.25.png`)) && !kara.mediafile.endsWith('.mp3')) {
			logger.info(`[Previews] Creating thumnbails for ${kara.mediafile} (${counter}/${karas.content.length})`);
			const creates = [
				createThumbnail(
					resolve(conf.appPath, conf.Path.Medias, kara.mediafile),
					25,
					kara.duration,
					kara.mediasize,
					kara.kid
				),
				createThumbnail(
					resolve(conf.appPath, conf.Path.Medias, kara.mediafile),
					33,
					kara.duration,
					kara.mediasize,
					kara.kid
				),
				createThumbnail(
					resolve(conf.appPath, conf.Path.Medias, kara.mediafile),
					50,
					kara.duration,
					kara.mediasize,
					kara.kid
				)
			];
			await Promise.all(creates);
		}
	};
	logger.info('[Previews] Finished generating thumbnails');
	creatingThumbnails = false;
}
