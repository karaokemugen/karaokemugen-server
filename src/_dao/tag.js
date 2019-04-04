import {paramWords, db} from './database';
import {pg as yesql} from 'yesql';
const sql = require('./sqls/tag');

export async function selectTags(filter, type, from, size) {
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

function buildTagClauses(words) {
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

export async function refreshTags() {
	return await db().query('REFRESH MATERIALIZED VIEW all_tags');
}

export async function refreshKaraTags() {
	await Promise.all([
		db().query('REFRESH MATERIALIZED VIEW author'),
		db().query('REFRESH MATERIALIZED VIEW creator'),
		db().query('REFRESH MATERIALIZED VIEW group_tags'),
		db().query('REFRESH MATERIALIZED VIEW language'),
		db().query('REFRESH MATERIALIZED VIEW singer'),
		db().query('REFRESH MATERIALIZED VIEW misc'),
		db().query('REFRESH MATERIALIZED VIEW songtype'),
		db().query('REFRESH MATERIALIZED VIEW songwriter')
	]);
}
