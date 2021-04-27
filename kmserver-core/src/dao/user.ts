import {db} from '../lib/dao/database';
import { User } from '../lib/types/user';
import { DBUser } from '../lib/types/database/user';
import sql = require('./sqls/user');

export async function updateLastLogin(username: string): Promise<String> {
	const res = await db().query(sql.updateLastLogin, [username]);
	return res.rows[0].last_login_at;
}

export async function selectUser(searchType: string, value: any): Promise<DBUser> {
	const query = `${sql.selectUser} WHERE ${searchType} = $1`;
	const res = await db().query(query, [value]);
	return res.rows[0];
}

export async function selectAllUsers(): Promise<DBUser[]> {
	const res = await db().query(sql.selectUser);
	return res.rows;
}

export async function deleteUser(username: string) {
	return await db().query(sql.deleteUser, [username]);
}

export async function insertUser(user: User) {
	return await db().query(sql.insertUser, [
		user.login,
		user.nickname,
		user.password,
		user.type,
		user.avatar_file,
		user.bio,
		user.url,
		user.email,
		user.location,
		user.flag_sendstats
	]);
}

export async function updateUserPassword(username: string, password: string): Promise<Date> {
	const res = await db().query(sql.updateUserPassword, [
		username,
		password
	]);
	return new Date(res.rows[0].password_last_modified_at);
}


export async function updateUser(user: User) {
	return await db().query(sql.updateUser, [
		user.nickname,
		user.bio,
		user.url,
		user.email,
		user.avatar_file,
		user.type,
		user.series_lang_mode,
		user.main_series_lang,
		user.fallback_series_lang,
		user.location,
		user.flag_sendstats,
		user.login
	]);
}