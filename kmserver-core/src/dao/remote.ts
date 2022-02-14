import { db } from '../lib/dao/database';
import { RemoteAccessToken } from '../lib/types/remote';
import * as sql from './sqls/remote';

export async function getRemoteByToken(token: string): Promise<RemoteAccessToken> {
	const res = await db().query(sql.sqlGetRemoteByToken, [
		token
	]);
	return res.rows[0];
}

export function deleteOldRemoteTokens() {
	return db().query(sql.sqlDeleteOldRemoteTokens);
}

export function insertNewToken(code: string, token: string, ip: string) {
	return db().query(sql.sqlInsertNewToken, [
		code,
		token,
		ip
	]);
}

export function updateRemoteToken(token: string, ip: string) {
	return db().query(sql.sqlUpdateRemoteToken, [ip, token]);
}

export async function testCodeExistence(code: string) {
	const data = await db().query(sql.sqlTestCodeExistence, [code]);
	return data.rowCount === 1;
}

export async function promoteToken(token: string, newCode: string) {
	return db().query(sql.sqlPromoteToken, [newCode, token]);
}
