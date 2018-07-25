import {langSelector, buildClauses, db} from './database';
const sql = require('./sqls/kara');

export async function selectAllKaras(filter, lang) {

	const filterClauses = filter ? buildClauses(filter) : [];

	const query = sql.getAllKaras(filterClauses, langSelector(lang));

	return await db().query(query);
}
