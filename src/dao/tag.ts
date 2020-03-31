import {paramWords, db} from '../lib/dao/database';
import {pg as yesql} from 'yesql';
import { Tag, TagParams } from '../lib/types/tag';
import { WhereClause } from '../lib/types/database';
import { DBTag } from '../lib/types/database/tag';
const sql = require('./sqls/tag');

export async function selectTag(tid: string): Promise<Tag> {
	const res = await db().query(sql.selectTag, [tid]);
	res.rows[0].karacount = JSON.parse(res.rows[0].karacount);
	return res.rows[0];
}

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
	res.rows.forEach((e: any, i: number) => {
		const karacounts = e.karacount;
		res.rows[i].karacount = {};
		karacounts && karacounts.forEach((k: any) => res.rows[i].karacount[k.type] = k.count);
	});
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

export async function selectTagByNameAndType(name: string, types: number[]): Promise<Tag> {
	const res = await db().query(sql.getTagByNameAndType, [
		name,
		types
	]);
	return res.rows[0];
}
