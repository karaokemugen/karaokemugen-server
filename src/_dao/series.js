import {langSelector, db} from './database';
import deburr from 'lodash.deburr';
const sql = require('./sqls/series');

export async function selectAllSeries(filter, lang) {

	const filterClauses = filter ? buildClausesSeries(filter) : [];
	const query = sql.getSeries(filterClauses, langSelector(lang));
	const series = await db().query(query);
	return series.rows;
}

export function buildClausesSeries(filter) {
	return deburr(filter)
		.toLowerCase()
		.replace('\'', '')
		.replace(',', '')
		.split(' ')
		.filter(s => !('' === s))
		.map(word => {
			return `lower(unaccent(s.name)) LIKE '%${word}%' OR
			lower(unaccent(s.altname)) LIKE '%${word}%' OR
			lower(unaccent(s.i18n::varchar)) LIKE '%${word}%'
			`;
		}
		);
}