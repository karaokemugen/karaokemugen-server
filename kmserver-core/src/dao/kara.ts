import {buildTypeClauses, buildClauses, db} from '../lib/dao/database';
import {pg as yesql} from 'yesql';
import { KaraParams } from '../lib/types/kara';
import { DBKara, DBYear, DBMedia } from '../lib/types/database/kara';
import { DBStats } from '../types/database/kara';
import { WhereClause } from '../lib/types/database';
import sql = require('./sqls/kara');

export async function selectAllMedias(): Promise<DBMedia[]> {
	const res = await db().query(sql.selectAllMedias);
	return res.rows;
}

export async function selectAllYears(): Promise<DBYear[]> {
	const res = await db().query(sql.getYears);
	return res.rows;
}

export async function selectAllKaras(params: KaraParams): Promise<DBKara[]> {
	const filterClauses: WhereClause = params.filter
		? buildClauses(params.filter)
		: {sql: [], params: {}, additionalFrom: []};
	let typeClauses = params.q
		? buildTypeClauses(params.q, params.order)
		: '';
	let orderClauses = '';
	let limitClause = '';
	let offsetClause = '';
	let selectClause = '';
	let joinClause = '';
	let groupClause = '';
	let whereClauses = '';
	if (params.username) {
		selectClause = `
			(CASE WHEN f.fk_kid IS NULL
				THEN FALSE
				ELSE TRUE
			END) as flag_favorites,
			`;
		joinClause = 'LEFT OUTER JOIN users_favorites AS f ON f.fk_login = :username AND f.fk_kid = ak.pk_kid';
		groupClause = 'f.fk_kid, ';
		filterClauses.params.username = params.username;
	}
	if (params.favorites) {
		joinClause += ' LEFT JOIN users_favorites AS fv ON fv.fk_kid = ak.pk_kid';
		filterClauses.params.username_favs = params.favorites;
		whereClauses = 'AND fv.fk_login = :username_favs';
	}
	if (params.order === 'recent') orderClauses = 'created_at DESC, ';
	if (params.order === 'played') {
		whereClauses += ' AND ks.played > 1';
		orderClauses = 'ks.played DESC, ';
		selectClause += 'ks.played,';
		groupClause += 'ks.played, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.kid = ak.pk_kid ';
	}
	if (params.order === 'favorited') {		
		whereClauses += ' AND ks.favorited > 1';
		orderClauses = 'ks.favorited DESC, ';		
		selectClause += 'ks.favorited,';
		groupClause += 'ks.favorited, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.kid = ak.pk_kid ';
	}
	if (params.order === 'requested') {
		whereClauses += ' AND ks.requested > 1';
		orderClauses = 'ks.requested DESC, ';
		selectClause += 'ks.requested,';
		groupClause += 'ks.requested, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.kid = ak.pk_kid ';
	}
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	// If we're asking for random songs, here we modify the query to get them.
	if (params.random > 0) {
		orderClauses = `RANDOM(), ${orderClauses}`;
		limitClause = `LIMIT ${params.random}`;
	}
	const query = sql.getAllKaras(
		filterClauses.sql, typeClauses, orderClauses,  limitClause, offsetClause, selectClause, joinClause, groupClause, whereClauses, filterClauses.additionalFrom);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

export async function selectBaseStats(): Promise<DBStats> {
	const res = await db().query(sql.selectBaseStats);
	return res.rows[0];
}

export async function refreshKaraStats() {
	return db().query(sql.refreshKaraStats);
}