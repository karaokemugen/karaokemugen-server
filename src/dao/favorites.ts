import {db} from '../lib/dao/database';
const sql = require('./sqls/favorites');

export async function selectFavorites(username: string) {
	const res = await db().query(sql.selectFavorites, [username]);
	return res.rows;
}

export async function insertFavorite(username: string, kid: string) {
	return await db().query(sql.insertFavorite, [username, kid]);
}

export async function deleteFavorite(username: string, kid: string) {
	return await db().query(sql.deleteFavorite, [username, kid]);
}

export async function selectAllFavorites() {
	const res = await db().query(sql.selectAllFavorites);
	return res.rows;
}