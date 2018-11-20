import {paramWords, langSelector, db} from './database';
import {pg as yesql} from 'yesql';
const sql = require('./sqls/series');

export async function selectAllSeries(filter, lang) {

	const filterClauses = filter ? buildClausesSeries(filter) : {sql: [], params: {}};
	const query = sql.getSeries(filterClauses.sql, langSelector(lang));
	const q = yesql(query)(filterClauses.params);
	const series = await db().query(q);
	for (const i in series.rows) {
		delete series.rows[i].search;
	}
	return series.rows;
}

export function buildClausesSeries(words) {
	const params = paramWords(words);
	let sql = [];
	for (const i in words.split(' ').filter(s => !('' === s))) {
		sql.push(`lower(unaccent(name)) LIKE :word${i} OR
		lower(unaccent(aliases::varchar)) LIKE :word${i} OR
		lower(unaccent(i18n::varchar)) LIKE :word${i}
		`);
	}
	return {
		sql: sql,
		params: params
	};
}