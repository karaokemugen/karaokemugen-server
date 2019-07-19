import {paramWords, db} from '../lib/dao/database';
import {pg as yesql} from 'yesql';
import { TagParams } from '../lib/types/tag';
import { DBTag } from '../lib/types/database/tag';
import { WhereClause } from '../lib/types/database';
const sql = require('./sqls/tag');

export async function selectTags(params: TagParams): Promise<DBTag[]> {
	let filterClauses = params.filter
		? buildTagClauses(params.filter)
		: {sql: [], params: {}};
	let typeClauses = params.type ? ` AND types @> ARRAY[${params.type}]` : '';
	let limitClause = '';
	let offsetClause = '';
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	const query = sql.getAllTags(filterClauses.sql, typeClauses, limitClause, offsetClause);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

function buildTagClauses(words: string): WhereClause {
	const params = paramWords(words);
	let sql = [];
	for (const word of Object.keys(params)) {
		sql.push(`lower(unaccent(name)) LIKE :${word} OR
		lower(unaccent(i18n::varchar)) LIKE :${word} OR
		lower(unaccent(search_aliases)) LIKE :${word}
		`);
	}
	return {
		sql: sql,
		params: params
	};
}

export async function selectTagByNameAndType(name: string, types: number[]): Promise<DBTag> {
	const res = await db().query(yesql(sql.getTagByName)({
		name: name,
		types: types
	}));
	return res.rows[0];
}
