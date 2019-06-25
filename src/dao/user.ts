import {db} from '../lib/dao/database';
import { User } from '../lib/types/user';
const sql = require('./sqls/user');

export async function selectUser(searchType: string, value: any) {
	const query = `${sql.selectUser} WHERE ${searchType} = $1`;
	const res = await db().query(query, [value]);
	return res.rows[0];
}

export async function selectAllUsers() {
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
		user.email
	]);
}

export async function updateUserPassword(username: string, password: string) {
	return await db().query(sql.updateUserPassword, [
		username,
		password
	]);
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
		user.login
	]);
}