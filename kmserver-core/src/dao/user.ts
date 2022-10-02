import { db, paramWords } from '../lib/dao/database';
import { DBUser } from '../lib/types/database/user';
import { User } from '../lib/types/user';
import * as sql from './sqls/user';

export async function updateLastLogin(username: string): Promise<string> {
	const res = await db().query(sql.updateLastLogin, [username]);
	return res.rows[0].last_login_at;
}

export async function selectUser(searchType: string, value: any): Promise<DBUser> {
	const query = sql.selectUser(false, `WHERE ${searchType} = $1`);
	const res = await db().query(query, [value]);
	return res.rows[0];
}

export async function selectAllUsers(filter?: string, from?: number, size?: number, order = false): Promise<DBUser[]> {
	const res = await db().query(
		sql.selectUser(!!filter, '', (size) ? `LIMIT ${size} OFFSET ${from || 0}` : '', order),
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
