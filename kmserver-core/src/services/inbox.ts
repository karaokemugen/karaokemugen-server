import { promises as fs } from 'fs';
import { resolve } from 'path';
import { v4 as uuidV4 } from 'uuid';

import {clearInbox, deleteInbox, insertInbox, selectInbox, updateInboxDownloaded} from '../dao/inbox';
import { deleteKara } from '../dao/kara';
import {clearStagingTags} from '../dao/tag';
import { refreshKarasAfterDBChange } from '../lib/services/karaManagement';
import {KaraMetaFile, MetaFile, TagMetaFile} from '../lib/types/downloads';
import { Inbox } from '../lib/types/inbox';
import { KaraFileV4 } from '../lib/types/kara';
import { TagFile } from '../lib/types/tag';
import { getConfig, resolvedPathRepos } from '../lib/utils/config';
import logger from '../lib/utils/logger';
import {findFileByUUID} from '../utils/files';
import Sentry from '../utils/sentry';
import { closeIssue } from './gitlab';
import { getKara } from './kara';
import { getTag } from './tag';

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
		logger.error(`Failed to get inbox item ${inid}`, {service: 'Inbox', obj: err});
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
		logger.error(`Failed to mark inbox item ${inid} as downloaded by ${username}`, {service: 'Inbox', obj: err});
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
		logger.error('Unable to create kara in inbox', {service: 'Inbox', obj: err});
		Sentry.error(err);
	}
}

export async function removeKaraFromInbox(inid: string) {
	try {
		const inbox = (await selectInbox(inid))[0];
		if (!inbox) throw {code: 404};
		const kara = await getKara({
			q: `k:${inbox.kid}`
		});
		const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], inbox.karafile);
		const subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], inbox.subfile);
		const mediaPath = resolve(resolvedPathRepos('Medias', 'Staging')[0], inbox.mediafile);
		// Delete all the thingies
		await deleteInbox(inid);
		await Promise.all([
			fs.unlink(karaPath),
			fs.unlink(subPath),
			fs.unlink(mediaPath)
		]);
		await deleteKara([inbox.kid]);
		await refreshKarasAfterDBChange('DELETE', [kara]);
		const issueArr = inbox.gitlab_issue.split('/');
		const issueNumber = +issueArr[issueArr.length - 1];
		if (issueNumber) closeIssue(issueNumber);
	} catch (err) {
		logger.error(`Failed to delete inbox item ${inid}`, {service: 'Inbox', obj: err});
		Sentry.error(err);
		throw err;
	}
}

export async function clearUnusedStagingTags() {
	logger.debug('Clearing old inbox tags', {service: 'Inbox'});
	const tagfiles = await clearStagingTags();
	for (const tag of tagfiles) {
		const tagDir = resolvedPathRepos('Tags', 'Staging')[0];
		await fs.unlink(resolve(tagDir, tag));
	}
}

export async function clearOldInboxEntries() {
	logger.debug('Clearing old inbox entries', {service: 'Inbox'});
	const deleted_karas = await clearInbox();
	for (const kara of deleted_karas) {
		logger.debug(`${kara.kid} was cleared`, {service: 'Inbox', obj: kara});
		// Find and delete files
		const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], kara.karafile);
		await fs.unlink(karaPath).then(async () => {
			const subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], kara.subfile);
			const mediaPath = resolve(resolvedPathRepos('Medias', 'Staging')[0], kara.mediafile);
			try {
				await Promise.all([
					fs.unlink(subPath),
					fs.unlink(mediaPath)
				]);
			} catch (err) {
				logger.error(`Error when cleaning kara (${kara.kid})`, {service: 'Inbox', obj: err});
				throw err;
			}
		}, async () => {
			// Fallback to finding the karaoke file by uuid
			try {
				const [name, content] = await findFileByUUID(
					'kid',
					kara.kid,
					'Staging'
				);
				const newKaraPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], name);
				const subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], content.medias[0].lyrics[0].filename);
				const mediaPath = resolve(resolvedPathRepos('Medias', 'Staging')[0], content.medias[0].filename);
				await Promise.all([
					fs.unlink(newKaraPath),
					fs.unlink(subPath),
					fs.unlink(mediaPath)
				]);
			} catch (err) {
				logger.error(`Error when cleaning kara (kid fallback, ${kara.kid})`, {service: 'Inbox', obj: err});
				throw err;
			}
		});
	}
}
