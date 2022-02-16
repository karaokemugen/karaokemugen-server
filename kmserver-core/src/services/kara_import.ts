/**
 * .kara files generation
 */

import { v4 as UUIDv4 } from 'uuid';
import logger from 'winston';
import { basename, resolve } from 'path';
import { promises as fs } from 'fs';
import { copy } from 'fs-extra';
import { getConfig, resolvedPath, resolvedPathRepos } from '../lib/utils/config';
import { EditedKara, KaraFileV4 } from '../lib/types/kara';
import { gitlabPostNewSuggestion } from './gitlab';
import { smartMove } from '../lib/utils/files';
import sentry from '../utils/sentry';
import { addKaraInInbox } from './inbox';
import { extractVideoSubtitles, getDataFromKaraFile, verifyKaraData } from '../lib/dao/karafile';
import {
	applyKaraHooks,
	defineFilename,
	determineMediaAndLyricsFilenames,
	processSubfile
} from '../lib/services/karaCreation';
import { insertKara } from '../dao/kara';
import { refreshKarasAfterDBChange, updateTags } from '../lib/services/karaManagement';
import { EditElement } from '../types/kara_import';


// Preflight checks before any import operation
async function preflight(kara: KaraFileV4): Promise<KaraFileV4> {
	// Force values for new karaokes to avoid main repo pollution
	kara.data.repository = 'Staging';
	kara.data.kid = UUIDv4();
	// Validation here, processing stuff later
	// No sentry triggered if validation fails
	try {
		verifyKaraData(kara);
	} catch(err) {
		throw {code: 400, msg: err};
	}

	return kara;
}

// Common work between edits and creations
async function heavyLifting(kara: KaraFileV4, contact: string, edit?: EditElement): Promise<string> {
	const conf = getConfig();
	try {
		await applyKaraHooks(kara);
		const fileName = await defineFilename(kara);
		// Move files to their own directory
		const filenames = determineMediaAndLyricsFilenames(kara, fileName);
		const mediaPath = resolve(resolvedPath('Temp'), kara.medias[0].filename);
		const mediaDest = resolve(resolvedPathRepos('Medias', kara.data.repository)[0], filenames.mediafile);
		try {
			const extractFile = await extractVideoSubtitles(mediaPath, kara.data.kid);
			if (extractFile) {
				kara.medias[0].lyrics[0] = {
					filename: basename(extractFile),
					version: 'Default',
					default: true,
				};
			}
		} catch (err) {
			// Not lethal
		}
		if (kara.medias[0].lyrics[0]) {
			const subPath = resolve(resolvedPath('Temp'), kara.medias[0].lyrics[0].filename);
			const subDest = resolve(resolvedPathRepos('Lyrics', kara.data.repository)[0], filenames.lyricsfile);
			await processSubfile(subPath, mediaPath);
			await smartMove(subPath, subDest, { overwrite: true });
			kara.medias[0].lyrics[0].filename = filenames.lyricsfile;
		}
		await smartMove(mediaPath, mediaDest, { overwrite: true });
		kara.medias[0].filename = filenames.mediafile;
		const karaDest = resolve(resolvedPathRepos('Karaokes', kara.data.repository)[0], fileName + '.kara.json');
		await fs.writeFile(karaDest, JSON.stringify(kara, null, 2), 'utf-8');
		const karaData = await getDataFromKaraFile(karaDest, kara, { media: true, lyrics: true });
		karaData.karafile = basename(karaData.karafile);
		await insertKara(karaData);
		await updateTags(karaData);
		await refreshKarasAfterDBChange('ADD', [karaData]);
		logger.debug('Kara', {service: 'Import', obj: karaData});
		let issueURL: string;
		if (conf.Gitlab.Enabled) {
			issueURL = await gitlabPostNewSuggestion(karaData.kid, edit);
		}
		addKaraInInbox(kara, contact, issueURL, edit ? edit.kid:undefined);
		return issueURL;
	} catch(err) {
		logger.error('Error importing kara', {service: 'KaraGen', obj: err});
		if (!err.msg) {
			sentry.addErrorInfo('Kara', JSON.stringify(kara, null, 2));
			sentry.error(err);
		}
		throw err;
	}
}

export async function editKara(edit: EditedKara, contact: string): Promise<string> {
	const conf = getConfig();
	const onlineRepo = conf.System.Repositories.find(r => r.Name !== 'Staging').Name;
	const edited_kid = edit.kara.data.kid;
	const kara = await preflight(edit.kara);
	// Before the heavy lifting (tm), we should make copies of media and/or lyrics if they were not edited.
	if (!edit.modifiedLyrics && kara.medias[0].lyrics.length > 0) {
		await copy(
			resolve(resolvedPathRepos('Lyrics', onlineRepo)[0], kara.medias[0].lyrics[0].filename),
			resolve(resolvedPath('Temp'), kara.medias[0].lyrics[0].filename),
			{ overwrite: true }
		);
	}
	if (!edit.modifiedMedia) {
		await copy(
			resolve(resolvedPathRepos('Medias', onlineRepo)[0], kara.medias[0].filename),
			resolve(resolvedPath('Temp'), kara.medias[0].filename),
			{ overwrite: true }
		);
	}
	// And now for the fun part
	return heavyLifting(kara, contact, {
		kid: edited_kid,
		modifiedLyrics: edit.modifiedLyrics,
		modifiedMedia: edit.modifiedMedia
	});
}

export async function createKara(kara: KaraFileV4, contact: string): Promise<string> {
	kara = await preflight(kara);
	return heavyLifting(kara, contact);
}
