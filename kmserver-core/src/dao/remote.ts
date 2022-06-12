import { db } from '../lib/dao/database';
import { RemoteAccessToken } from '../lib/types/remote';
import * as sql from './sqls/remote';

export async function selectRemoteTokens(token?: string): Promise<RemoteAccessToken[]> {
	const res = await db().query(sql.selectTokens(token), token ? [
		token
	] : null);
	return res.rows;
}

export function deleteOldRemoteTokens() {
	return db().query(sql.deleteOldRemoteTokens);
}

export function insertNewToken(code: string, token: string, ip: string, permanent?: boolean) {
	return db().query(sql.insertNewToken, [
		code,
		token,
		ip,
		permanent || false
	]);
}

export function deleteToken(token: string) {
	return db().query(sql.deleteToken, [token]);
}

export function updateRemoteToken(token: string, ip: string) {
	return db().query(sql.updateRemoteToken, [ip, token]);
}

export async function updateRemoteTokenCode(token: string, newCode: string) {
	return db().query(sql.updateRemoteTokenCode, [newCode, token]);
}
