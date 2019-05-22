import {buildTypeClauses, buildClauses, langSelector, db} from './database';
import {pg as yesql} from 'yesql';
const sql = require('./sqls/kara');

export async function selectAllYears() {
	const res = await db().query(sql.getYears);
	return res.rows;
}

export async function refreshKaras() {
	return await db().query('REFRESH MATERIALIZED VIEW all_karas');
}

export async function refreshYears() {
	return await db().query('REFRESH MATERIALIZED VIEW all_years');
}

export async function countKaras(filter, mode, modeValue) {
	const filterClauses = filter ? buildClauses(filter) : {sql: [], params: {}};
	const typeClauses = mode ? buildTypeClauses(mode, modeValue) : '';
	const query = sql.countKaras(filterClauses.sql, typeClauses);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows[0].count;
}

export async function selectAllKaras(filter?, lang?, from = 0, size = 0, mode?, modeValue?) {
	let filterClauses = filter ? buildClauses(filter) : {sql: [], params: {}};
	let typeClauses = mode ? buildTypeClauses(mode, modeValue) : '';
	let orderClauses = '';
	let limitClause = '';
	let offsetClause = '';
	if (mode === 'recent') orderClauses = 'created_at DESC, ';
	if (from > 0) offsetClause = `OFFSET ${from} `;
	if (size > 0) limitClause = `LIMIT ${size} `;
	const query = sql.getAllKaras(filterClauses.sql, langSelector(lang), typeClauses, orderClauses, limitClause, offsetClause);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

export async function selectBaseStats() {
	const res = await db().query(sql.selectBaseStats);
	return res.rows[0];
}
