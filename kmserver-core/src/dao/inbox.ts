import {pg as yesql} from 'yesql';

import {db} from '../lib/dao/database';
import {DBInbox, SingleDBInbox} from '../lib/types/inbox';
import * as sql from './sqls/inbox';

export async function selectInbox(): Promise<DBInbox[]>;
export async function selectInbox(inid: string): Promise<[SingleDBInbox] | []>;
export async function selectInbox(inid?: string) {
	const res = await db().query(sql.selectInbox(inid), inid ? [inid] : undefined);
	return res.rows;
}

export async function insertInbox(kara: DBInbox) {
	return db().query(yesql(sql.insertInbox)(kara));
}

export async function updateInboxDownloaded(username: string, inid: string) {
	return db().query(sql.updateInboxDownloaded, [
		username,
		new Date(),
		inid
	]);
}

export async function deleteInbox(inid: string) {
	return db().query(sql.deleteInbox, [inid]);
}

export async function clearInbox(): Promise<{ kid: string, mediafile: string, karafile: string, subfile: string }[]> {
	const res = await db().query(sql.clearInbox);
	return res.rows;
}
