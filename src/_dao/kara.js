import {paramWords, langSelector, db} from './database';
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

export async function selectAllKaras(filter, lang, mode, modeValue, from = 0, size = 0) {
	const filterClauses = filter ? buildClauses(filter) : {sql: [], params: {}};
	const typeClauses = mode ? buildTypeClauses(mode, modeValue) : '';
	let orderClauses = '';
	let limitClause = '';
	let offsetClause = '';
	if (mode === 'recent') orderClauses = 'created_at DESC, ';
	if (from > 0) offsetClause = `OFFSET ${from} `;
	if (size > 0) limitClause = `LIMIT ${size} `;
	const query = sql.getAllKaras(filterClauses.sql, langSelector(lang), typeClauses, orderClauses, limitClause, offsetClause);
	// uncomment to survey SQL query
	//console.log(yesql(query)(filterClauses.params));
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

export function buildTypeClauses(mode, value) {
	if (mode === 'search') {
		let search = '';
		const criterias = value.split('!');
		for (const c of criterias) {
			// Splitting only after the first ":"
			const type = c.split(/:(.+)/)[0];

			if (type === 's')
			{
				const values = c.split(/:(.+)/)[1].split(',').map((v) => { return "'"+v+"'::uuid"});
				search = `${search} AND serie_id <@ ARRAY[${values}]`;
			}
			else
			{
				const values = c.split(/:(.+)/)[1];
			}

			if (type === 'y') search = `${search} AND year IN (${values})`;
			if (type === 't') search = `${search} AND all_tags_id @> ARRAY[${values}]`;
		}
		return search;
	}
	if (mode === 'kid') return ` AND kid = '${value}'`;
	return '';
}

export function buildClauses(words) {
	const params = paramWords(words);
	let sql = [];
	for (const i in words.split(' ').filter(s => !('' === s))) {
		sql.push(`lower(unaccent(ak.tags)) LIKE :word${i} OR
		lower(unaccent(ak.title)) LIKE :word${i} OR
		lower(unaccent(ak.serie)) LIKE :word${i} OR
		lower(unaccent(ak.serie_altname::varchar)) LIKE :word${i}
		`);
	}
	return {
		sql: sql,
		params: params
	};
}
