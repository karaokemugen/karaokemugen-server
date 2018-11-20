import {paramWords, langSelector, db} from './database';
import {pg as yesql} from 'yesql';
const sql = require('./sqls/kara');

export async function selectAllYears() {
	const res = await db().query(sql.getYears);
	return res.rows;
}

export async function selectAllKaras(filter, lang, mode, modeValue) {

	const filterClauses = filter ? buildClauses(filter) : {sql: [], params: {}};
	const typeClauses = mode ? buildTypeClauses(mode, modeValue) : '';
	let orderClauses = '';
	if (mode === 'recent') orderClauses = 'created_at DESC, ';
	if (mode === 'popular') orderClauses = 'requested DESC, ';
	const query = sql.getAllKaras(filterClauses.sql, langSelector(lang), typeClauses, orderClauses);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

export function buildTypeClauses(mode, value) {
	if (mode === 'year') return ` AND year = ${value}`;
	if (mode === 'tag') return ` AND all_tags_id @> ARRAY[${value}]`;
	if (mode === 'serie') return ` AND serie_id @> ARRAY[${value}::smallint]`;
	if (mode === 'ids') return ` AND kara_id IN (${value})`;
	return '';
}

export function buildClauses(words) {
	const params = paramWords(words);
	let sql = [];
	for (const i in words.split(' ').filter(s => !('' === s))) {
		sql.push(`lower(unaccent(ak.misc)) LIKE :word${i} OR
		lower(unaccent(ak.title)) LIKE :word${i} OR
		lower(unaccent(ak.author)) LIKE :word${i} OR
		lower(unaccent(ak.serie)) LIKE :word${i} OR
		lower(unaccent(ak.serie_altname::varchar)) LIKE :word${i} OR
		lower(unaccent(ak.singer)) LIKE :word${i} OR
		lower(unaccent(ak.songwriter)) LIKE :word${i} OR
		lower(unaccent(ak.creator)) LIKE :word${i} OR
		lower(unaccent(ak.language)) LIKE :word${i}
		`);
	}
	return {
		sql: sql,
		params: params
	};
}
