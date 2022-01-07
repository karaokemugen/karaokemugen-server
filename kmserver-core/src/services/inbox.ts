import { promises as fs} from 'fs';
import { remove } from 'fs-extra';
import { basename, resolve } from 'path';
import { v4 as uuidV4 } from 'uuid';
import { deleteInbox, insertInbox, selectInbox, updateInboxDownloaded } from '../dao/inbox';
import { KaraMetaFile, MetaFile, TagMetaFile } from '../lib/types/downloads';
import { KaraFileV4 } from '../lib/types/kara';
import { resolvedPath } from '../lib/utils/config';
import { fileExists } from '../lib/utils/files';
import logger from '../lib/utils/logger';
import Sentry from '../utils/sentry';
import { closeIssue } from './gitlab';

export async function getKaraInbox(inid: string) {
	try {
		const karas = await selectInbox(inid);
		return karas[0];
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
		const inbox = await getKaraInbox(inid);
		if (!inbox) throw {code: 404};
		return updateInboxDownloaded(username, inid);
	} catch(err) {
		logger.error(`Failed to mark inbox item ${inid} as downloaded by ${username}`, {service: 'Inbox', obj: err});
		Sentry.error(err);
		throw err;
	}
}

export async function addKaraInInbox(karaName: string, contact: string, issue?: string, fix = false) {
	try {
		const karaDir = resolve(resolvedPath('Import'), karaName);
		const dir = await fs.readdir(karaDir);
		const karaFile = dir.find(f => f.endsWith('kara.json'));
		const tagFiles = dir.filter(f => f.endsWith('tag.json'));
		const karaFileData = await fs.readFile(resolve(karaDir, karaFile), 'utf-8');
		const karaData: KaraFileV4 = JSON.parse(karaFileData);
		const kara: KaraMetaFile = {
			file: karaFile,
			data: karaData
		};
		const tags: TagMetaFile[] = [];
		for (const tagFile of tagFiles) {
			const tagData = await fs.readFile(resolve(karaDir, tagFile), 'utf-8');
			tags.push({
				file: tagFile,
				data: JSON.parse(tagData)
			});
		}
		const lyricsFile = karaData.medias[0].lyrics[0].filename;
		let lyrics: MetaFile;
		if (await fileExists(resolve(karaDir, lyricsFile))) {
			lyrics = {
				file: lyricsFile,
				data: await fs.readFile(resolve(karaDir, lyricsFile), 'utf-8')
			};
		}

		let mediafile: string;
		if (await fileExists(resolve(karaDir, karaData.medias[0].filename))) {
			mediafile = karaData.medias[0].filename;
		}
		await insertInbox({
			inid: uuidV4(),
			name: karaName,
			created_at: new Date(),
			kara: kara,
			extra_tags: tags,
			lyrics: lyrics,
			mediafile: mediafile,
			gitlab_issue: issue,
			fix: fix,
			contact: contact
		});
	} catch(err) {
		logger.error('Unable to create kara in inbox', {service: 'Inbox', obj: err});
		Sentry.error(err);
	}
}

export async function removeKaraFromInbox(inid: string) {
	try {
		const inbox = await getKaraInbox(inid);
		if (!inbox) throw {code: 404};
		const karaDir = basename(inbox.kara.file, '.kara.json');
		// You never know.
		if (!karaDir) throw {code: 500};

		await remove(resolve(resolvedPath('Import'), karaDir)).catch(() => {
			logger.warn(`Folder for ${karaDir} already deleted`, {service: 'Inbox'});
		});
		await deleteInbox(inid);
		const issueArr = inbox.gitlab_issue.split('/');
		closeIssue(+issueArr[issueArr.length-1]);
	} catch(err) {
		logger.error(`Failed to delete inbox item ${inid}`, {service: 'Inbox', obj: err});
		Sentry.error(err);
		throw err;
	}
}
