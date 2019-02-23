// SQL for series

export const countKaras = (filterClauses) => `
SELECT COUNT(sid) AS count
FROM all_series
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
`;

export const getSeries = (filterClauses, lang, limitClause, offsetClause) => `
SELECT aseries.sid AS sid,
	aseries.name AS name,
	COALESCE(
		(SELECT name FROM all_kara_serie_langs WHERE lang = ${lang.main}),
	  	(SELECT name FROM all_kara_serie_langs WHERE lang = ${lang.fallback}),
		aseries.name)
	AS i18n_name,
	aseries.aliases AS aliases,
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
