import { promises as fs } from 'fs';
import { resolve } from 'path';
import { v4 as uuidV4 } from 'uuid';

import {clearInbox, deleteInbox, insertInbox, selectInbox, updateInboxDownloaded} from '../dao/inbox.js';
import { deleteKara } from '../dao/kara.js';
import {clearStagingTags} from '../dao/tag.js';
import { formatKaraV4 } from '../lib/dao/karafile.js';
import { getDataFromTagFile } from '../lib/dao/tagfile.js';
import { readAllKaras } from '../lib/services/generation.js';
import { refreshKarasAfterDBChange } from '../lib/services/karaManagement.js';
import {KaraMetaFile, MetaFile, TagMetaFile} from '../lib/types/downloads.js';
import { Inbox } from '../lib/types/inbox.js';
import { KaraFileV4 } from '../lib/types/kara.js';
import { TagFile } from '../lib/types/tag.js';
import { getConfig, resolvedPathRepos } from '../lib/utils/config.js';
import { ErrorKM } from '../lib/utils/error.js';
import { fileExists, listAllFiles } from '../lib/utils/files.js';
import { closeIssue } from '../lib/utils/gitlab.js';
import logger from '../lib/utils/logger.js';
import { findFileByUUID } from '../utils/files.js';
import sentry from '../utils/sentry.js';
import { getKara } from './kara.js';
import { getTag, getTags } from './tag.js';

const service = 'Inbox';

