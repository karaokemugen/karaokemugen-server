import {db} from './database';
const sql = require('./sqls/tag');

export async function selectTags(type, from, size) {
	let offsetClause = '';
	let limitClause = '';
	if (from && from > 0) offsetClause = `OFFSET ${from} `;
	if (size && size > 0) limitClause = `LIMIT ${size} `;
	const query = sql.getTags(limitClause, offsetClause);
	const res = await db().query(query, [type]);
	return res.rows;
}

export async function refreshTags() {
	return await db().query('REFRESH MATERIALIZED VIEW all_tags');
}
