/**
 * .kara files generation
 */

import { copy } from 'fs-extra';
import { basename, resolve } from 'path';
import { v4 as UUIDv4 } from 'uuid';
import logger from 'winston';

import { updateInboxGitlabIssue } from '../dao/inbox.js';
import { insertKara, updateKaraParents } from '../dao/kara.js';
import { refreshAllKaraTag } from '../dao/tag.js';
import { applyKaraHooks, refreshHooks } from '../lib/dao/hook.js';
import { extractVideoSubtitles, trimKaraData, verifyKaraData, writeKara } from '../lib/dao/karafile.js';
import { defineSongname, determineMediaAndLyricsFilenames, processSubfile } from '../lib/services/karaCreation.js';
import { refreshKarasAfterDBChange, updateTags } from '../lib/services/karaManagement.js';
import { consolidateTagsInRepo } from '../lib/services/tag.js';
import { DBInbox, InboxActions } from '../lib/types/inbox.js';
import { EditedKara, KaraFileV4 } from '../lib/types/kara.js';
import { getConfig, resolvedPath, resolvedPathRepos } from '../lib/utils/config.js';
import { ErrorKM } from '../lib/utils/error.js';
import { replaceExt, smartMove } from '../lib/utils/files.js';
import { postNoteToIssue } from '../lib/utils/gitlab.js';
import { removeControlCharsInObject, sortJSON } from '../lib/utils/objectHelpers.js';
import { EditElement } from '../types/karaImport.js';
import sentry from '../utils/sentry.js';
import { createInboxIssue, editInboxIssue } from './gitlab.js';
import { addKaraInInbox, getGitlabIssueNumber, getInbox, setInboxStatus } from './inbox.js';
import { getKara } from './kara.js';
import { canSubmitInbox } from './user.js';

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
async function heavyLifting(kara: KaraFileV4, contact: {name: string, login?: string}, edit?: EditElement): Promise<string> {
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
		const filenames = determineMediaAndLyricsFilenames(kara, edit?.kid);
		logger.debug(`mediafile: ${filenames.mediafile}`, { service });
		logger.debug(`lyricsfile: ${filenames.lyricsfiles[0]}`, { service });
		const mediaPath = resolve(resolvedPath('Temp'), kara.medias[0].filename);
		logger.debug(`mediaPath: ${mediaPath}`, { service });
		const mediaDest = resolve(resolvedPathRepos('Medias', kara.data.repository)[0], filenames.mediafile);
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
		if (conf.Gitlab.Enabled) {
			if (edit) {
				edit.oldKara = await getKara({
					q: `k:${edit.kid}`,
					ignoreCollections: true,
				});
			}

		}
		const inboxes = await getInbox(true);
		const newInid = await addKaraInInbox(kara, contact, edit ? edit.kid : undefined, edit?.inid);
		if (edit?.inid) {
			const inbox = inboxes.find(i => i.inid === edit.inid);
			let status: InboxActions = 'sent';
			if (inbox.status === 'changes_requested' || inbox.status === 'in_review') status = 'in_review';
			setInboxStatus(edit.inid, status);
		} else {
			setInboxStatus(newInid, 'sent');
		}
		consolidateTagsInRepo(kara);
		return newInid ;
	} catch (err) {
		logger.error('Error importing kara', { service, obj: JSON.stringify(err) });
		sentry.addErrorInfo('Kara', JSON.stringify(kara, null, 2));
		throw err;
	}
}

export async function editKara(editedKara: EditedKara, contact: string, login?: string, inid?: string): Promise<string> {
	try {
		// If login needed, raise error if not logged in
		if (!login && getConfig().Frontend.Import.LoginNeeded) {
			throw new ErrorKM('LOGIN_NEEDED', 401, false);
		}
		let kara = trimKaraData(editedKara.kara);
		const conf = getConfig();
		const repoName = conf.System.Repositories.find((r) => r.Name !== 'Staging').Name;
		const sourceRepoName = editedKara.kara.data.repository;
		const edited_kid = kara.data.kid;
		kara = await preflight(kara);
		let inbox: DBInbox;
		if (inid) {
			const inboxes = await getInbox(false);
			inbox = inboxes.filter(i => i.inid === inid)[0];
			if (!inbox) throw new ErrorKM('INBOX_UNKNOWN_ERROR', 404, false);
		}
		// Before the heavy lifting (tm), we should make copies of media and/or lyrics if they were not edited.
		if (!editedKara.modifiedLyrics && kara.medias[0].lyrics.length > 0) {
			await copy(
				resolve(resolvedPathRepos('Lyrics', sourceRepoName)[0], kara.medias[0].lyrics[0].filename),
				resolve(resolvedPath('Temp'), kara.medias[0].lyrics[0].filename),
				{ overwrite: true },
			);
		}
		if (!editedKara.modifiedMedia) {
			await copy(
				resolve(resolvedPathRepos('Medias', sourceRepoName)[0], kara.medias[0].filename),
				resolve(resolvedPath('Temp'), kara.medias[0].filename),
				{ overwrite: true },
			);
		}
		// And now for the fun part
		const edit = {
			kid: edited_kid,
			modifiedLyrics: editedKara.modifiedLyrics,
			modifiedMedia: editedKara.modifiedMedia,
			inid,
		};
		const newInid = await heavyLifting(kara, {
			name: contact,
			login
		}, edit);
		let issueURL = '';
		try {
			if (inid) {
				issueURL = inbox.gitlab_issue;
				if (inbox.status === 'changes_requested') await setInboxStatus(inid, 'in_review');
				if (issueURL) {
					const numberIssue = getGitlabIssueNumber(issueURL);
					await postNoteToIssue(numberIssue, repoName, 'Song has been modified by original uploader: ');
					await editInboxIssue(kara.data.kid, numberIssue, edit);
				}
			} else {
				issueURL = await createInboxIssue(kara.data.kid, edit);
				updateInboxGitlabIssue(newInid, issueURL);
			}
		} catch (err) {
			logger.error(`Unable to post to Gitlab a new inbox issue: ${err}`, { service, obj: err });
			// Non fatal.
		}
		return issueURL;
	} catch (err) {
		logger.error('Error editing kara', { service, obj: err });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('EDIT_KARA_ERROR');
	}
}

export async function createKara(editedKara: KaraFileV4, contact: string, login?: string): Promise<string> {
	try {
		if (getConfig().Frontend.Import.LoginNeeded) {
			// Check if logged in
			if (!login) {
				throw new ErrorKM('LOGIN_NEEDED', 401, false);
			}
			// Will throw if not able to submit.
			await canSubmitInbox(login);
		}
		let kara = trimKaraData(editedKara);
		kara = await preflight(kara);
		const newInid = await heavyLifting(kara, {name: contact, login});
		let issueURL = '';
		try {
			issueURL = await createInboxIssue(kara.data.kid);
			updateInboxGitlabIssue(newInid, issueURL);
		} catch (err) {
			logger.error(`Unable to post to Gitlab a new inbox issue: ${err}`, { service, obj: err });
			// Non fatal.
		}
		return issueURL;
	} catch (err) {
		logger.error('Error creating kara', { service, obj: err });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('IMPORT_KARA_ERROR');
	}
}

