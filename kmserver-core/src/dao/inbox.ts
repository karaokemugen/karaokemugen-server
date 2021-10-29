import {pg as yesql} from 'yesql';

import {db} from '../lib/dao/database';
import { Inbox } from '../lib/types/inbox';
import sql = require('./sqls/inbox');

export async function selectInbox(kid?: string): Promise<Inbox[]> {
	const res = await db().query(sql.selectInbox(kid), kid ? [kid] : undefined);
	return res.rows;
}

export async function insertInbox(kara: Inbox) {
	return await db().query(yesql(sql.insertInbox)(kara));
}

export async function updateInboxDownloaded(username: string, kid: string) {
	return await db().query(sql.updateInboxDownloaded, [
		username,
		new Date(),
		kid
	]);
}

export async function deleteInbox(kid: string) {
	return await db().query(sql.deleteInbox, [kid]);
}