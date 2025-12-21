import { promises as fs } from 'fs';
import i18n from 'i18next';
import { resolve } from 'path';
import { v4 as uuidV4 } from 'uuid';

import {
	deleteInbox,
	insertInbox,
	selectInbox,
	updateInboxDownloaded,
	updateInboxStatus,
	updateInboxUnassign,
} from '../dao/inbox.js';
import { deleteKara } from '../dao/kara.js';
import { refreshAllKaraTag } from '../dao/tag.js';
import { formatKaraV4, getDataFromKaraFile } from '../lib/dao/karafile.js';
import { getDataFromTagFile } from '../lib/dao/tagfile.js';
import { refreshKarasAfterDBChange } from '../lib/services/karaManagement.js';
import { KaraMetaFile, MetaFile, TagMetaFile } from '../lib/types/downloads.js';
import { DBInbox, Inbox, InboxActions } from '../lib/types/inbox.js';
import { KaraFileV4 } from '../lib/types/kara.js';
import { TagFile } from '../lib/types/tag.js';
import { JWTTokenWithRoles } from '../lib/types/user.js';
import { getConfig, resolvedPathRepos } from '../lib/utils/config.js';
import { tagTypes } from '../lib/utils/constants.js';
import { ErrorKM } from '../lib/utils/error.js';
import { assignIssue, closeIssue, postNoteToIssue } from '../lib/utils/gitlab.js';
import logger from '../lib/utils/logger.js';
import { adminToken } from '../utils/constants.js';
import { sendMail } from '../utils/mailer.js';
import sentry from '../utils/sentry.js';
import { getKara } from './kara.js';
import { getRepos } from './repo.js';
import { getTag } from './tag.js';
import { findUserByName, getUserLanguage } from './user.js';

const service = 'Inbox';

export async function getKaraInbox(inid: string): Promise<Inbox> {
	try {
		const conf = getConfig();
		const onlineRepo = conf.System.Repositories.find((r) => r.Name !== 'Staging').Name;
		const inbox = (await selectInbox(inid))[0];
		const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], inbox.karafile);
		let subPath: string;
		if (inbox.lyrics_infos[0])
			subPath = resolve(resolvedPathRepos('Lyrics', 'Staging')[0], inbox.lyrics_infos[0].filename);
		const karaData: KaraFileV4 = JSON.parse(await fs.readFile(karaPath, 'utf-8'));
		karaData.data.repository = onlineRepo;
		if (inbox.fix) {
			karaData.data.kid = inbox.edited_kid;
		}
		const kara: KaraMetaFile = {
			data: karaData,
			file: inbox.karafile,
		};
		let lyrics: MetaFile;
		if (inbox.lyrics_infos[0]) {
			lyrics = {
				data: await fs.readFile(subPath, 'utf-8'),
				file: inbox.lyrics_infos[0].filename,
			};
		}
		const extra_tids = inbox.tags.filter((t) => t.repository === 'Staging').map((t) => t.tid);
		const extra_tags: TagMetaFile[] = await Promise.all(
			extra_tids.map(async (tid) => {
				const tag = await getTag(tid);
				if (!tag) throw `Tag ${tid} not found in Staging repository`;
				const tagPath = resolve(resolvedPathRepos('Tags', 'Staging')[0], tag.tagfile);
				const tagData: TagFile = JSON.parse(await fs.readFile(tagPath, 'utf-8'));
				tagData.tag.repository = onlineRepo;
				return {
					data: tagData,
					file: tag.tagfile,
				};
			}),
		);
		delete inbox.tags;
		return {
			...inbox,
			kara,
			lyrics,
			extra_tags,
		};
	} catch (err) {
		logger.error(`Failed to get inbox item ${inid}`, { service, obj: err });
		sentry.error(err);
		throw new ErrorKM('GET_INBOX_ERROR');
	}
}

export async function getInbox(isMaintainer: boolean, byUser?: string): Promise<DBInbox[]> {
	const listInbox = await selectInbox(undefined, byUser);
	if (!isMaintainer) listInbox.forEach((inbox) => delete inbox.contact);
	return listInbox;
}

