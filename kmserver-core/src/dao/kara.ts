import {buildTypeClauses, buildClauses, db} from '../lib/dao/database';
import {pg as yesql} from 'yesql';
import { KaraParams } from '../lib/types/kara';
import { DBKara, DBYear, DBMedia } from '../lib/types/database/kara';
import { DBStats } from '../types/database/kara';
import { Filter } from '../lib/types/database/database';
const sql = require('./sqls/kara');

export async function selectAllMedias(): Promise<DBMedia[]> {
	const res = await db().query(sql.selectAllMedias);
	return res.rows;
}

export async function selectAllYears(): Promise<DBYear[]> {
	const res = await db().query(sql.getYears);
	return res.rows;
}

export async function selectAllKaras(params: KaraParams): Promise<DBKara[]> {
	const filterClauses: Filter = params.filter ? buildClauses(params.filter) : {sql: [], params: {}};
	let typeClauses = params.mode ? buildTypeClauses(params.mode, params.modeValue) : '';
	let orderClauses = '';
	let limitClause = '';
	let offsetClause = '';
	let havingClause = '';
	let statsSelectClause = '';
	let statsJoinClause = '';
	let favoritedSelectClause = '';
	let favoritedJoinClause = '';
	let favoritedGroupClause = '';
	let whereClauses = '';
	if (params.username) {
		favoritedSelectClause = `
			(CASE WHEN f.fk_kid IS NULL
				THEN FALSE
				ELSE TRUE
			END) as flag_favorites,
			`;
		favoritedJoinClause = 'LEFT OUTER JOIN users_favorites AS f ON f.fk_login = :username AND f.fk_kid = ak.kid';
		favoritedGroupClause = 'f.fk_kid, ';
		filterClauses.params.username = params.username;
		if (params.favorites) whereClauses = 'AND f.fk_login = :username';
	}
	if (params.sort === 'recent') orderClauses = 'created_at DESC, ';
	if (params.sort === 'played') {
		statsSelectClause = 'COUNT(p.*)::integer AS played,';
		statsJoinClause = 'LEFT OUTER JOIN stats_played AS p ON p.fk_kid = ak.kid ';
		havingClause = 'HAVING COUNT(p.*) >= 5';
		orderClauses = 'played DESC, ';
	}
	if (params.sort === 'favorited') {
		statsSelectClause = 'COUNT(f.*)::integer AS favorited,';
		statsJoinClause = 'LEFT OUTER JOIN stats_favorites AS f ON f.fk_kid = ak.kid ';
		havingClause = 'HAVING COUNT(f.*) >= 1';
		orderClauses = 'favorited DESC, ';
	}
	if (params.sort === 'requested') {
		statsSelectClause = 'COUNT(r.*)::integer AS requested,';
		statsJoinClause = 'LEFT OUTER JOIN stats_requested AS r ON r.fk_kid = ak.kid ';
		havingClause = 'HAVING COUNT(r.*) >= 5';
		orderClauses = 'requested DESC, ';
	}
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	const query = sql.getAllKaras(filterClauses.sql, typeClauses, orderClauses, havingClause, limitClause, offsetClause, statsSelectClause, statsJoinClause, favoritedSelectClause, favoritedJoinClause, favoritedGroupClause, whereClauses);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

export async function selectBaseStats(): Promise<DBStats> {
	const res = await db().query(sql.selectBaseStats);
	return res.rows[0];
}
