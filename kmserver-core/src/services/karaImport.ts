/**
 * .kara files generation
 */

import { copy } from 'fs-extra';
import { basename, resolve } from 'path';
import { v4 as UUIDv4 } from 'uuid';
import logger from 'winston';

import { insertKara, updateKaraParents } from '../dao/kara.js';
import { refreshAllKaraTag } from '../dao/tag.js';
import { applyKaraHooks, refreshHooks } from '../lib/dao/hook.js';
import { extractVideoSubtitles, trimKaraData, verifyKaraData, writeKara } from '../lib/dao/karafile.js';
import { defineSongname, determineMediaAndLyricsFilenames, processSubfile } from '../lib/services/karaCreation.js';
import { refreshKarasAfterDBChange, updateTags } from '../lib/services/karaManagement.js';
import { consolidateTagsInRepo } from '../lib/services/tag.js';
import { EditedKara, KaraFileV4 } from '../lib/types/kara.js';
import { getConfig, resolvedPath, resolvedPathRepos } from '../lib/utils/config.js';
import { ErrorKM } from '../lib/utils/error.js';
import { replaceExt, smartMove } from '../lib/utils/files.js';
import { removeControlCharsInObject, sortJSON } from '../lib/utils/objectHelpers.js';
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
		logger.error('Bad import data', { service, obj: { err, kara } });
		throw new ErrorKM('BAD_IMPORT_DATA_ERROR', 400, false);
	}
}

// Common work between edits and creations
async function heavyLifting(kara: KaraFileV4, contact: string, edit?: EditElement): Promise<string> {
	const conf = getConfig();
	try {
		// Refresh hooks at every kara we get.
		await refreshHooks();
		await applyKaraHooks(kara, true);
		logger.debug(`Kara during HeavyLifting: ${JSON.stringify(kara)}`, { service });
		const songname = await defineSongname(kara);
		kara.data.songname = songname.songname;
		if (edit) {
			songname.sanitizedFilename = edit.kid
		}
		logger.debug(`songName: ${songname.sanitizedFilename}`, { service });
		// Move files to their own directory
		const filenames = determineMediaAndLyricsFilenames(kara);
		logger.debug(`mediafile: ${filenames.mediafile}`, { service });
		logger.debug(`lyricsfile: ${filenames.lyricsfiles[0]}`, { service });
		const mediaPath = resolve(resolvedPath('Temp'), kara.medias[0].filename);
		logger.debug(`mediaPath: ${mediaPath}`, { service });
		const mediaDest = resolve(resolvedPathRepos('Medias', kara.data.repository)[0], filenames.mediafile);
		logger.debug(`mediaDest: ${mediaDest}`, { service });
		try {
			const { extractFile, mediasize } = await extractVideoSubtitles(mediaPath, kara.data.kid);
			if (extractFile) {
				kara.medias[0].filesize = mediasize;
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
			const subDest = resolve(resolvedPathRepos('Lyrics', kara.data.repository)[0], filenames.lyricsfiles[0]);
			logger.debug(`subPath: ${subPath}`, { service });
			logger.debug(`subDest: ${subDest}`, { service });
			const ext = await processSubfile(subPath);
			await smartMove(subPath, subDest, { overwrite: true });
			kara.medias[0].lyrics[0].filename = replaceExt(filenames.lyricsfiles[0], ext);
		}
		await smartMove(mediaPath, mediaDest, { overwrite: true });
		kara.medias[0].filename = filenames.mediafile;

		// Sort stuff inside kara JSON.

		kara.data = sortJSON(kara.data);
		kara.medias[0] = sortJSON(kara.medias[0]);
		if (kara.medias[0].lyrics[0]) kara.medias[0].lyrics[0] = sortJSON(kara.medias[0].lyrics[0]);

		const karaFile = `${songname.sanitizedFilename}.kara.json`;
		const karaDest = resolve(
			resolvedPathRepos('Karaokes', kara.data.repository)[0],
			karaFile,
		);
		await writeKara(karaDest, kara);
		kara.meta.karaFile = karaFile;
		await insertKara(kara);
		await Promise.all([updateKaraParents(kara.data), updateTags(kara.data)]);
		await refreshKarasAfterDBChange('ADD', [kara.data]);
		await refreshAllKaraTag();
		logger.debug('Kara', { service, obj: kara });
		let issueURL: string;
		if (conf.Gitlab.Enabled) {
			if (edit) {
				edit.oldKara = await getKara({
					q: `k:${edit.kid}`,
					ignoreCollections: true,
				});
			}
			try {
				issueURL = await createInboxIssue(kara.data.kid, edit);
			} catch (err) {
				logger.error(`Unable to post to Gitlab a new inbox issue: ${err}`, { service, obj: err });
				// Non fatal.
			}
		}
		addKaraInInbox(kara, contact, issueURL, edit ? edit.kid : undefined);
		consolidateTagsInRepo(kara);
		return issueURL;
	} catch (err) {
		logger.error('Error importing kara', { service, obj: JSON.stringify(err) });
		sentry.addErrorInfo('Kara', JSON.stringify(kara, null, 2));
		throw err;
	}
}

export async function editKara(editedKara: EditedKara, contact: string): Promise<string> {
	try {
		let kara = trimKaraData(editedKara.kara);
		const conf = getConfig();
		const onlineRepo = conf.System.Repositories.find((r) => r.Name !== 'Staging').Name;
		const edited_kid = kara.data.kid;
		kara = await preflight(kara);
		// Before the heavy lifting (tm), we should make copies of media and/or lyrics if they were not edited.
		if (!editedKara.modifiedLyrics && kara.medias[0].lyrics.length > 0) {
			await copy(
				resolve(resolvedPathRepos('Lyrics', onlineRepo)[0], kara.medias[0].lyrics[0].filename),
				resolve(resolvedPath('Temp'), kara.medias[0].lyrics[0].filename),
				{ overwrite: true },
			);
		}
		if (!editedKara.modifiedMedia) {
			await copy(
				resolve(resolvedPathRepos('Medias', onlineRepo)[0], kara.medias[0].filename),
				resolve(resolvedPath('Temp'), kara.medias[0].filename),
				{ overwrite: true },
			);
		}
		// And now for the fun part
		return await heavyLifting(kara, contact, {
			kid: edited_kid,
			modifiedLyrics: editedKara.modifiedLyrics,
			modifiedMedia: editedKara.modifiedMedia,
		});
	} catch (err) {
		logger.error('Error editing kara', { service, obj: err });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('EDIT_KARA_ERROR');
	}
}

export async function createKara(editedKara: KaraFileV4, contact: string): Promise<string> {
	try {
		let kara = trimKaraData(editedKara);
		kara = await preflight(kara);
		return await heavyLifting(kara, contact);
	} catch (err) {
		logger.error('Error creating kara', { service, obj: err });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('IMPORT_KARA_ERROR');
	}
}