export async function setInboxStatus(inid: string, status: InboxActions, reason?: string) {
	try {
		const inbox = (await selectInbox(inid))[0];
		if (!inbox) throw new ErrorKM('INBOX_UNKNOWN_ERROR', 404, false);
		if (!Array.isArray(inbox.history)) inbox.history = [];
		// status already set
		if (inbox.status === status && inbox.reject_reason === reason) return;
		inbox.history.push({
			action: status,
			details: reason,
			datetime: new Date(),
		});
		await updateInboxStatus(
			inid,
			status,
			inbox.history,
			status === 'rejected' || status === 'changes_requested' ? reason : null,
		);

		// What to do with the different statuses
		const user = inbox.username ? await findUserByName(inbox.username, { contact: true }) : undefined;
		const repoName = getConfig().System.Repositories[0].Name;
		const conf = getConfig();

		if (status === 'changes_requested') {
			if (user?.flag_contributor_emails) {
				const discordURL = conf.Frontend.DiscordURL
					? i18n.t('MAIL.INBOX.DISCORD', {
							lng: getUserLanguage(user),
							url: conf.Frontend.DiscordURL,
						})
					: '';
				const forumURL = conf.Frontend.ForumURL
					? i18n.t('MAIL.INBOX.FORUM', {
							lng: getUserLanguage(user),
							url: conf.Frontend.ForumURL,
						})
					: '';
				const gitlabURL = inbox.gitlab_issue
					? i18n.t('MAIL.INBOX.GITLAB', {
							lng: getUserLanguage(user),
							url: inbox.gitlab_issue,
						})
					: '';
				const cleanupDays = conf.Frontend.Import.CleanupDays
					? i18n.t('MAIL.INBOX.CLEANUP_DAYS_ALERT', {
							lng: getUserLanguage(user),
							days: conf.Frontend.Import.CleanupDays,
						})
					: '';
				await sendMail(
					i18n.t('MAIL.INBOX.CHANGES_REQUESTED.SUBJECT', {
						lng: getUserLanguage(user),
						instance: repoName,
						songname: inbox.name,
					}),
					i18n.t('MAIL.INBOX.CHANGES_REQUESTED.BODY', {
						lng: getUserLanguage(user),
						username: inbox.username,
						songname: inbox.name,
						instance: repoName,
						reason,
					}) +
						discordURL +
						forumURL +
						gitlabURL +
						cleanupDays,
					user.login,
					user.email,
				);
			}
			if (inbox.gitlab_issue) {
				const issueNumber = getGitlabIssueNumber(inbox.gitlab_issue);
				await postNoteToIssue(
					issueNumber,
					repoName,
					`Waiting for changes by original uploader. Notes from reviewer:
				${reason}
				`,
				);
			}
		} else if (status === 'in_review') {
			// Only sent the in review mail the first time
			if (user?.flag_contributor_emails && inbox.status === 'sent')
				await sendMail(
					i18n.t('MAIL.INBOX.IN_REVIEW.SUBJECT', {
						lng: getUserLanguage(user),
						instance: repoName,
						songname: inbox.name,
					}),
					i18n.t('MAIL.INBOX.IN_REVIEW.BODY', {
						lng: getUserLanguage(user),
						username: inbox.username,
						songname: inbox.name,
						instance: repoName,
					}),
					user.login,
					user.email,
				);
			if (inbox.gitlab_issue) {
				const issueNumber = getGitlabIssueNumber(inbox.gitlab_issue);
				await postNoteToIssue(
					issueNumber,
					repoName,
					`Upload is being reviewed by ${inbox.username_downloaded}`,
				);
			}
		} else if (status === 'accepted') {
			if (user?.flag_contributor_emails)
				await sendMail(
					i18n.t('MAIL.INBOX.ACCEPTED.SUBJECT', {
						lng: getUserLanguage(user),
						instance: repoName,
						songname: inbox.name,
					}),
					i18n.t('MAIL.INBOX.ACCEPTED.BODY', {
						lng: getUserLanguage(user),
						username: inbox.username,
						songname: inbox.name,
						instance: repoName,
					}),
					user.login,
					user.email,
				);
			if (inbox.gitlab_issue) {
				const issueNumber = getGitlabIssueNumber(inbox.gitlab_issue);
				await postNoteToIssue(issueNumber, repoName, `Upload was ACCEPTED by ${inbox.username_downloaded}`);
				await closeIssue(issueNumber, repoName);
			}
		} else if (status === 'rejected') {
			if (user?.flag_contributor_emails) {
				const discordURL = conf.Frontend.DiscordURL
					? i18n.t('MAIL.INBOX.DISCORD', {
							lng: getUserLanguage(user),
							url: conf.Frontend.DiscordURL,
						})
					: '';
				const forumURL = conf.Frontend.ForumURL
					? i18n.t('MAIL.INBOX.FORUM', {
							lng: getUserLanguage(user),
							url: conf.Frontend.ForumURL,
						})
					: '';
				const gitlabURL = inbox.gitlab_issue
					? i18n.t('MAIL.INBOX.GITLAB', {
							lng: getUserLanguage(user),
							url: inbox.gitlab_issue,
						})
					: '';
				await sendMail(
					i18n.t('MAIL.INBOX.REJECTED.SUBJECT', {
						lng: getUserLanguage(user),
						instance: repoName,
						songname: inbox.name,
					}),
					i18n.t('MAIL.INBOX.REJECTED.BODY', {
						lng: getUserLanguage(user),
						username: inbox.username,
						songname: inbox.name,
						instance: repoName,
						reason,
					}) +
						discordURL +
						forumURL +
						gitlabURL,
					user.login,
					user.email,
				);
			}
			if (inbox.gitlab_issue) {
				const issueNumber = getGitlabIssueNumber(inbox.gitlab_issue);
				await postNoteToIssue(
					issueNumber,
					repoName,
					`Upload was REJECTED by ${inbox.username_downloaded}: ${reason}`,
				);
				await closeIssue(issueNumber, repoName);
			}
		}
	} catch (err) {
		logger.error(`Failed to set inbox item ${inid} status to ${status}`, { service, obj: err });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('SET_INBOX_STATUS_ERROR');
	}
}

