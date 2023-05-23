import fs from 'fs/promises';
import { resolve } from 'path';

import { PlaylistMediaFile, PlaylistMediaType } from '../lib/types/playlistMedias.js';
import { playlistMediaTypes } from '../lib/utils/constants.js';
import { getState } from '../utils/state.js';

export async function getPlaylistMedias(type: PlaylistMediaType): Promise<PlaylistMediaFile[]> {
	if (!playlistMediaTypes.includes(type)) throw {code: 400, msg: 'INVALID_PLAYLIST_MEDIA_TYPE'};
	const medias: PlaylistMediaFile[] = [];
	const mediasDir = resolve(getState().dataPath, 'playlistMedias/', type);
	const files = await fs.readdir(mediasDir);
	for (const file of files) {
		const stat = await fs.stat(resolve(mediasDir, file));
		medias.push({ basename: file, size: stat.size });
	}
	return medias;
}
