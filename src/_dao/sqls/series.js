// SQL for series

export const countKaras = (filterClauses) => `
SELECT COUNT(serie_id) AS count
FROM all_series
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
`;

export const getSeries = (filterClauses, lang, limitClause, offsetClause) => `
SELECT aseries.serie_id AS serie_id,
	aseries.name AS name,
	COALESCE(
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = aseries.serie_id AND sl.lang = ${lang.main}),
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = aseries.serie_id AND sl.lang = ${lang.fallback}),
		aseries.name)
	AS i18n_name,
	aseries.aliases AS aliases,
	aseries.sid AS sid,
	aseries.i18n AS i18n,
	aseries.search AS search,
	aseries.seriefile AS seriefile,
	aseries.karacount::integer AS karacount
	FROM all_series aseries
	WHERE 1 = 1
	${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
	ORDER BY i18n_name
	${limitClause}
	${offsetClause}
	`;
