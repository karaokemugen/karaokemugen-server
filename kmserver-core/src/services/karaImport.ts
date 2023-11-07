/**
 * .kara files generation
 */

import { promises as fs } from 'fs';
import { copy } from 'fs-extra';
import { basename, resolve } from 'path';
import { v4 as UUIDv4 } from 'uuid';
import logger from 'winston';

import { insertKara, updateKaraParents } from '../dao/kara.js';
import { applyKaraHooks, refreshHooks } from '../lib/dao/hook.js';
import { extractVideoSubtitles, getDataFromKaraFile, verifyKaraData } from '../lib/dao/karafile.js';
import {
	defineFilename,
	determineMediaAndLyricsFilenames,
	processSubfile
} from '../lib/services/karaCreation.js';
import { refreshKarasAfterDBChange, updateTags } from '../lib/services/karaManagement.js';
import { EditedKara, KaraFileV4 } from '../lib/types/kara.js';
import { getConfig, resolvedPath, resolvedPathRepos } from '../lib/utils/config.js';
import { ErrorKM } from '../lib/utils/error.js';
import { replaceExt, smartMove } from '../lib/utils/files.js';
import { removeControlCharsInObject } from '../lib/utils/objectHelpers.js';
import { EditElement } from '../types/karaImport.js';
import sentry from '../utils/sentry.js';
import { createInboxIssue } from './gitlab.js';
import { addKaraInInbox } from './inbox.js';
import { getKara } from './kara.js';

const service = 'KaraImport';

// Preflight checks before any import operation
async function preflight(kara: KaraFileV4): Promise<KaraFileV4> {
	// Force values for new karaokes to avoid main repo pollution
	kara = removeControlCharsInObject(kara);
	kara.data.repository = 'Staging';
	kara.data.kid = UUIDv4();
	// Validation here, processing stuff later
	// No sentry triggered if validation fails
	try {
		verifyKaraData(kara);
		return kara;
	} catch (err) {
		logger.error('Bad import data', { service, obj: {err, kara}});
		throw new ErrorKM('BAD_IMPORT_DATA_ERROR', 400, false);
	}
}

// Common work between edits and creations
async function heavyLifting(kara: KaraFileV4, contact: string, edit?: EditElement): Promise<string> {
	const conf = getConfig();
	try {
		// Refresh hooks at every kara we get.
		await refreshHooks();
		await applyKaraHooks(kara);
		logger.debug(`Kara during HeavyLifting: ${JSON.stringify(kara)}`, { service });
		const fileName = await defineFilename(kara);
		// Move files to their own directory
		const filenames = determineMediaAndLyricsFilenames(kara, fileName);
		const mediaPath = resolve(resolvedPath('Temp'), kara.medias[0].filename);
		const mediaDest = resolve(resolvedPathRepos('Medias', kara.data.repository)[0], filenames.mediafile);
		logger.debug(`mediaPath: ${mediaPath}`, { service });
		logger.debug(`mediaDest: ${mediaDest}`, { service });
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
			logger.debug(`subPath: ${subPath}`, { service });
			logger.debug(`subDest: ${subDest}`, { service });
			const ext = await processSubfile(subPath);
			await smartMove(subPath, subDest, { overwrite: true });
			kara.medias[0].lyrics[0].filename = replaceExt(filenames.lyricsfile, ext);
		}
		await smartMove(mediaPath, mediaDest, { overwrite: true });
		kara.medias[0].filename = filenames.mediafile;
		const karaDest = resolve(resolvedPathRepos('Karaokes', kara.data.repository)[0], `${fileName}.kara.json`);
		await fs.writeFile(karaDest, JSON.stringify(kara, null, 2), 'utf-8');
		const karaData = await getDataFromKaraFile(karaDest, kara, { media: true, lyrics: true });
		karaData.meta.karaFile = basename(karaData.meta.karaFile);
		await insertKara(karaData);
		await Promise.all([updateKaraParents(karaData.data), updateTags(karaData.data)]);
		await refreshKarasAfterDBChange('ADD', [karaData.data]);
		logger.debug('Kara', {service, obj: karaData});
		let issueURL: string;
		if (conf.Gitlab.Enabled) {
			if (edit) {
				edit.oldKara = await getKara({
					q: `k:${edit.kid}`,
					ignoreCollections: true
				});
			}
			issueURL = await createInboxIssue(karaData.data.kid, edit);
		}
		addKaraInInbox(kara, contact, issueURL, edit ? edit.kid : undefined);
		return issueURL;
	} catch (err) {
		logger.error('Error importing kara', {service, obj: err});
		sentry.addErrorInfo('Kara', JSON.stringify(kara, null, 2));
		throw err;
	}
}

export async function editKara(edit: EditedKara, contact: string): Promise<string> {
	try {
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
		return await heavyLifting(kara, contact, {
			kid: edited_kid,
			modifiedLyrics: edit.modifiedLyrics,
			modifiedMedia: edit.modifiedMedia
		});
	} catch (err) {
		logger.error('Error editing kara', { service, obj: err });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('EDIT_KARA_ERROR');
	}
}

export async function createKara(kara: KaraFileV4, contact: string): Promise<string> {
	try {
		kara = await preflight(kara);
		return await heavyLifting(kara, contact);
	} catch (err) {
		logger.error('Error editing kara', { service, obj: err });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('IMPORT_KARA_ERROR');
	}
}
