import {langSelector, db} from './database';
const sql = require('./sqls/kara');
import deburr from 'lodash.deburr';

export async function selectAllKaras(filter, lang, mode, modeValue) {

	const filterClauses = filter ? buildClauses(filter) : [];
	const typeClauses = mode ? buildTypeClauses(mode, modeValue) : '';
	const query = sql.getAllKaras(filterClauses, langSelector(lang), typeClauses);
	const res = await db().query(query);
	return res.rows;
}

export function buildTypeClauses(mode, value) {
	if (mode === 'recent') {
		let date = new Date();
		date.setMonth(date.getMonth()-1);
		return ` AND ak.created_at >= '${date.getFullYear()}-${(date.getMonth()+1)}-${date.getDate()}'`;
	}
	if (mode === 'tag') {
		return ` AND all_tags_id @> ARRAY[${value}]`;
	}
	if (mode === 'serie') {
		return ` AND ak.serie_id @> ARRAY[${value}::smallint]`;
	}
	return '';
}

export function buildClauses(filter) {
	return deburr(filter)
		.toLowerCase()
		.replace('\'', '')
		.replace(',', '')
		.split(' ')
		.filter(s => !('' === s))
		.map(word => {
			let extraClauses = '';
			return `lower(unaccent(ak.misc)) LIKE '%${word}%' OR
			lower(unaccent(ak.title)) LIKE '%${word}%' OR
			lower(unaccent(ak.author)) LIKE '%${word}%' OR
			lower(unaccent(ak.serie)) LIKE '%${word}%' OR
			lower(unaccent(ak.serie_altname::varchar)) LIKE '%${word}%' OR
			lower(unaccent(ak.singer)) LIKE '%${word}%' OR
			lower(unaccent(ak.songwriter)) LIKE '%${word}%' OR
			lower(unaccent(ak.creator)) LIKE '%${word}%' OR
			lower(unaccent(ak.language)) LIKE '%${word}%'
			${extraClauses}`;
		}
		);
}
