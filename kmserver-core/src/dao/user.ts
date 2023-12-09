import { db, paramWords } from '../lib/dao/database.js';
import { DBUser } from '../lib/types/database/user.js';
import { User } from '../lib/types/user.js';
import logger from '../lib/utils/logger.js';
import { Ban, BanType } from '../types/user.js';
import * as sql from './sqls/user.js';

const service = 'DB';

export async function updateLastLogin(username: string): Promise<string> {
	const res = await db().query(sql.updateLastLogin, [username]);
	return res.rows[0].last_login_at;
}

export async function selectUser(searchType: string, value: any): Promise<DBUser> {
	const query = sql.selectUser(false, `${searchType} = $1`);
	const res = await db().query(query, [value]);
	return res.rows[0];
}

export async function selectAllUsers(filter?: string, from?: number, size?: number, publicOnly = false, order = false): Promise<DBUser[]> {
	const res = await db().query(
		sql.selectUser(!!filter, publicOnly ? 'flag_public' : '', (size) ? `LIMIT ${size} OFFSET ${from || 0}` : '', order),
		filter ? [paramWords(filter).join(' & ')] : []
	);
	return res.rows;
}

export async function deleteUser(username: string) {
	return db().query(sql.deleteUser, [username]);
}

export async function insertUser(user: User) {
	return db().query(sql.insertUser, [
		user.login,
		user.nickname,
		user.password,
		user.roles || null,
		user.avatar_file,
		user.bio,
		user.url,
		user.email,
		user.location,
		user.flag_sendstats,
		user.social_networks || null,
		user.language,
		user.anime_list_to_fetch,
		user.anime_list_last_modified_at,
		user.anime_list_ids
	]);
}

export async function updateUserPassword(username: string, password: string): Promise<Date> {
	const res = await db().query(sql.updateUserPassword, [
		username,
		password
	]);
	return new Date(res.rows[0].password_last_modified_at);
}

export async function updateUser(user: User): Promise<DBUser> {
	return (await db().query(sql.updateUser, [
		user.nickname,
		user.bio,
		user.url,
		user.email,
		user.avatar_file,
		user.roles || null,
		user.main_series_lang,
		user.fallback_series_lang,
		user.location,
		user.flag_sendstats,
		user.flag_public,
		user.flag_displayfavorites,
		user.social_networks || null,
		user.banner || 'default.jpg',
		user.language,
		user.anime_list_to_fetch,
		user.anime_list_last_modified_at,
		user.anime_list_ids,
		user.flag_parentsonly,
		user.login
	])).rows[0];
}

export async function deleteInactiveUsers() {
	// GDPR demands users without activity for 3 years be deleted
	const inactiveDate = new Date(new Date().setFullYear(new Date().getFullYear() - 3));
	const res = await db().query(sql.deleteInactiveUsers, [inactiveDate.toISOString()]);
	const deletedUsers = Array.from(Object.values(res.rows));
	logger.info(`Daily routine : Removed users due to inactivity : ${deletedUsers.join(', ')}`, { service });
}

export async function insertBan(ban: Ban) {
	await db().query(sql.insertBan, [
		ban.type,
		ban.value,
		ban.banned_at || new Date(),
		ban.reason
	]);
}

export async function deleteBan(ban: Ban) {
	await db().query(sql.deleteBan, [ban.type, ban.value]);
}

export async function selectBans(type?: BanType) {
	const res = await db().query(sql.selectBans(type));
	return res.rows;
}
