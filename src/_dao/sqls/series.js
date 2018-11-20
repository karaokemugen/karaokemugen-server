// SQL for series

export const getSeries = (filterClauses, lang) => `
SELECT * FROM (
SELECT s.pk_id_serie AS serie_id,
	s.name AS name,
	COALESCE(
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = s.pk_id_serie AND sl.lang = ${lang.main}),
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = s.pk_id_serie AND sl.lang = ${lang.fallback}),
		s.name)
	AS i18n_name,
	s.aliases AS aliases,
	s.sid AS sid,
	array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name))) as i18n,
	string_agg(sl.name,' ') as search,
	s.seriefile AS seriefile
	FROM serie s
	LEFT JOIN serie_lang sl ON sl.fk_id_serie = s.pk_id_serie
	GROUP BY s.pk_id_serie
	ORDER BY i18n_name) AS sub_request
	WHERE 1 = 1
	${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
	`;
