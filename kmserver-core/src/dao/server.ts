import { db } from '../lib/dao/database.js';
import { KMServer } from '../types/database/server.js';
import * as sql from './sqls/server.js';

export async function selectServers(publicView = false): Promise<KMServer[]> {
	const res = await db().query(sql.selectServers(publicView));
	return res.rows;
}

export function updateBanServer(domain: string, flag_banned: boolean) {
	return db().query(sql.updateBanServer, [domain, flag_banned])
}

export function upsertServer(kmServer: KMServer) {
	return db().query(sql.upsertServer, [
		kmServer.domain,
		kmServer.sid,
		kmServer.last_seen,
	]);
}