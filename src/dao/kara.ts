import {buildTypeClauses, buildClauses, langSelector, db} from '../lib/dao/database';
import {pg as yesql} from 'yesql';
import { KaraParams } from '../lib/types/kara';
import { DBKara, DBYear } from '../lib/types/database/kara';
import { DBStats } from '../types/database/kara';
const sql = require('./sqls/kara');

export async function selectAllYears(): Promise<DBYear[]> {
	const res = await db().query(sql.getYears);
	return res.rows;
}

export async function selectAllKaras(params: KaraParams): Promise<DBKara[]> {
	let filterClauses = params.filter ? buildClauses(params.filter) : {sql: [], params: {}};
	let typeClauses = params.mode ? buildTypeClauses(params.mode, params.modeValue) : '';
	let orderClauses = '';
	let limitClause = '';
	let offsetClause = '';
	let havingClause = '';
	if (params.mode === 'recent') orderClauses = 'created_at DESC, ';
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	const query = sql.getAllKaras(filterClauses.sql, langSelector(params.lang), typeClauses, orderClauses, havingClause, limitClause, offsetClause);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

export async function selectBaseStats(): Promise<DBStats> {
	const res = await db().query(sql.selectBaseStats);
	return res.rows[0];
}
