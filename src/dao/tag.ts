import {paramWords, db} from '../lib/dao/database';
import {pg as yesql} from 'yesql';
const sql = require('./sqls/tag');

export async function selectTags(filter: string, type: string, from = 0, size = 0) {
	let filterClauses = filter ? buildTagClauses(filter) : {sql: [], params: {}};
	let typeClauses = type ? ` AND tagtype = ${type}` : '';
	let limitClause = '';
	let offsetClause = '';
	if (from > 0) offsetClause = `OFFSET ${from} `;
	if (size > 0) limitClause = `LIMIT ${size} `;
	const query = sql.getAllTags(filterClauses.sql, typeClauses, limitClause, offsetClause);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

function buildTagClauses(words: string) {
	const params = paramWords(words);
	let sql = [];
	for (const i in words.split(' ').filter(s => !('' === s))) {
		sql.push(`lower(unaccent(name)) LIKE :word${i} OR
		lower(unaccent(i18n::varchar)) LIKE :word${i}
		`);
	}
	return {
		sql: sql,
		params: params
	};
}