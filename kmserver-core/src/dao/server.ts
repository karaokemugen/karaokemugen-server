import { db } from '../lib/dao/database.js';
import { KMServer } from '../types/database/server.js';
import * as sql from './sqls/server.js';

export async function selectServers(publicView = false): Promise<KMServer[]> {
	const res = await db().query(sql.selectServers(publicView));
	return res.rows;
}

export function upsertServer(kmServer: KMServer) {
	return db().query(sql.upsertServer, [
		kmServer.domain,
		kmServer.sid,
		kmServer.last_seen,
		kmServer.flag_banned,
	]);
}