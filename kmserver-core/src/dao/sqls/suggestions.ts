export const selectSuggestions = (filterClauses: string[], orderClauses: string, limitClause: string, offsetClause: string, additionalFrom: string[]) => `SELECT
pk_id_suggest as id,
song,
language,
source,
likes::integer,
created_at,
count(pk_id_suggest) OVER()::integer AS count
FROM suggestions
${additionalFrom.join('')}
WHERE 1 = 1
  ${filterClauses.map(clause => `AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
ORDER BY ${orderClauses}, id ASC
${limitClause}
${offsetClause}
`;

export const selectSuggestionsLanguages = `
SELECT
DISTINCT
language
FROM suggestions
ORDER BY language
`;

export const updateSuggestionSearchVector = `
UPDATE suggestions SET search_vector = to_tsvector('public.unaccent_conf', song) ||
	to_tsvector('public.unaccent_conf', language);
`;

export const insertSuggestion = `
INSERT INTO suggestions (song, language, source, created_at)
VALUES($1, $2, $3, $4)
ON CONFLICT DO NOTHING;
`;

export const addLikeToSuggestion = `
UPDATE suggestions
SET likes = likes+1
WHERE pk_id_suggest = $1
`;

export const deleteSuggestion = `
DELETE FROM suggestions
WHERE pk_id_suggest = $1
`;

export const selectUsersSuggestion = `
SELECT fk_login AS username
FROM users_suggestions_liked
WHERE fk_id_suggest = $1
`;

export const insertUsersSuggestion = `
INSERT INTO users_suggestions_liked VALUES($1, $2)
`;