import {pg as yesql} from 'yesql';

import {db} from '../lib/dao/database.js';
import {DBInbox, InboxActions, InboxHistory} from '../lib/types/inbox.js';
import * as sql from './sqls/inbox.js';

export async function selectInbox(inid?: string, byUser?: string): Promise<DBInbox[]> {
	const params = {
		inid,
		byUser
	};
	const res = await db().query(yesql(sql.selectInbox(inid, byUser))(params));
	return res.rows;
}

export async function insertInbox(kara: DBInbox) {
	return db().query(yesql(sql.insertInbox)(kara));
}

export async function updateInboxStatus(inid: string, status: InboxActions, inboxHistory: InboxHistory[], reject_reason?: string) {
	return db().query(sql.updateInboxStatus, [
		inid,
		status,
		inboxHistory,
		reject_reason || null
	]);
}

export async function updateInboxGitlabIssue(inid: string, gitlab_issue: string) {
	return db().query(sql.updateInboxGitlabIssue, [
		inid,
		gitlab_issue
	]);
}

export async function updateInboxDownloaded(username: string, inid: string) {
	return db().query(sql.updateInboxDownloaded, [
		username,
		new Date(),
		inid
	]);
}

export async function updateInboxUnassign(inid: string) {
	return db().query(sql.updateInboxUnassign, [
		inid
	]);
}

export async function deleteInbox(inid: string) {
	const res = await db().query(sql.deleteInbox, [inid]);
	return res.rows;
}
