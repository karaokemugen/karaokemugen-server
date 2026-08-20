import {db, paramWords, prepareNamedParamsQuery, transaction} from '../lib/dao/database.js';
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
	const extraParams: any = {};
	if (+params.from > 0) {
		extraParams.from = +params.from
		offsetClause = `OFFSET :from `;
	}
	if (+params.size > 0) {
		extraParams.size = +params.size
		limitClause = `LIMIT :size `;
	}
	// If we're asking for random songs, here we modify the query to get them.
	if (+params.random > 0) {
		orderClauses = `RANDOM()`;
		limitClause = `LIMIT :random`;
	}
	const query = sql.selectSuggestions(
		yesqlPayload.sql,
		orderClauses,
		limitClause,
		offsetClause,
		yesqlPayload.additionalFrom,
	);
	const res = await db().query(prepareNamedParamsQuery(query)({
		...yesqlPayload.params,
		...extraParams
	}));
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

export async function getSuggestionByID(id: number) {
	return db().query(sql.selectUsersSuggestion, [id]);
}

export async function addUsersSuggestion(id: number, username: string) {
	return db().query(sql.insertUsersSuggestion, [id, username])
}