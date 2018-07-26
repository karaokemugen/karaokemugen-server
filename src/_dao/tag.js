import {db} from './database';
const sql = require('./sqls/tag');

export async function selectTags(type) {
	const res = await db().query(sql.getTags,[type]);
	return res.rows;
}
