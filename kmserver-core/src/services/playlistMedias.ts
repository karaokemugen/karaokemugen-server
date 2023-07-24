import fs from 'fs/promises';
import { resolve } from 'path';

import { PlaylistMediaFile, PlaylistMediaType } from '../lib/types/playlistMedias.js';
import { playlistMediaTypes } from '../lib/utils/constants.js';
import { ErrorKM } from '../lib/utils/error.js';
import logger from '../lib/utils/logger.js';
import sentry from '../utils/sentry.js';
import { getState } from '../utils/state.js';

export async function getPlaylistMedias(type: PlaylistMediaType): Promise<PlaylistMediaFile[]> {
	try {
		if (!playlistMediaTypes.includes(type)) throw new ErrorKM('INVALID_PLAYLIST_MEDIA_TYPE', 400, false);
		const medias: PlaylistMediaFile[] = [];
		const mediasDir = resolve(getState().dataPath, 'playlistMedias/', type);
		const files = await fs.readdir(mediasDir);
		for (const file of files) {
			const stat = await fs.stat(resolve(mediasDir, file));
			medias.push({ basename: file, size: stat.size });
		}
		return medias;
	} catch (err) {
		logger.error(`Unable to get playlist medias for type ${type}`);
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('GET_PLMEDIAS_ERROR');
	}
}
