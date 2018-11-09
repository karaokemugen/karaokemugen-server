// SQL for series

export const getSeries = (filterClauses, lang) => `
SELECT s.pk_id_serie AS serie_id,
	s.name AS name,
	COALESCE(
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = s.pk_id_serie AND sl.lang = ${lang.main}),
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = s.pk_id_serie AND sl.lang = ${lang.fallback}),
		s.name)
	AS i18n_name,
	s.aliases AS aliases,
	s.sid AS sid,
	jsonb_agg(DISTINCT(sl.serie_langs)::jsonb) as i18n,
	s.seriefile AS seriefile
	FROM serie s, serie_lang sl
	WHERE s.pk_id_serie = sl.fk_id_serie
	${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
	ORDER BY i18n_name;
	`;
