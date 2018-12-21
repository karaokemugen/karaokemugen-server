import {db} from './database';
const sql = require('./sqls/tag');

export async function selectTags(type, from, size) {
	let offsetClause = '';
	let limitClause = '';
	let whereClause = '';
	if (type) whereClause = `WHERE tagtype = ${+type}`;
	if (from && from > 0) offsetClause = `OFFSET ${from} `;
	if (size && size > 0) limitClause = `LIMIT ${size} `;
	const query = sql.getTags(limitClause, offsetClause, whereClause);
	const res = await db().query(query);
	return res.rows;
}

export async function refreshTags() {
	return await db().query('REFRESH MATERIALIZED VIEW all_tags');
}
