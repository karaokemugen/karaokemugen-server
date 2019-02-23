
CREATE MATERIALIZED VIEW all_series AS
SELECT s.pk_id_serie AS serie_id,
	s.name AS name,
	s.aliases AS aliases,
	s.sid AS sid,
	array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name))) as i18n,
	string_agg(sl.name,' ') as search,
	s.seriefile AS seriefile,
	(SELECT COUNT(ks.fk_id_kara) FROM kara_serie ks WHERE ks.fk_id_serie = s.pk_id_serie) AS karacount
	FROM serie s
	LEFT JOIN serie_lang sl ON sl.fk_id_serie = s.pk_id_serie
	GROUP BY s.pk_id_serie
    ORDER BY name;

CREATE INDEX idx_as_id ON all_series(serie_id);
CREATE INDEX idx_as_name ON all_series(name);
CREATE INDEX idx_as_sid ON all_series(sid);