export async function markKaraInboxAsDownloaded(inid: string, username: string) {
	try {
		const inbox = (await selectInbox(inid))[0];
		if (!inbox) throw new ErrorKM('INBOX_UNKNOWN_ERROR', 404, false);
		await updateInboxDownloaded(username, inid);
		await setInboxStatus(inid, 'in_review');
		const repo = getRepos()[0];
		await assignIssue(getGitlabIssueNumber(inbox.gitlab_issue), repo.Name);
	} catch (err) {
		logger.error(`Failed to mark inbox item ${inid} as downloaded by ${username}`, { service, obj: err });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('MARK_INBOX_DOWNLOADED_ERROR');
	}
}

export function getGitlabIssueNumber(url: string): number {
	return +url.split('/')[url.split('/').length - 1];
}

export async function markKaraInboxAsUnassigned(inid: string, username: string) {
	try {
		const inbox = (await selectInbox(inid))[0];
		if (!inbox) throw new ErrorKM('INBOX_UNKNOWN_ERROR', 404, false);
		await updateInboxUnassign(inid);
		const user = await findUserByName(username, { public: false });
		if (user.social_networks.gitlab) {
			// This will hurt when we have multiple repositories in KM Server
			assignIssue(getGitlabIssueNumber(inbox.gitlab_issue), getRepos()[0].Name);
		}
	} catch (err) {
		logger.error(`Failed to mark inbox item ${inid} as downloaded by ${username}`, { service, obj: err });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('MARK_INBOX_DOWNLOADED_ERROR');
	}
}

export async function addKaraInInbox(
	kara: KaraFileV4,
	contact: { name: string; login?: string },
	issue?: string,
	edited_kid?: string,
	inid?: string,
) {
	try {
		inid = inid || uuidV4();
		await insertInbox({
			inid,
			name: kara.data.songname,
			created_at: new Date(),
			gitlab_issue: issue,
			contact: contact.name,
			kid: kara.data.kid,
			edited_kid,
			username: contact.login ?? null,
			mediafile: kara.medias[0].filename,
		});
		return inid;
	} catch (err) {
		logger.error('Unable to create kara in inbox', { service, obj: err });
		sentry.error(err);
	}
}

export async function removeKaraFromInbox(inid: string, authToken: JWTTokenWithRoles) {
	try {
		const inbox = (await selectInbox(inid))[0];
		if (!inbox) throw new ErrorKM('INBOX_UNKNOWN_ERROR', 404, false);
		if (!authToken.roles.admin && !authToken.roles.maintainer) {
			if (inbox.username !== authToken.username) throw new ErrorKM('INBOX_DELETE_FORBIDDEN', 403, false);
		}
		// Kara might not exist anymore if something went wrong.
		try {
			const kara = await getKara({
				q: `k:${inbox.edited_kid || inbox.kid}!r:Staging`,
			});
			// If kara is not found, it means the song has already been added to the database or it's not there yet because the user decides to remove their inbox shortly after submitting it
			if (kara) {
				const karaData = formatKaraV4(kara);
				await deleteKara([kara.kid]);
				refreshKarasAfterDBChange('DELETE', [karaData.data]);
				refreshAllKaraTag();
			}
		} catch (err) {
			// Non-fatal.
			logger.info(`Kara ${inbox.name} is not found, it means the song has already been added to the database`, {
				service,
			});
		}
		const promises = [];
		promises.push(
			removeInboxFiles(
				inbox.edited_kid || inbox.kid,
				inbox.karafile,
				inbox.mediafile,
				inbox.lyrics_infos ? inbox.lyrics_infos[0]?.filename : null,
			),
		);
		promises.push(deleteInbox(inid));
		if (inbox.gitlab_issue) {
			const numberIssue = getGitlabIssueNumber(inbox.gitlab_issue);
			const repoName = getConfig().System.Repositories[0].Name;
			if (inbox.username === authToken.username)
				promises.push(postNoteToIssue(numberIssue, repoName, 'Closing by request of original uploader'));
			promises.push(closeIssue(numberIssue, repoName));
		}
		await Promise.all(promises);
	} catch (err) {
		logger.error(`Failed to delete inbox item ${inid}`, { service, obj: err });
		sentry.error(err);
		throw new ErrorKM('DELETE_INBOX_ERROR');
	}
}

