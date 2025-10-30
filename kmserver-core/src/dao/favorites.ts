import {db} from '../lib/dao/database.js';
import { Favorite } from '../types/stats.js';
import * as sql from './sqls/favorites.js';

export async function selectFavorites(username: string): Promise<Favorite[]> {
	const res = await db().query(sql.selectFavorites, [username]);
	return res.rows;
}

export async function insertFavorite(username: string, kid: string, favorited_at: string) {
	return db().query(sql.insertFavorite, [username, kid, favorited_at || new Date().toISOString() ]);
}

export async function deleteFavorite(username: string, kid: string) {
	return db().query(sql.deleteFavorite, [username, kid]);
}
