import {paramWords, langSelector, db} from './database';
import {pg as yesql} from 'yesql';
const sql = require('./sqls/series');

export async function refreshSeries() {
	await db().query('REFRESH MATERIALIZED VIEW all_series');
}

export async function refreshKaraSeries() {
	await db().query('REFRESH MATERIALIZED VIEW series_i18n');
	await db().query('REFRESH MATERIALIZED VIEW all_kara_series');
}

export async function refreshKaraSeriesLang() {
	await db().query('REFRESH MATERIALIZED VIEW all_kara_serie_langs');
}


export async function countSeries(filter) {
	const filterClauses = filter ? buildClausesSeries(filter) : {sql: [], params: {}};
	const query = sql.countKaras(filterClauses.sql);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows[0].count;
}

export async function selectAllSeries(filter, lang, from = 0, size = 99999999999999999) {

	const filterClauses = filter ? buildClausesSeries(filter) : {sql: [], params: {}};
	let offsetClause = '';
	let limitClause = '';
	if (from && from > 0) offsetClause = `OFFSET ${from} `;
	if (size && size > 0) limitClause = `LIMIT ${size} `;
	const query = sql.getSeries(filterClauses.sql, langSelector(lang, true), limitClause, offsetClause);
	const q = yesql(query)(filterClauses.params);
	const series = await db().query(q);
	for (const i in series.rows) {
		delete series.rows[i].search;
		delete series.rows[i].search_aliases;
	}
	return series.rows;
}

export function buildClausesSeries(words) {
	const params = paramWords(words);
	let sql = [];
	for (const i in words.split(' ').filter(s => !('' === s))) {
		sql.push(` (lower(unaccent(aseries.name)) LIKE :word${i}
				OR lower(unaccent(aseries.search)) LIKE :word${i}
		 		OR lower(unaccent(aseries.search_aliases)) LIKE :word${i})`
		);
	}
	return {
		sql: sql,
		params: params
	};
}