import {db} from './database';
const sql = require('./sqls/favorites');

export async function selectFavorites(username) {
	const res = await db().query(sql.selectFavorites, [username]);
	return res.rows;
}

export async function insertFavorite(username, kid) {
	return await db().query(sql.insertFavorite, [username, kid]);
}

export async function deleteFavorite(username, kid) {
	return await db().query(sql.deleteFavorite, [username, kid]);
}