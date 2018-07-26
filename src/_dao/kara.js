import {langSelector, buildClauses, db, buildTypeClauses} from './database';
const sql = require('./sqls/kara');

export async function selectAllKaras(filter, lang, mode, modeValue) {

	const filterClauses = filter ? buildClauses(filter) : [];
	const typeClauses = mode ? buildTypeClauses(mode, modeValue) : '';
	const query = sql.getAllKaras(filterClauses, langSelector(lang), typeClauses);
	const res = await db().query(query);
	return res.rows;
}