export async function clearUnusedStagingTags() {
	try {
		logger.debug('Clearing old inbox tags', { service });
		// List all tags used by karas in staging
		const karaDir = resolvedPathRepos('Karaokes', 'Staging')[0];
		const karaFiles = await fs.readdir(karaDir);
		const usedTags = new Set();
		for (const karaFile of karaFiles) {
			const kara = await getDataFromKaraFile(resolve(karaDir, karaFile), { media: true, lyrics: true });
			for (const tagType of Object.keys(tagTypes)) {
				if (kara.data.tags[tagType]) {
					kara.data.tags[tagType].forEach((tid) => usedTags.add(tid));
				}
			}
		}

		// List tags in staging
		const tagDir = resolvedPathRepos('Tags', 'Staging')[0];
		const tagFiles = await fs.readdir(tagDir);
		for (const tagFile of tagFiles) {
			const tag = await getDataFromTagFile(resolve(tagDir, tagFile));
			if (!usedTags.has(tag.tid)) {
				logger.info(`Removing unused tag from Staging : ${tagFile}`, { service });
				await fs.unlink(resolve(tagDir, tagFile));
			}
		}
	} catch (err) {
		// Not fatal
		logger.error(`Failed to clean tags : ${err}`, { service, obj: err });
	}
}

/** Clear inbox entries that have been refused, accepted, or in change_requested status and older than XX days */
export async function clearInactiveInboxEntries() {
	const conf = getConfig();
	const inbox = await getInbox(true);
	const deletedDate = new Date();
	deletedDate.setDate(deletedDate.getDate() - conf.Frontend.Import.CleanupDays);
	const inboxesToClear = inbox
		.filter((i) => i.status === 'accepted' || i.status === 'rejected' || i.status === 'changes_requested')
		.filter((i) => new Date(i.modified_at) < deletedDate);
	for (const inbox of inboxesToClear) {
		removeKaraFromInbox(inbox.inid, adminToken);
	}
}

/** clear inboxes that have been processed (added to the main repo's database) but not removed
 * This one is run after generation so it compares listed files used by generation.
 */
export async function clearProcessedInboxes(karas: KaraFileV4[]) {
	logger.info('Removing possible processed inbox items if they are present in main repository', { service });
	const inbox = await getInbox(false);
	// Get a list of KIDs from the main repository (not including Staging then)
	const kids = new Set(karas.filter((k) => k.data.repository !== 'Staging').map((k) => k.data.kid));
	for (const inboxItem of inbox) {
		if (kids.has(inboxItem.kid)) {
			await removeKaraFromInbox(inboxItem.inid, adminToken);
		}
	}
}

/** Physically remove inbox files */
async function removeInboxFiles(kid: string, karaFile?: string, mediaFile?: string, lyricsFile?: string) {
	try {
		// Determine if we need to guess which files to remove
		const mediaDir = resolvedPathRepos('Medias', 'Staging')[0];
		const lyricsDir = resolvedPathRepos('Lyrics', 'Staging')[0];
		if (!karaFile || !mediaFile || !lyricsFile) {
			karaFile = `${kid}.kara.json`;
			// This is not multi-track drifting-proof
			const medias = await fs.readdir(mediaDir);
			mediaFile = medias.filter((f) => f.startsWith(kid))[0];
			const lyrics = await fs.readdir(lyricsDir);
			lyricsFile = lyrics.filter((f) => f.startsWith(kid))[0];
		}
		// Find and delete files
		const karaPath = resolve(resolvedPathRepos('Karaokes', 'Staging')[0], karaFile);
		const subPath = resolve(lyricsDir, lyricsFile || '');
		const mediaPath = resolve(mediaDir, mediaFile);
		const promises = [fs.unlink(karaPath), fs.unlink(mediaPath)];
		if (lyricsFile) promises.push(fs.unlink(subPath));
		await Promise.all(promises);
	} catch (err) {
		logger.error(`Error when cleaning kara (${karaFile})`, { service, obj: err });
		// Non-fatal
	}
}
