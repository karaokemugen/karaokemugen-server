import { promises as fs } from 'fs';
import { resolve } from 'path';
import { v4 as uuidV4 } from 'uuid';
import { deleteInbox, insertInbox, selectInbox, updateInboxDownloaded } from '../dao/inbox';
import { KaraFileV4 } from '../lib/types/kara';
import logger from '../lib/utils/logger';
import Sentry from '../utils/sentry';
import { closeIssue } from './gitlab';
import {getConfig, resolvedPathRepos} from '../lib/utils/config';
import {KaraMetaFile, MetaFile, TagMetaFile} from '../lib/types/downloads';
import { Inbox } from '../lib/types/inbox';
import { refreshKarasAfterDBChange } from '../lib/services/karaManagement';
import { TagFile } from '../lib/types/tag';
import { getTag } from './tag';
import { getKara } from './kara';
import { deleteKara } from '../dao/kara';
import {clearUnusedStagingTags} from '../dao/tag';

export async function getKaraInbox(inid: string): Promise<Inbox> {
	try {
		const conf = getConfig();
		const onlineRepo = conf.System.Repositories.find(r => r.Name !== 'Staging').Name;
		const inbox = (await selectInbox(inid))[0];
		const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], inbox.karafile);
		const subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], inbox.subfile);
		const kara: KaraMetaFile = {
			data: JSON.parse(await fs.readFile(karaPath, 'utf-8')),
			file: inbox.karafile
		};
		if (inbox.fix) {
			kara.data.data.kid = inbox.edited_kid;
		}
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
	} catch(err) {
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
		return updateInboxDownloaded(username, inid);
	} catch(err) {
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
			contact: contact,
			kid: kara.data.kid,
			edited_kid: edited_kid
		});
	} catch(err) {
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
		clearUnusedStagingTags();
		await refreshKarasAfterDBChange('DELETE', [kara]);
		const issueArr = inbox.gitlab_issue.split('/');
		const issueNumber = +issueArr[issueArr.length-1];
		if (issueNumber) closeIssue(issueNumber);
	} catch(err) {
		logger.error(`Failed to delete inbox item ${inid}`, {service: 'Inbox', obj: err});
		Sentry.error(err);
		throw err;
	}
}
