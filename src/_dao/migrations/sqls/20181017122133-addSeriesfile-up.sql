/* Replace with your SQL commands */

ALTER TABLE serie ADD COLUMN seriefile character varying;

DROP VIEW all_karas;
CREATE VIEW all_karas AS
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
  s.seriefile,
  jsonb_agg(DISTINCT(s18.serie_langs)::jsonb) as serie_i18n,
  string_agg(DISTINCT(s.name),',') AS serie,
  jsonb_agg(DISTINCT(s.aliases)) AS serie_altname,
  array_agg(DISTINCT(s.pk_id_serie)) AS serie_id,
  string_agg(DISTINCT(t_singer.name),',') AS singer,
  string_agg(DISTINCT(t_songtype.name),',') AS songtype,
  string_agg(DISTINCT(t_creator.name),',') AS creator,
  string_agg(DISTINCT(t_language.name),',') AS language,
  string_agg(DISTINCT(t_author.name),',') AS author,
  string_agg(DISTINCT(t_misc.name),',') AS misc,
  string_agg(DISTINCT(t_songwriter.name),',') AS songwriter,
  string_agg(DISTINCT(t_group.name),',') AS group,
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
LEFT JOIN tag t_songwriter ON kt.fk_id_tag = t_songwriter.pk_id_tag AND t_songwriter.tagtype = 8
GROUP BY k.pk_id_kara, s.pk_id_serie
ORDER BY language, serie, singer, songtype DESC, songorder;
