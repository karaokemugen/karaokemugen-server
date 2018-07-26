// SQL for series

export const getSeries = (filterClauses, lang) => `
SELECT s.pk_id_serie AS serie_id,
	s.name AS name,
	COALESCE(
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = s.pk_id_serie AND sl.lang = ${lang.main}),
		(SELECT sl.name FROM serie_lang sl WHERE sl.fk_id_serie = s.pk_id_serie AND sl.lang = ${lang.fallback}),
		s.name)
	AS i18n_name,
	s.altname AS aliases,
	array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name))) as i18n
	FROM serie s
	WHERE 1 = 1
	${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
	ORDER BY name;
	`;
