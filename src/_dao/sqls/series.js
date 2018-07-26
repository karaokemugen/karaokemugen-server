// SQL for series

export const getSeries = (filterClauses, lang) => `
SELECT s.pk_id_serie AS serie_id,
	s.name AS name,
	COALESCE(
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = s.pk_id_serie AND sl.lang = ${lang.main}),
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = s.pk_id_serie AND sl.lang = ${lang.fallback}),
		s.name)
	AS i18n_name,
	s.aliases AS aliases
	FROM serie s
	WHERE 1 = 1
	${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
	ORDER BY i18n_name;
	`;
