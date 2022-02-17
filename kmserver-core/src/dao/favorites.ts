import {db} from '../lib/dao/database';
import { Favorite } from '../types/stats';
import sql = require('./sqls/favorites');

export async function selectFavorites(username: string): Promise<Favorite[]> {
	const res = await db().query(sql.selectFavorites, [username]);
	return res.rows;
}

export async function insertFavorite(username: string, kid: string) {
	return db().query(sql.insertFavorite, [username, kid]);
}

export async function deleteFavorite(username: string, kid: string) {
	return db().query(sql.deleteFavorite, [username, kid]);
}
