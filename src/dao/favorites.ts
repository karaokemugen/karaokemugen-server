import {db, buildClauses} from '../lib/dao/database';
import { Favorite } from '../types/stats';
import { DBKara } from '../lib/types/database/kara';
import {pg as yesql} from 'yesql';
import { FavParams } from '../lib/types/favorites';
const sql = require('./sqls/favorites');

export async function selectFavorites(username: string): Promise<Favorite[]> {
	const res = await db().query(sql.selectFavorites, [username]);
	return res.rows;
}

export async function insertFavorite(username: string, kid: string) {
	return await db().query(sql.insertFavorite, [username, kid]);
}

export async function deleteFavorite(username: string, kid: string) {
	return await db().query(sql.deleteFavorite, [username, kid]);
}

export async function selectAllFavorites(): Promise<Favorite[]> {
	const res = await db().query(sql.selectAllFavorites);
	return res.rows;
}

interface Filter {
	sql: any[],
	params: {
		username?: string
	}
}

export async function selectFavoritesFull(params: FavParams): Promise<DBKara[]> {
	const filterClauses: Filter = params.filter ? buildClauses(params.filter) : {sql: [], params: {}};
	filterClauses.params.username = params.username;
	let limitClause = '';
	let offsetClause = '';
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	const query = sql.selectFavoritesFull(filterClauses.sql, limitClause, offsetClause);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}