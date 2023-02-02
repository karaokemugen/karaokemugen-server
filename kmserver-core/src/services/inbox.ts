import { promises as fs } from 'fs';
import { resolve } from 'path';
import { v4 as uuidV4 } from 'uuid';

import {clearInbox, deleteInbox, insertInbox, selectInbox, updateInboxDownloaded} from '../dao/inbox';
import { deleteKara } from '../dao/kara';
import {clearStagingTags} from '../dao/tag';
import { formatKaraV4 } from '../lib/dao/karafile';
import { getDataFromTagFile } from '../lib/dao/tagfile';
import { refreshKarasAfterDBChange } from '../lib/services/karaManagement';
import {KaraMetaFile, MetaFile, TagMetaFile} from '../lib/types/downloads';
import { Inbox } from '../lib/types/inbox';
import { KaraFileV4 } from '../lib/types/kara';
import { TagFile } from '../lib/types/tag';
import { getConfig, resolvedPathRepos } from '../lib/utils/config';
import { fileExists } from '../lib/utils/files';
import { closeIssue } from '../lib/utils/gitlab';
import logger from '../lib/utils/logger';
import { findFileByUUID } from '../utils/files';
import Sentry from '../utils/sentry';
import { getKara } from './kara';
import { getTag, getTags } from './tag';

const service = 'Inbox';

export async function getKaraInbox(inid: string): Promise<Inbox> {
	try {
		const conf = getConfig();
		const onlineRepo = conf.System.Repositories.find(r => r.Name !== 'Staging').Name;
		const inbox = (await selectInbox(inid))[0];
		const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], inbox.karafile);
		const subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], inbox.subfile);
		const karaData: KaraFileV4 = JSON.parse(await fs.readFile(karaPath, 'utf-8'));
		karaData.data.repository = onlineRepo;
		if (inbox.fix) {
			karaData.data.kid = inbox.edited_kid;
		}
		const kara: KaraMetaFile = {
			data: karaData,
			file: inbox.karafile
		};
		const lyrics: MetaFile = {
			data: await fs.readFile(subPath, 'utf-8'),
			file: inbox.subfile
		};
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
		Sentry.error(err);
		throw err;
	}
}

export function getInbox() {
	return selectInbox();
}

export async function markKaraInboxAsDownloaded(inid: string, username: string) {
	try {
		const inbox = (await selectInbox(inid))[0];
		if (!inbox) throw {code: 404};
		return await updateInboxDownloaded(username, inid);
	} catch (err) {
		logger.error(`Failed to mark inbox item ${inid} as downloaded by ${username}`, {service, obj: err});
		Sentry.error(err);
		throw err;
	}
}

export async function addKaraInInbox(kara: KaraFileV4, contact: string, issue?: string, edited_kid?: string) {
	try {
		await insertInbox({
			inid: uuidV4(),
			name: kara.medias[0].lyrics[0].filename.slice(0, -4),
			created_at: new Date(),
			gitlab_issue: issue,
			contact,
			kid: kara.data.kid,
			edited_kid
		});
	} catch (err) {
		logger.error('Unable to create kara in inbox', {service, obj: err});
		Sentry.error(err);
	}
}

export async function removeKaraFromInbox(inid: string) {
	try {
		const inbox = (await selectInbox(inid))[0];
		if (!inbox) throw {code: 404};
		// Kara might not exist anymore if something went wrong.
		try {
			const kara = await getKara({
				q: `k:${inbox.edited_kid ? inbox.edited_kid : inbox.kid}!r:Staging`
			});
			// If kara is not found, it means the song has already been added to the database by kara.moe
			if (kara) {
				const karaData = formatKaraV4(kara);
				await deleteKara([kara.kid]);
				refreshKarasAfterDBChange('DELETE', [karaData.data]);
			}
		} catch (err) {
			logger.info(`Kara ${inbox.name} is not found, it means the song has already been added to the database by kara.moe`, { service });
		}
		if (inbox.karafile) {
			const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], inbox.karafile);
			const subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], inbox.subfile);
			const mediaPath = resolve(resolvedPathRepos('Medias', 'Staging')[0], inbox.mediafile);
			try {
				await Promise.all([
					fs.unlink(karaPath),
					fs.unlink(subPath),
					fs.unlink(mediaPath)
				]);
			} catch (err) {
				logger.warn(`Unable to remove some files after inbox deletion for song ${inbox.name}`, { service });
			}
		}
		await deleteInbox(inid);
	} catch (err) {
		logger.error(`Failed to delete inbox item ${inid}`, {service, obj: err});
		Sentry.error(err);
		throw err;
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
			const numberIssue = +kara.gitlab_issue.split('/')[kara.gitlab_issue.split('/').length - 1];
			await closeIssue(numberIssue, getConfig().System.Repositories[0].Name);
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
