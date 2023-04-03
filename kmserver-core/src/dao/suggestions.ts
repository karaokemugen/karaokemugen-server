import {pg as yesql} from 'yesql';

import {db, paramWords, transaction} from '../lib/dao/database.js';
import { Suggestion, SuggestionParams } from '../types/suggestions.js';
import * as sql from './sqls/suggestions.js';

function buildClauses(words: string) {
	return {
		sql: ['(search_vector @@ query)'],
		params: { tsquery: paramWords(words).join(' & ') },
		additionalFrom: [", to_tsquery('public.unaccent_conf', :tsquery) as query"],
	};
}

function buildTypeClauses(
	languages: string[]
) {
	return {
		sql: ['language = ANY (:languages)'],
		params: { languages },
		additionalFrom: [],
	};
}

export async function selectSuggestions(params: SuggestionParams): Promise<Suggestion[]> {
	const filterClauses = params.filter
		? buildClauses(params.filter)
		: {sql: [], params: {}, additionalFrom: []};
	const typeClauses = params.languages?.length > 0
		? buildTypeClauses(params.languages)
		: {sql: [], params: {}, additionalFrom: []};
	const yesqlPayload = {
			sql: [...filterClauses.sql, ...typeClauses.sql],
			params: {...filterClauses.params, ...typeClauses.params},
			additionalFrom: [...filterClauses.additionalFrom, ...typeClauses.additionalFrom]
		};
	let orderClauses = 'song ASC';
	let limitClause = '';
	let offsetClause = '';
	if (params.order === 'likes') orderClauses = 'likes DESC';
	if (params.order === 'az') orderClauses = 'song ASC';
	if (params.order === 'language') orderClauses = 'language ASC';
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	// If we're asking for random songs, here we modify the query to get them.
	if (params.random > 0) {
		orderClauses = `RANDOM(), ${orderClauses}`;
		limitClause = `LIMIT ${params.random}`;
	}
	const query = sql.selectSuggestions(
		yesqlPayload.sql,
		orderClauses,
		limitClause,
		offsetClause,
		yesqlPayload.additionalFrom,
	);
	const res = await db().query(yesql(query)(yesqlPayload.params));
	return res.rows;
}

export async function selectSuggestionsLanguages() {
	const res = await db().query(sql.selectSuggestionsLanguages);
	return res.rows;
}

export async function updateSuggestionSearchVector() {
	await db().query(sql.updateSuggestionSearchVector);
}

export async function insertSuggestion(suggestions: Suggestion[]) {
	const params = suggestions.map(s => [
		s.song,
		s.language,
		s.source,
		new Date()
	]);
	await transaction({sql: sql.insertSuggestion, params});
}

export async function addLikeToSuggestion(id: number) {
	return db().query(sql.addLikeToSuggestion, [id]);
}

export async function deleteSuggestion(id: number) {
	return db().query(sql.deleteSuggestion, [id]);
}
