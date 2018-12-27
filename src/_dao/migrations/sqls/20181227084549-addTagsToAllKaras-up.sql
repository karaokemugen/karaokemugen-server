DROP MATERIALIZED VIEW all_karas;

CREATE MATERIALIZED VIEW all_karas AS
WITH series_i18n(serie_id, serie_langs) AS (
     SELECT sl.fk_id_serie, array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name)))
     FROM serie_lang sl
     GROUP BY sl.fk_id_serie
)

SELECT
 k.pk_id_kara AS kara_id,
  k.kid,
  k.title,
  k.duration,
  k.gain,
  k.year,
  k.mediafile,
  k.subfile,
  k.created_at,
  k.modified_at,
  k.songorder,
  k.karafile,
  k.mediasize,
  jsonb_agg(DISTINCT(s.seriefile)) AS seriefiles,
  jsonb_agg(DISTINCT(s.sid)) AS sid,
  jsonb_agg(DISTINCT(s18.serie_langs)::jsonb) as serie_i18n,
  string_agg(DISTINCT(s.name),',') AS serie,
  jsonb_agg(DISTINCT(s.aliases)) AS serie_altname,
  array_agg(DISTINCT(s.pk_id_serie)) AS serie_id,
  string_agg(DISTINCT(t_singer.name),',') AS singers,
  string_agg(DISTINCT(t_songtype.name),',') AS songtype,
  string_agg(DISTINCT(t_creator.name),',') AS creators,
  string_agg(DISTINCT(t_language.name),',') AS languages,
  string_agg(DISTINCT(t_author.name),',') AS authors,
  string_agg(DISTINCT(t_misc.name),',') AS misc_tags,
  string_agg(DISTINCT(t_songwriter.name),',') AS songwriters,
  string_agg(DISTINCT(t_group.name),',') AS groups,
  jsonb_agg(to_jsonb(t) - 't.pk_id_tag') AS tags,
  array_agg(DISTINCT(kt.fk_id_tag)) AS all_tags_id
FROM kara k
LEFT JOIN kara_serie ks ON k.pk_id_kara = ks.fk_id_kara
LEFT JOIN serie s ON ks.fk_id_serie = s.pk_id_serie
LEFT JOIN series_i18n s18 ON s18.serie_id = ks.fk_id_serie
LEFT JOIN kara_tag kt ON k.pk_id_kara = kt.fk_id_kara
LEFT JOIN tag t_singer ON kt.fk_id_tag = t_singer.pk_id_tag AND t_singer.tagtype = 2
LEFT JOIN tag t_songtype ON kt.fk_id_tag = t_songtype.pk_id_tag AND t_songtype.tagtype = 3
LEFT JOIN tag t_creator ON kt.fk_id_tag = t_creator.pk_id_tag AND t_creator.tagtype = 4
LEFT JOIN tag t_language ON kt.fk_id_tag = t_language.pk_id_tag AND t_language.tagtype = 5
LEFT JOIN tag t_author ON kt.fk_id_tag = t_author.pk_id_tag AND t_author.tagtype = 6
LEFT JOIN tag t_misc ON kt.fk_id_tag = t_misc.pk_id_tag AND t_misc.tagtype = 7
LEFT JOIN tag t_group ON kt.fk_id_tag = t_group.pk_id_tag AND t_group.tagtype = 9
LEFT JOIN tag t ON kt.fk_id_tag = t.pk_id_tag
LEFT JOIN tag t_songwriter ON kt.fk_id_tag = t_songwriter.pk_id_tag AND t_songwriter.tagtype = 8

GROUP BY k.pk_id_kara
ORDER BY languages, serie, singers, songtype DESC, songorder;

CREATE INDEX idx_ak_created ON all_karas(created_at DESC);
CREATE INDEX idx_ak_name ON all_karas(serie NULLS LAST);
CREATE INDEX idx_ak_songtype ON all_karas(songtype DESC);
CREATE INDEX idx_ak_songorder ON all_karas(songorder);
CREATE INDEX idx_ak_title ON all_karas(title);
CREATE INDEX idx_ak_singer ON all_karas(singers);
CREATE INDEX idx_ak_author ON all_karas(authors);
CREATE INDEX idx_ak_language ON all_karas(languages);
CREATE INDEX idx_ak_creator ON all_karas(creators);
CREATE INDEX idx_ak_misc ON all_karas(misc_tags);
CREATE INDEX idx_ak_year ON all_karas(year);
CREATE INDEX idx_ak_group ON all_karas(groups);
CREATE INDEX idx_ak_songwriter ON all_karas(songwriters);
CREATE INDEX idx_ak_kid ON all_karas(kid);