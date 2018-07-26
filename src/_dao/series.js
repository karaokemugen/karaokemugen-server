import {langSelector, buildClausesSeries, db} from './database';
const sql = require('./sqls/series');

export async function selectAllSeries(filter, lang) {

	const filterClauses = filter ? buildClausesSeries(filter) : [];
	const query = sql.getSeries(filterClauses, langSelector(lang));
	let series = await db().query(query);
	return series.rows;
}