export async function getKaraInbox(inid: string): Promise<Inbox> {
	try {
		const conf = getConfig();
		const onlineRepo = conf.System.Repositories.find(r => r.Name !== 'Staging').Name;
		const inbox = (await selectInbox(inid))[0];
		const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], inbox.karafile);
		let subPath: string;
		if (inbox.subfile) subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], inbox.subfile);
		const karaData: KaraFileV4 = JSON.parse(await fs.readFile(karaPath, 'utf-8'));
		karaData.data.repository = onlineRepo;
		if (inbox.fix) {
			karaData.data.kid = inbox.edited_kid;
		}
		const kara: KaraMetaFile = {
			data: karaData,
			file: inbox.karafile
		};
		let lyrics: MetaFile;
		if (inbox.subfile) {
			lyrics = {
				data: await fs.readFile(subPath, 'utf-8'),
				file: inbox.subfile
			};
		}
		const extra_tids = inbox.tags.filter(t => t.repository === 'Staging').map(t => t.tid);
		const extra_tags: TagMetaFile[] = await Promise.all(extra_tids.map(async tid => {
			const tag = await getTag(tid);
			if (!tag) throw `Tag ${tid} not found in Staging repository`;
			const tagPath = resolve(resolvedPathRepos('Tags', 'Staging')[0], tag.tagfile);
			const tagData: TagFile = JSON.parse(await fs.readFile(tagPath, 'utf-8'));
			tagData.tag.repository = onlineRepo;
			return {
				data: tagData,
				file: tag.tagfile
			};
		}));
		delete inbox.tags;
		return {
			...inbox,
			kara,
			lyrics,
			extra_tags
		};
	} catch (err) {
		logger.error(`Failed to get inbox item ${inid}`, {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('GET_INBOX_ERROR');
	}
}

export function getInbox() {
	return selectInbox();
}

export async function markKaraInboxAsDownloaded(inid: string, username: string) {
	try {
		const inbox = (await selectInbox(inid))[0];
		if (!inbox) throw new ErrorKM('INBOX_UNKNOWN_ERROR', 404, false);
		return await updateInboxDownloaded(username, inid);
	} catch (err) {
		logger.error(`Failed to mark inbox item ${inid} as downloaded by ${username}`, {service, obj: err});
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('MARK_INBOX_DOWNLOADED_ERROR');
	}
}

export async function addKaraInInbox(kara: KaraFileV4, contact: string, issue?: string, edited_kid?: string) {
	try {
		await insertInbox({
			inid: uuidV4(),
			name: kara.medias[0].filename.slice(0, -4),
			created_at: new Date(),
			gitlab_issue: issue,
			contact,
			kid: kara.data.kid,
			edited_kid
		});
	} catch (err) {
		logger.error('Unable to create kara in inbox', {service, obj: err});
		sentry.error(err);
	}
}

export async function removeProcessedInboxes() {
	logger.info('Removing possible processed inbox items if they are present in main repository', { service });
	const inbox = await getInbox();
	// Get a list of KIDs from the main repository (not including Staging then)
	const karaFiles = await listAllFiles('Karaokes', getConfig().System.Repositories[0].Name);
	const karas = await readAllKaras(karaFiles, false);
	const kids = new Set(karas.map(k => k.data.kid));
	for (const inboxItem of inbox) {
		if (kids.has(inboxItem.kid)) {
			await removeKaraFromInbox(inboxItem.inid);
		}
	}
}

export async function removeKaraFromInbox(inid: string) {
	try {
		const inbox = (await selectInbox(inid))[0];
		if (!inbox) throw new ErrorKM('INBOX_UNKNOWN_ERROR', 404, false);
		// Kara might not exist anymore if something went wrong.
		try {
			const kara = await getKara({
				q: `k:${inbox.edited_kid || inbox.kid}!r:Staging`
			});
			// If kara is not found, it means the song has already been added to the database by kara.moe
			if (kara) {
				const karaData = formatKaraV4(kara);
				await deleteKara([kara.kid]);
				refreshKarasAfterDBChange('DELETE', [karaData.data]);
			}
		} catch (err) {
			// Non-fatal.
			logger.info(`Kara ${inbox.name} is not found, it means the song has already been added to the database by kara.moe`, { service });
		}
		if (inbox.karafile) {
			const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], inbox.karafile);
			let subPath: string;
			if (inbox.subfile) subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], inbox.subfile);
			const mediaPath = resolve(resolvedPathRepos('Medias', 'Staging')[0], inbox.mediafile);
			try {
				await Promise.all([
					fs.unlink(karaPath),					
					fs.unlink(mediaPath)
				]);
				if (subPath) await fs.unlink(subPath);
			} catch (err) {
				// Non-fatal, files might not exist anymore.
				logger.warn(`Unable to remove some files after inbox deletion for song ${inbox.name}`, { service });
			}
		}
		await deleteInbox(inid);
		if (inbox.gitlab_issue) {
			const numberIssue = +inbox.gitlab_issue.split('/')[inbox.gitlab_issue.split('/').length - 1];
			await closeIssue(numberIssue, getConfig().System.Repositories[0].Name);
		}
	} catch (err) {
		logger.error(`Failed to delete inbox item ${inid}`, {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('DELETE_INBOX_ERROR');
	}
}

export async function clearUnusedStagingTags() {
	logger.debug('Clearing old inbox tags', {service});
	const tagFilesToDelete = await clearStagingTags();
	const tags = await getTags({});
	// List tags in staging
	const tagDir = resolvedPathRepos('Tags', 'Staging')[0];
	const tagFiles = await fs.readdir(tagDir);
	for (const tagFile of tagFiles) {
		const tag = await getDataFromTagFile(resolve(tagDir, tagFile));
		const tagFromDB = tags.content.find(t => t.tid === tag.tid);
		if (tagFromDB) {
			// If tag is found but its repository isn't staging, it means it's been replaced by a tagfile from kara.moe and can be deleted.
			if (tagFromDB.repository !== 'Staging') {
				tagFilesToDelete.push(tagFile);
			}
		} else {
			tagFilesToDelete.push(tagFile);
		}
	}
	for (const tagFile of tagFilesToDelete) {
		logger.info(`Removing unused tag from Staging : ${tagFile}`, { service });
		await fs.unlink(resolve(tagDir, tagFile));
	}
}

/** Clear inbox of songs that have been validated and added to the main database
 * These songs should have the same KID but not the Staging repository in database.
 * :uuid
 */
export async function clearOldInboxEntries() {
	logger.debug('Clearing old inbox entries', {service});
	const deletedKaras = await clearInbox();
	for (const kara of deletedKaras) {
		logger.debug(`${kara.kid} was cleared`, {service, obj: kara});
		try {
			// Find and delete files
			const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], kara.karafile);
			if (await fileExists(karaPath)) {
				const subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], kara.subfile);
				const mediaPath = resolve(resolvedPathRepos('Medias', 'Staging')[0], kara.mediafile);
				await Promise.all([
					fs.unlink(karaPath),
					fs.unlink(subPath),
					fs.unlink(mediaPath)
				]);
			} else {
				const [name, content] = await findFileByUUID('kid', kara.kid, 'Staging');
				const newKaraPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], name);
				const subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], content.medias[0].lyrics[0].filename);
				const mediaPath = resolve(resolvedPathRepos('Medias', 'Staging')[0], content.medias[0].filename);
				await Promise.all([
					fs.unlink(newKaraPath),
					fs.unlink(subPath),
					fs.unlink(mediaPath)
				]);
			}
		} catch (err) {
			logger.error(`Error when cleaning kara (${kara.kid})`, {service, obj: err});
			throw err;
		}
	}
}